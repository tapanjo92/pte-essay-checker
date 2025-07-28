import { defineFunction } from '@aws-amplify/backend';

export const submitEssayToQueue = defineFunction({
  name: 'submitEssayToQueue',
  runtime: 20,
  timeoutSeconds: 30, // Quick function, just submits to queue
  memoryMB: 256,
  resourceGroupName: 'data', // Assign to data stack
  environment: {
    // X-Ray configuration
    AWS_XRAY_CONTEXT_MISSING: 'LOG_ERROR',
    AWS_XRAY_TRACING_NAME: 'PTE-Essay-SubmitToQueue',
    // These will be set dynamically during deployment
    ESSAY_TABLE_NAME: process.env.ESSAY_TABLE_NAME || '',
    ESSAY_QUEUE_URL: process.env.ESSAY_QUEUE_URL || '',
  }
});