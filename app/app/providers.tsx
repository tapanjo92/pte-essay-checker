'use client';

import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import { useEffect, useState } from 'react';
import amplifyConfig from '@/amplify_outputs.json';
import { ErrorBoundary } from '@/components/error-boundary';

// Configure Amplify immediately
Amplify.configure(amplifyConfig);

export function Providers({ children }: { children: React.ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    // Ensure configuration is applied
    if (!Amplify.getConfig().Auth) {
      Amplify.configure(amplifyConfig);
    }
    setIsConfigured(true);
    
    // Enable dark mode by default
    document.documentElement.classList.add('dark');
  }, []);

  if (!isConfigured) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-lg text-gray-300">Loading...</div>
    </div>;
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}