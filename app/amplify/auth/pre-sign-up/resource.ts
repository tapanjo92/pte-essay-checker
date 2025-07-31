import { defineFunction } from '@aws-amplify/backend';

export const preSignUp = defineFunction({
  name: 'pre-sign-up-trigger',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 60,
  memoryMB: 256,
  resourceGroupName: 'auth', // Assign to auth stack to avoid circular dependency
});