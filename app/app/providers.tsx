'use client';

import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
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
  useEffect(() => {
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