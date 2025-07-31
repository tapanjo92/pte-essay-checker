'use client';

import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import { useEffect, useState } from 'react';
import amplifyConfig from '@/amplify_outputs.json';
import { ErrorBoundary } from '@/components/error-boundary';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { AuthProvider } from '@/lib/auth-provider';

// Configure Amplify immediately
Amplify.configure(amplifyConfig);

export function Providers({ children }: { children: React.ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Ensure configuration is applied
    if (!Amplify.getConfig().Auth) {
      Amplify.configure(amplifyConfig);
    }
    
    // Enable dark mode by default
    document.documentElement.classList.add('dark');
    
    // Initialize auth session
    const initializeAuth = async () => {
      try {
        const session = await fetchAuthSession();
        console.log('Auth session initialized:', !!session.tokens);
      } catch (error) {
        console.log('Auth initialization error:', error);
      } finally {
        setIsConfigured(true);
      }
    };
    
    initializeAuth();
  }, []);

  // Show loading state during initial config
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <div className="text-lg text-gray-300">
            Initializing...
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ErrorBoundary>
  );
}