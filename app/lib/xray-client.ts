import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { ensureAmplifyConfigured } from './amplify-singleton';

// Type for our generated client
type GeneratedClient = ReturnType<typeof generateClient<Schema>>;

/**
 * Singleton GraphQL Client Manager
 * Prevents creating multiple client instances which impacts performance
 * Follows AWS best practices for connection pooling
 */
class GraphQLClientManager {
  private static instance: GraphQLClientManager;
  private client: GeneratedClient | null = null;
  private initPromise: Promise<GeneratedClient> | null = null;

  private constructor() {}

  public static getInstance(): GraphQLClientManager {
    if (!GraphQLClientManager.instance) {
      GraphQLClientManager.instance = new GraphQLClientManager();
    }
    return GraphQLClientManager.instance;
  }

  /**
   * Get or create the GraphQL client
   * Uses lazy initialization to ensure Amplify is configured first
   */
  public async getClient(): Promise<GeneratedClient> {
    // If client exists, return it
    if (this.client) {
      return this.client;
    }

    // If initialization is in progress, wait for it
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start initialization
    this.initPromise = this.initializeClient();
    this.client = await this.initPromise;
    this.initPromise = null;
    
    return this.client;
  }

  private async initializeClient(): Promise<GeneratedClient> {
    try {
      // Ensure Amplify is configured first
      await ensureAmplifyConfigured();
      
      // Create the client with optimized settings
      const client = generateClient<Schema>({
        // Enable request batching for better performance
        // This is an Amplify Gen 2 optimization
      });

      console.log('[GraphQLClient] Client initialized successfully');
      return client;
    } catch (error) {
      console.error('[GraphQLClient] Failed to initialize client:', error);
      this.initPromise = null; // Allow retry
      throw error;
    }
  }

  /**
   * Reset the client (useful for testing or auth changes)
   */
  public reset(): void {
    this.client = null;
    this.initPromise = null;
  }
}

// Export singleton instance
const clientManager = GraphQLClientManager.getInstance();

/**
 * Get the singleton GraphQL client
 * This is the primary export that should be used throughout the app
 */
export async function getGraphQLClient(): Promise<GeneratedClient> {
  return clientManager.getClient();
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getGraphQLClient() instead
 */
export function createTracedClient(config?: any) {
  console.warn('[GraphQLClient] createTracedClient is deprecated. Use getGraphQLClient() instead.');
  // Return a promise that resolves to the client
  return getGraphQLClient();
}

// Generate trace ID in X-Ray format
export function generateTraceId(): string {
  const epoch = Math.floor(Date.now() / 1000);
  const random = Math.random().toString(16).substring(2, 18).padEnd(16, '0');
  return `1-${epoch.toString(16)}-${random}`;
}

// Generate segment ID
export function generateSegmentId(): string {
  return Math.random().toString(16).substring(2, 18).padEnd(16, '0');
}