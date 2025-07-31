'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    let processed = false;

    const handleOAuthCallback = async () => {
      if (processed) return;
      processed = true;

      console.log('OAuth callback page loaded');
      
      // Clean the URL to prevent issues
      window.history.replaceState({}, document.title, '/oauth-callback');

      try {
        // Wait a moment for Amplify to process the OAuth tokens
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if authentication was successful
        const session = await fetchAuthSession({ forceRefresh: true });
        
        if (session.tokens) {
          console.log('OAuth authentication successful');
          router.push('/dashboard');
        } else {
          console.log('OAuth authentication pending, waiting for Hub event');
          
          // Set up Hub listener for auth completion
          const hubListener = Hub.listen('auth', ({ payload }) => {
            if (payload.event === 'signInWithRedirect') {
              console.log('OAuth completed via Hub');
              hubListener();
              router.push('/dashboard');
            } else if (payload.event === 'signInWithRedirect_failure') {
              console.error('OAuth failed:', payload.data);
              hubListener();
              sessionStorage.setItem('authError', 'Google sign-in failed. Please try again.');
              router.push('/auth');
            }
          });
          
          // Timeout after 10 seconds
          setTimeout(() => {
            hubListener();
            if (!processed) {
              console.error('OAuth timeout');
              sessionStorage.setItem('authError', 'Sign-in timeout. Please try again.');
              router.push('/auth');
            }
          }, 10000);
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        sessionStorage.setItem('authError', 'Authentication error. Please try again.');
        router.push('/auth');
      }
    };

    handleOAuthCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <div className="text-lg text-gray-300">
          Completing sign in with Google...
        </div>
      </div>
    </div>
  );
}