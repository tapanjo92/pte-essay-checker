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

// Pass the actual table names to the Lambda function
backend.processEssay.resources.lambda.addEnvironment(
  "ESSAY_TABLE_NAME",
  backend.data.resources.tables["Essay"].tableName
);
backend.processEssay.resources.lambda.addEnvironment(
  "RESULT_TABLE_NAME", 
  backend.data.resources.tables["Result"].tableName
);
backend.processEssay.resources.lambda.addEnvironment(
  "USER_TABLE_NAME",
  backend.data.resources.tables["User"].tableName
);

// Set the Bedrock model to Llama 3 8B Instruct
backend.processEssay.resources.lambda.addEnvironment(
  "BEDROCK_MODEL_ID",
  "meta.llama3-8b-instruct-v1:0"
);

// Set the Bedrock region to ap-south-1
backend.processEssay.resources.lambda.addEnvironment(
  "BEDROCK_REGION",
  "ap-south-1"
);

// Create SQS Queue in a way that avoids circular dependencies
const stack = Stack.of(backend.data);
const essayQueue = new Queue(stack, 'EssayProcessingQueue', {
  queueName: 'pte-essay-processing-queue',
  visibilityTimeout: Duration.seconds(900), // 15 minutes
  retentionPeriod: Duration.days(1),
  receiveMessageWaitTime: Duration.seconds(20), // Long polling
});

// Configure processEssay Lambda to be triggered by SQS
backend.processEssay.resources.lambda.addEventSource(
  new SqsEventSource(essayQueue, {
    batchSize: 1, // Process one essay at a time due to rate limits
    maxBatchingWindow: Duration.seconds(0), // Process immediately
    reportBatchItemFailures: true, // Allow partial batch failures
  })
);

// Grant permissions
essayQueue.grantConsumeMessages(backend.processEssay.resources.lambda);
essayQueue.grantSendMessages(backend.submitEssayToQueue.resources.lambda);

// Grant access to tables
backend.data.resources.tables["Essay"].grantReadWriteData(
  backend.submitEssayToQueue.resources.lambda
);

// Pass environment variables
backend.submitEssayToQueue.resources.lambda.addEnvironment(
  "ESSAY_QUEUE_URL",
  essayQueue.queueUrl
);
backend.submitEssayToQueue.resources.lambda.addEnvironment(
  "ESSAY_TABLE_NAME",
  backend.data.resources.tables["Essay"].tableName
);