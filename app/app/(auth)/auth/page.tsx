'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { AuthForm } from '@/components/auth/auth-form';

export default function AuthPage() {
  const router = useRouter();
  const { authStatus } = useAuthenticator();

  useEffect(() => {
    // Industry standard: Check auth status from Amplify UI
    if (authStatus === 'authenticated') {
      router.push('/dashboard');
    }
  }, [authStatus, router]);

  // Only show auth form if not authenticated
  if (authStatus === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <div className="text-lg text-gray-300">Redirecting to dashboard...</div>
        </div>
      </div>
    );
  }

  return <AuthForm />;
}