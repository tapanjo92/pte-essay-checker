import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { processEssay } from './functions/processEssay/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  processEssay,
});

// Grant the processEssay function access to Bedrock
backend.processEssay.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['bedrock:InvokeModel'],
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

// Pass the actual table names to the Lambda function
backend.processEssay.resources.lambda.addEnvironment(
  "ESSAY_TABLE_NAME",
  backend.data.resources.tables["Essay"].tableName
);
backend.processEssay.resources.lambda.addEnvironment(
  "RESULT_TABLE_NAME", 
  backend.data.resources.tables["Result"].tableName
);