import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

// Generate trace ID in X-Ray format
function generateTraceId(): string {
  const epoch = Math.floor(Date.now() / 1000);
  const random = Math.random().toString(16).substring(2, 18).padEnd(16, '0');
  return `1-${epoch.toString(16)}-${random}`;
}

// Generate segment ID
function generateSegmentId(): string {
  return Math.random().toString(16).substring(2, 18).padEnd(16, '0');
}

// Create a custom client with X-Ray tracing headers
export function createTracedClient(config?: any) {
  const client = generateClient<Schema>(config);
  
  // For now, we'll use the standard client
  // X-Ray tracing will be handled at the AppSync level
  // which we've already enabled in backend.ts
  
  return client;
}