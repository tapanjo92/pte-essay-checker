'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Listen for auth events
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signInWithRedirect':
          checkAuthAndRedirect();
          break;
        case 'signInWithRedirect_failure':
          console.error('OAuth sign in failed:', payload.data);
          router.push('/auth');
          break;
      }
    });

    checkAuthAndRedirect();

    return unsubscribe;
  }, [router]);

  const checkAuthAndRedirect = async () => {
    try {
      // Check if we're handling an OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('code') || urlParams.has('error')) {
        // Let Amplify handle the OAuth callback
        await fetchAuthSession();
      }
      
      await getCurrentUser();
      router.push('/dashboard');
    } catch (error) {
      router.push('/auth');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  );
}