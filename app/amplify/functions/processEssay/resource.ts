import { defineFunction } from '@aws-amplify/backend';

export const processEssay = defineFunction({
  name: 'processEssay',
  runtime: 20,
  timeoutSeconds: 300,
  memoryMB: 512,
  resourceGroupName: 'data',
  environment: {
    BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
    BEDROCK_REGION: 'ap-south-1',
  },
});