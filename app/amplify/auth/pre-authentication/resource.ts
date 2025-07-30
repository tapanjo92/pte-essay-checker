import { defineFunction } from '@aws-amplify/backend';

export const preAuthentication = defineFunction({
  name: 'pre-authentication',
  entry: './handler.ts',
  resourceGroupName: 'auth'
});