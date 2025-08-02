/**
 * AWS Amplify Singleton Configuration Manager
 * Ensures Amplify is configured only once to prevent race conditions
 * Follows AWS L10 architecture patterns for initialization
 */

import { Amplify } from 'aws-amplify';
import type { ResourcesConfig } from 'aws-amplify';
import amplifyConfig from '@/amplify_outputs.json';

class AmplifyConfigurationManager {
  private static instance: AmplifyConfigurationManager;
  private isConfigured: boolean = false;
  private configPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): AmplifyConfigurationManager {
    if (!AmplifyConfigurationManager.instance) {
      AmplifyConfigurationManager.instance = new AmplifyConfigurationManager();
    }
    return AmplifyConfigurationManager.instance;
  }

  /**
   * Configure Amplify with singleton pattern to prevent multiple configurations
   * This ensures thread-safe initialization in Next.js environment
   */
  public async configure(): Promise<void> {
    // If already configured, return immediately
    if (this.isConfigured) {
      return;
    }

    // If configuration is in progress, wait for it
    if (this.configPromise) {
      return this.configPromise;
    }

    // Start configuration
    this.configPromise = this.performConfiguration();
    await this.configPromise;
  }

  private async performConfiguration(): Promise<void> {
    try {
      // Only configure on client side
      if (typeof window === 'undefined') {
        return;
      }

      // Check if already configured by another instance
      const existingConfig = Amplify.getConfig();
      if (existingConfig && Object.keys(existingConfig).length > 0) {
        this.isConfigured = true;
        return;
      }

      // Configure Amplify
      Amplify.configure(amplifyConfig as ResourcesConfig, {
        ssr: true // Enable SSR support for Next.js
      });

      this.isConfigured = true;
      console.log('[AmplifyConfig] Successfully configured Amplify');
    } catch (error) {
      console.error('[AmplifyConfig] Failed to configure Amplify:', error);
      this.configPromise = null; // Reset to allow retry
      throw error;
    }
  }

  /**
   * Check if Amplify is configured
   */
  public isAmplifyConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Get current Amplify configuration
   */
  public getConfig(): ResourcesConfig | null {
    if (!this.isConfigured) {
      return null;
    }
    return Amplify.getConfig();
  }

  /**
   * Force reconfiguration (use with caution)
   */
  public async reconfigure(config?: ResourcesConfig): Promise<void> {
    this.isConfigured = false;
    this.configPromise = null;
    
    if (config) {
      Amplify.configure(config, { ssr: true });
      this.isConfigured = true;
    } else {
      await this.configure();
    }
  }
}

// Export singleton instance methods
export const amplifyManager = AmplifyConfigurationManager.getInstance();

/**
 * Ensure Amplify is configured before use
 * This should be called at the top of any component/hook that uses Amplify
 */
export async function ensureAmplifyConfigured(): Promise<void> {
  await amplifyManager.configure();
}

/**
 * Hook to ensure Amplify is configured in React components
 */
export function useAmplifyConfig() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    ensureAmplifyConfigured()
      .then(() => setIsConfigured(true))
      .catch((err) => setError(err));
  }, []);

  return { isConfigured, error };
}

// Add missing import
import { useState, useEffect } from 'react';