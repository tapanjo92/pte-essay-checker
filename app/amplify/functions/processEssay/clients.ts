import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SESClient } from '@aws-sdk/client-ses';
import * as AWSXRay from 'aws-xray-sdk-core';

// Capture AWS SDK v3 clients with X-Ray
const { captureAWSv3Client } = AWSXRay;

// Initialize clients with connection pooling and reuse across invocations
// These are created outside the handler for connection reuse

// Bedrock client with connection pooling
export const bedrockClient = captureAWSv3Client(new BedrockRuntimeClient({ 
  region: process.env.BEDROCK_REGION || 'us-east-1',
  maxAttempts: 3,
  requestHandler: {
    connectionTimeout: 5000,
    socketTimeout: 60000,
  }
}));

// DynamoDB client with connection pooling
const dynamoClient = captureAWSv3Client(new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
  requestHandler: {
    connectionTimeout: 5000,
    socketTimeout: 5000,
  }
}));

// Document client with optimized settings
export const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// SES client with connection pooling
export const sesClient = captureAWSv3Client(new SESClient({ 
  region: process.env.AWS_REGION || 'us-east-1',
  maxAttempts: 3,
  requestHandler: {
    connectionTimeout: 5000,
    socketTimeout: 5000,
  }
}));

// Warm connections function (optional - can be called in Lambda init)
export async function warmConnections() {
  try {
    // These calls establish connections that will be reused
    await Promise.all([
      docClient.send(new QueryCommand({
        TableName: process.env.ESSAY_TABLE_NAME || '',
        Limit: 1,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: { ':id': 'warmup' }
      })).catch(() => {}), // Ignore errors for warmup
    ]);
  } catch (error) {
    // Ignore warmup errors
    console.log('Connection warmup completed');
  }
}