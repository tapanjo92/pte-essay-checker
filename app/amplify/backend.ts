import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { processEssay } from './functions/processEssay/resource';
import { submitEssayToQueue } from './functions/submitEssayToQueue/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Duration, Stack } from 'aws-cdk-lib';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import { CfnSamplingRule } from 'aws-cdk-lib/aws-xray';
import { Alarm, TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  processEssay,
  submitEssayToQueue,
});

// Get the stack for adding resources
const stack = backend.createStack('AppStack');

// Enable X-Ray tracing for Lambda functions
backend.processEssay.resources.cfnResources.cfnFunction.tracingConfig = {
  mode: 'Active'
};

backend.submitEssayToQueue.resources.cfnResources.cfnFunction.tracingConfig = {
  mode: 'Active'
};

// Grant X-Ray permissions to Lambda functions
backend.processEssay.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'xray:PutTraceSegments',
      'xray:PutTelemetryRecords'
    ],
    resources: ['*'],
  })
);

backend.submitEssayToQueue.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'xray:PutTraceSegments',
      'xray:PutTelemetryRecords'
    ],
    resources: ['*'],
  })
);

// Grant the processEssay function access to Bedrock
backend.processEssay.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['bedrock:InvokeModel'],
    resources: ['*'],
  })
);

// Grant the processEssay function access to SES for sending emails
backend.processEssay.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: ['*'],
  })
);

// Grant the processEssay function access to data
backend.data.resources.tables["Essay"].grantReadWriteData(
  backend.processEssay.resources.lambda
);
backend.data.resources.tables["Result"].grantReadWriteData(
  backend.processEssay.resources.lambda
);
backend.data.resources.tables["User"].grantReadData(
  backend.processEssay.resources.lambda
);
// Grant read access to GoldStandardEssay table for RAG
backend.data.resources.tables["GoldStandardEssay"].grantReadData(
  backend.processEssay.resources.lambda
);

// Add explicit permission for querying indexes
backend.processEssay.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:Query'],
    resources: [
      backend.data.resources.tables["GoldStandardEssay"].tableArn,
      `${backend.data.resources.tables["GoldStandardEssay"].tableArn}/index/*`
    ],
  })
);

// Enable X-Ray tracing for AppSync API
const apiStack = backend.data.resources.graphqlApi.stack;
backend.data.resources.cfnResources.cfnGraphqlApi.xrayEnabled = true;

// Add X-Ray sampling rules for cost optimization
const dataStack = Stack.of(backend.data);

// Basic sampling rule - sample 10% of requests after the first one per second
// Generate a simple unique suffix from the branch name
const branchName = process.env.AWS_BRANCH || 'main';
const uniqueSuffix = branchName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
new CfnSamplingRule(dataStack, 'BasicSamplingRule', {
  samplingRule: {
    ruleName: `PTE-Basic-${uniqueSuffix}`,
    priority: 9000,
    fixedRate: 0.1, // 10% sampling rate
    reservoirSize: 1, // 1 request per second guaranteed
    serviceName: '*',
    serviceType: '*',
    host: '*',
    httpMethod: '*',
    urlPath: '*',
    resourceArn: '*',
    version: 1,
  },
});

// High priority rule for essay processing - sample more aggressively for debugging
new CfnSamplingRule(dataStack, 'EssayProcessingSamplingRule', {
  samplingRule: {
    ruleName: `PTE-Essay-${uniqueSuffix}`,
    priority: 8000,
    fixedRate: 0.25, // 25% sampling for essay processing
    reservoirSize: 2, // 2 requests per second guaranteed
    serviceName: 'processEssay',
    serviceType: 'AWS::Lambda::Function',
    host: '*',
    httpMethod: '*',
    urlPath: '*',
    resourceArn: '*',
    version: 1,
  },
});

// Low sampling for health checks and routine operations
new CfnSamplingRule(dataStack, 'HealthCheckSamplingRule', {
  samplingRule: {
    ruleName: `PTE-Health-${uniqueSuffix}`,
    priority: 7000,
    fixedRate: 0.01, // 1% sampling for health checks
    reservoirSize: 0,
    serviceName: '*',
    serviceType: '*',
    host: '*',
    httpMethod: 'GET',
    urlPath: '*health*',
    resourceArn: '*',
    version: 1,
  },
});

// Note: Environment variables are configured in the respective resource.ts files

// Create Dead Letter Queue for failed messages
const dlq = new Queue(dataStack, 'EssayProcessingDLQ', {
  queueName: `pte-essay-dlq-${uniqueSuffix}`,
  retentionPeriod: Duration.days(14), // Keep failed messages for 2 weeks for investigation
});

// Create SQS Queue in a way that avoids circular dependencies
const essayQueue = new Queue(dataStack, 'EssayProcessingQueue', {
  queueName: `pte-essay-queue-${uniqueSuffix}`,
  visibilityTimeout: Duration.seconds(900), // 15 minutes
  retentionPeriod: Duration.days(1),
  receiveMessageWaitTime: Duration.seconds(20), // Long polling
  deadLetterQueue: {
    queue: dlq,
    maxReceiveCount: 3, // Move to DLQ after 3 failed attempts
  },
});

// Configure processEssay Lambda to be triggered by SQS with increased concurrency
backend.processEssay.resources.lambda.addEventSource(
  new SqsEventSource(essayQueue, {
    batchSize: 1, // Process one essay at a time due to rate limits
    maxConcurrency: 25, // Process up to 25 essays concurrently
    maxBatchingWindow: Duration.seconds(2), // Small batching window for efficiency
    reportBatchItemFailures: true, // Allow partial batch failures
  })
);

// Grant permissions
essayQueue.grantConsumeMessages(backend.processEssay.resources.lambda);
essayQueue.grantSendMessages(backend.submitEssayToQueue.resources.lambda);
dlq.grantConsumeMessages(backend.processEssay.resources.lambda); // Allow Lambda to read from DLQ

// Create SNS topic for DLQ alerts
const dlqAlertTopic = new Topic(dataStack, 'DLQAlertTopic', {
  topicName: `pte-dlq-alerts-${uniqueSuffix}`,
  displayName: 'PTE Essay Processing DLQ Alerts',
});

// Subscribe email to alerts (you should update this email)
dlqAlertTopic.addSubscription(
  new EmailSubscription('tapmit25@gmail.com') // TODO: Change to your ops email
);

// Create CloudWatch alarm for DLQ
const dlqAlarm = new Alarm(dataStack, 'DLQMessagesAlarm', {
  alarmName: `pte-dlq-msgs-${uniqueSuffix}`,
  alarmDescription: 'Alert when essays fail processing and end up in DLQ',
  metric: dlq.metricApproximateNumberOfMessagesVisible({
    period: Duration.minutes(1),
  }),
  threshold: 1,
  evaluationPeriods: 1,
  treatMissingData: TreatMissingData.NOT_BREACHING,
});

// Add SNS action to alarm
dlqAlarm.addAlarmAction(new SnsAction(dlqAlertTopic));

// Also monitor if messages are sitting in DLQ too long
const dlqOldMessagesAlarm = new Alarm(dataStack, 'DLQOldMessagesAlarm', {
  alarmName: `pte-dlq-old-${uniqueSuffix}`,
  alarmDescription: 'Alert when messages in DLQ are older than 1 hour',
  metric: dlq.metricApproximateAgeOfOldestMessage({
    period: Duration.minutes(5),
  }),
  threshold: 3600, // 1 hour in seconds
  evaluationPeriods: 1,
  treatMissingData: TreatMissingData.NOT_BREACHING,
});

dlqOldMessagesAlarm.addAlarmAction(new SnsAction(dlqAlertTopic));

// Grant access to tables
backend.data.resources.tables["Essay"].grantReadWriteData(
  backend.submitEssayToQueue.resources.lambda
);

// Export DLQ URL for monitoring and manual processing
backend.addOutput({
  custom: {
    DLQUrl: dlq.queueUrl,
    DLQName: dlq.queueName,
    MainQueueUrl: essayQueue.queueUrl,
  },
});

// Set environment variables dynamically
backend.processEssay.resources.lambda.addEnvironment(
  'ESSAY_TABLE_NAME',
  backend.data.resources.tables["Essay"].tableName
);
backend.processEssay.resources.lambda.addEnvironment(
  'RESULT_TABLE_NAME',
  backend.data.resources.tables["Result"].tableName
);
backend.processEssay.resources.lambda.addEnvironment(
  'USER_TABLE_NAME',
  backend.data.resources.tables["User"].tableName
);
backend.processEssay.resources.lambda.addEnvironment(
  'GOLD_STANDARD_TABLE_NAME',
  backend.data.resources.tables["GoldStandardEssay"].tableName
);

// Add APP_URL environment variable
const appId = process.env.AWS_APP_ID || 'd1hed7gjlm8m1f';
const branch = process.env.AWS_BRANCH || 'main';
backend.processEssay.resources.lambda.addEnvironment(
  'APP_URL',
  `https://${branch}.${appId}.amplifyapp.com`
);

// Set environment variables for submitEssayToQueue
backend.submitEssayToQueue.resources.lambda.addEnvironment(
  'ESSAY_TABLE_NAME',
  backend.data.resources.tables["Essay"].tableName
);
backend.submitEssayToQueue.resources.lambda.addEnvironment(
  'ESSAY_QUEUE_URL',
  essayQueue.queueUrl
);