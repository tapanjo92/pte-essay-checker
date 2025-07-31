'use client';

import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import 'aws-amplify/auth/enable-oauth-listener'; // Critical for OAuth to work!
import { useEffect, useState } from 'react';
import amplifyConfig from '@/amplify_outputs.json';
import { ErrorBoundary } from '@/components/error-boundary';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

// Configure Amplify immediately
Amplify.configure(amplifyConfig);

export function Providers({ children }: { children: React.ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  useEffect(() => {
    // Ensure configuration is applied
    if (!Amplify.getConfig().Auth) {
      Amplify.configure(amplifyConfig);
    }
    
    // Enable dark mode by default
    document.documentElement.classList.add('dark');
    
    // Check if this is an OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const isOAuthCallback = urlParams.has('code') && urlParams.has('state');
    
    if (isOAuthCallback) {
      setIsProcessingOAuth(true);
      console.log('OAuth callback detected in providers');
    }
    
    // Set up global auth event listener
    const hubListener = Hub.listen('auth', (data) => {
      console.log('Global auth event in providers:', data.payload.event);
      
      // Handle OAuth completion
      if (data.payload.event === 'signInWithRedirect' || 
          data.payload.event === 'signInWithRedirect_failure') {
        setIsProcessingOAuth(false);
        // Clear OAuth params from URL
        if (window.location.search.includes('code=') || window.location.search.includes('state=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    });
    
    // Initialize auth handling for OAuth redirects
    const initializeAuth = async () => {
      try {
        // For OAuth callbacks, let Amplify process first
        if (isOAuthCallback) {
          console.log('OAuth callback detected, processing...');
          // Don't fetch session immediately for OAuth
          setIsConfigured(true);
          // OAuth will be handled by Hub events
          return;
        }
        
        // For non-OAuth, check session
        const session = await fetchAuthSession();
        console.log('Auth session initialized:', !!session.tokens);
      } catch (error) {
        console.log('Auth initialization error:', error);
      } finally {
        setIsConfigured(true);
      }
    };
    
    initializeAuth();
    
    return () => {
      hubListener();
    };
  }, []);

  // Show loading state during OAuth processing or initial config
  if (!isConfigured || isProcessingOAuth) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <div className="text-lg text-gray-300">
            {isProcessingOAuth ? 'Completing sign in...' : 'Initializing...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}