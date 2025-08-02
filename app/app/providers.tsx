'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { AuthProvider } from '@/lib/auth-provider';
import { ensureAmplifyConfigured } from '@/lib/amplify-singleton';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Configure Amplify using singleton pattern
    ensureAmplifyConfigured().catch(console.error);
    
    // Enable dark mode by default
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <ErrorBoundary>
      <Authenticator.Provider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </Authenticator.Provider>
    </ErrorBoundary>
  );
}