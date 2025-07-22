'use client';

import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(outputs);

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}