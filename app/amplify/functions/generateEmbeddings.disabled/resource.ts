import { defineFunction } from '@aws-amplify/backend';

export const generateEmbeddings = defineFunction({
  name: 'generateEmbeddings',
  runtime: 20,
  timeoutSeconds: 900, // 15 minutes for processing all essays
  memoryMB: 512,
  environment: {
    BEDROCK_MODEL_ID: 'amazon.titan-embed-text-v2:0',
    BEDROCK_REGION: 'us-east-1',
    // Table name will be set dynamically in backend.ts
    // GOLD_STANDARD_TABLE_NAME will be set dynamically in backend.ts
  }
});