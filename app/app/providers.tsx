'use client';

import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Configure Amplify on client side only
    import('@/amplify_outputs.json').then((outputs) => {
      Amplify.configure(outputs.default);
    }).catch((error) => {
      console.warn('Amplify outputs not found. Running without backend configuration.');
    });
  }, []);

  return <>{children}</>;
}