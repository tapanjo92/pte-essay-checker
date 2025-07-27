import { defineFunction } from '@aws-amplify/backend';

export const submitEssayToQueue = defineFunction({
  name: 'submitEssayToQueue',
  runtime: 20,
  timeoutSeconds: 30, // Quick function, just submits to queue
  memoryMB: 256,
  resourceGroupName: 'data', // Assign to data stack
  environment: {
    // Table names and queue URL for your deployment
    ESSAY_TABLE_NAME: 'Essay-3jvy5oiy4fewzg24gsbnrxx5oi-NONE',
    ESSAY_QUEUE_URL: 'https://sqs.ap-south-1.amazonaws.com/493093635246/pte-essay-queue-main',
    // X-Ray configuration
    AWS_XRAY_CONTEXT_MISSING: 'LOG_ERROR',
    AWS_XRAY_TRACING_NAME: 'PTE-Essay-SubmitToQueue',
  }
});