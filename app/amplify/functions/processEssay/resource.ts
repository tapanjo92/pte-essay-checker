import { defineFunction } from '@aws-amplify/backend';

export const processEssay = defineFunction({
  name: 'processEssay',
  runtime: 20,
  timeoutSeconds: 300,
  memoryMB: 1024, // Increased to 1GB for better performance with concurrent processing
  resourceGroupName: 'data',
  environment: {
    BEDROCK_MODEL_ID: 'anthropic.claude-3-haiku-20240307-v1:0',
    BEDROCK_REGION: 'ap-south-1',
    APP_URL: 'http://3.109.164.76:3000',
    ESSAY_TABLE_NAME: 'Essay-3jvy5oiy4fewzg24gsbnrxx5oi-NONE',
    RESULT_TABLE_NAME: 'Result-3jvy5oiy4fewzg24gsbnrxx5oi-NONE',
    USER_TABLE_NAME: 'User-3jvy5oiy4fewzg24gsbnrxx5oi-NONE',
    GOLD_STANDARD_TABLE_NAME: 'GoldStandardEssay-3jvy5oiy4fewzg24gsbnrxx5oi-NONE',
    // X-Ray configuration
    AWS_XRAY_CONTEXT_MISSING: 'LOG_ERROR',
    AWS_XRAY_TRACING_NAME: 'PTE-Essay-ProcessEssay',
  },
});