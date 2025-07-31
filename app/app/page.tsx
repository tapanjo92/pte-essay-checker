'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let hasNavigated = false;

    // Helper to safely navigate
    const safeNavigate = (path: string) => {
      if (mounted && !hasNavigated) {
        hasNavigated = true;
        router.push(path);
      }
    };

    // Set up Hub listener for OAuth events
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      console.log('Auth Hub event:', payload.event);
      
      switch (payload.event) {
        case 'signInWithRedirect':
          console.log('OAuth sign-in successful!');
          safeNavigate('/dashboard');
          break;
          
        case 'signInWithRedirect_failure':
          console.error('OAuth sign-in failed:', payload.data);
          sessionStorage.setItem('authError', 'Sign-in failed. Please try again.');
          safeNavigate('/auth');
          break;
          
        case 'customOAuthState':
          console.log('Custom OAuth state:', payload.data);
          break;
      }
    });

    // Check current auth state
    const checkUser = async () => {
      try {
        // Add a small delay to allow OAuth events to process first
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const user = await getCurrentUser();
        console.log('User is authenticated:', user);
        safeNavigate('/dashboard');
      } catch (error) {
        console.log('User is not authenticated, error:', error);
        // Wait a bit more for OAuth events if URL has OAuth params
        const urlParams = new URLSearchParams(window.location.search);
        const isOAuthCallback = urlParams.has('code') || urlParams.has('state');
        
        if (isOAuthCallback) {
          console.log('OAuth callback detected, waiting for Hub events...');
          // Give OAuth events more time to fire
          setTimeout(() => {
            if (mounted && !hasNavigated) {
              console.log('OAuth timeout reached, redirecting to auth');
              safeNavigate('/auth');
            }
          }, 3000);
        } else {
          safeNavigate('/auth');
        }
      }
    };

    checkUser();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <div className="text-lg text-gray-300">
          Loading...
        </div>
      </div>
    </div>
  );
}