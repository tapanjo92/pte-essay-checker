import { defineFunction } from '@aws-amplify/backend';

export const processEssay = defineFunction({
  name: 'processEssay',
  runtime: 20,
  timeoutSeconds: 300,
  memoryMB: 1024, // Increased to 1GB for better performance with concurrent processing
  environment: {
    BEDROCK_MODEL_ID: 'anthropic.claude-3-haiku-20240307-v1:0',
    BEDROCK_REGION: 'ap-south-1',
    APP_URL: process.env.APP_URL || 'https://main.d1hed7gjlm8m1f.amplifyapp.com',
    // X-Ray configuration
    AWS_XRAY_CONTEXT_MISSING: 'LOG_ERROR',
    AWS_XRAY_TRACING_NAME: 'PTE-Essay-ProcessEssay',
    // These will be set dynamically during deployment
    ESSAY_TABLE_NAME: process.env.ESSAY_TABLE_NAME || '',
    RESULT_TABLE_NAME: process.env.RESULT_TABLE_NAME || '',
    USER_TABLE_NAME: process.env.USER_TABLE_NAME || '',
    GOLD_STANDARD_TABLE_NAME: process.env.GOLD_STANDARD_TABLE_NAME || '',
  },
});