'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { AuthForm } from '@/components/auth/auth-form';
import { handleAuthRedirect } from '@/lib/auth-redirect-handler';
import { Hub } from 'aws-amplify/utils';

export default function AuthPage() {
  const router = useRouter();
  const { authStatus } = useAuthenticator();
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  useEffect(() => {
    // Handle OAuth redirects
    const checkOAuthRedirect = async () => {
      setIsProcessingOAuth(true);
      const success = await handleAuthRedirect();
      if (success) {
        console.log('OAuth redirect handled successfully');
        router.push('/dashboard');
      }
      setIsProcessingOAuth(false);
    };

    checkOAuthRedirect();

    // Listen for auth events
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect') {
        console.log('OAuth sign in successful, redirecting to dashboard');
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    // Industry standard: Check auth status from Amplify UI
    if (authStatus === 'authenticated' && !isProcessingOAuth) {
      router.push('/dashboard');
    }
  }, [authStatus, router, isProcessingOAuth]);

  // Show loading if processing OAuth
  if (isProcessingOAuth || authStatus === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <div className="text-lg text-gray-300">
            {isProcessingOAuth ? 'Processing authentication...' : 'Redirecting to dashboard...'}
          </div>
        </div>
      </div>
    );
  }

  return <AuthForm />;
}