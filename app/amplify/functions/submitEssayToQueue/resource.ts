import { defineFunction } from '@aws-amplify/backend';

export const submitEssayToQueue = defineFunction({
  name: 'submitEssayToQueue',
  runtime: 20,
  timeoutSeconds: 30, // Quick function, just submits to queue
  memoryMB: 256,
  resourceGroupName: 'data', // Assign to data stack
  environment: {
    // These will be replaced with actual values after deployment
    ESSAY_TABLE_NAME: 'Essay-PLACEHOLDER',
    ESSAY_QUEUE_URL: 'https://sqs.ap-south-1.amazonaws.com/PLACEHOLDER',
    // X-Ray configuration
    AWS_XRAY_CONTEXT_MISSING: 'LOG_ERROR',
    AWS_XRAY_TRACING_NAME: 'PTE-Essay-SubmitToQueue',
  }
});