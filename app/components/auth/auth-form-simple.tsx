'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';

// 🔐 Cipher's L10 Simple Auth Form
export function AuthForm() {
  const router = useRouter();
  const { authStatus } = useAuthenticator();

  // Redirect to dashboard when authenticated
  useEffect(() => {
    if (authStatus === 'authenticated') {
      console.log('🔐 Cipher: User authenticated, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [authStatus, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-pink-950 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            PTE Essay Checker
          </h1>
          <p className="text-gray-400">
            Sign in to start improving your essays with AI-powered feedback
          </p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 p-8 shadow-2xl">
          <Authenticator
            signUpAttributes={[
              'email',
              'given_name',
              'family_name'
            ]}
            variation="modal"
            hideSignUp={false}
          />
        </div>
      </div>
    </div>
  );
}