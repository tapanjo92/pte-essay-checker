import { defineFunction } from '@aws-amplify/backend';

export const generateEmbeddings = defineFunction({
  name: 'generateEmbeddings',
  runtime: 20,
  timeoutSeconds: 900, // 15 minutes for processing all essays
  memoryMB: 512,
  environment: {
    BEDROCK_MODEL_ID: 'amazon.titan-embed-text-v2:0',
    BEDROCK_REGION: 'ap-south-1',
    GOLD_STANDARD_TABLE_NAME: 'GoldStandardEssay-3jvy5oiy4fewzg24gsbnrxx5oi-NONE',
  }
});