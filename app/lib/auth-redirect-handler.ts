import { Hub } from 'aws-amplify/utils';
import { getCurrentUser } from 'aws-amplify/auth';

// Check if the current URL is an OAuth callback
export function isOAuthCallback(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('code') && urlParams.has('state');
}

// Clean OAuth parameters from URL
export function cleanOAuthParams(): void {
  if (isOAuthCallback()) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Wait for OAuth to complete with timeout
export async function waitForOAuthCompletion(timeoutMs: number = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    let completed = false;
    
    // Set up timeout
    const timeout = setTimeout(() => {
      if (!completed) {
        completed = true;
        console.log('OAuth completion timeout reached');
        resolve(false);
      }
    }, timeoutMs);
    
    // Listen for auth events
    const hubListener = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect' || payload.event === 'signInWithRedirect_failure') {
        completed = true;
        clearTimeout(timeout);
        hubListener();
        resolve(payload.event === 'signInWithRedirect');
      }
    });
    
    // Also check if already authenticated
    getCurrentUser()
      .then(() => {
        if (!completed) {
          completed = true;
          clearTimeout(timeout);
          hubListener();
          resolve(true);
        }
      })
      .catch(() => {
        // Not authenticated, continue waiting
      });
  });
}

// Enhanced auth redirect handler
export async function handleAuthRedirect(): Promise<boolean> {
  if (!isOAuthCallback()) {
    return false;
  }
  
  console.log('OAuth callback detected, processing...');
  
  // Clean URL immediately to prevent issues
  cleanOAuthParams();
  
  // Wait for OAuth to complete
  const success = await waitForOAuthCompletion();
  
  return success;
}

// Set up auth event listeners with better error handling
export function setupAuthListeners(
  onSignIn: () => void,
  onSignInFailure: (error: any) => void
) {
  const processedEvents = new Set<string>();
  
  const unsubscribe = Hub.listen('auth', ({ payload }) => {
    // Create unique event key to prevent duplicate processing
    const eventKey = `${payload.event}_${Date.now()}`;
    
    // Skip if we've already processed a similar event recently
    if (processedEvents.has(payload.event)) {
      return;
    }
    
    console.log('Auth event:', payload.event);
    
    switch (payload.event) {
      case 'signInWithRedirect':
        processedEvents.add(payload.event);
        console.log('Sign in with redirect completed successfully');
        onSignIn();
        // Clear processed events after a delay
        setTimeout(() => processedEvents.delete(payload.event), 1000);
        break;
        
      case 'signInWithRedirect_failure':
        processedEvents.add(payload.event);
        console.error('Sign in with redirect failed:', payload.data);
        onSignInFailure(payload.data);
        setTimeout(() => processedEvents.delete(payload.event), 1000);
        break;
        
      case 'signedIn':
        processedEvents.add(payload.event);
        console.log('User signed in');
        onSignIn();
        setTimeout(() => processedEvents.delete(payload.event), 1000);
        break;
        
      case 'tokenRefresh':
        console.log('Token refreshed');
        break;
        
      case 'tokenRefresh_failure':
        console.error('Token refresh failed');
        break;
        
      case 'signedOut':
        console.log('User signed out');
        processedEvents.clear();
        break;
    }
  });
  
  return unsubscribe;
}