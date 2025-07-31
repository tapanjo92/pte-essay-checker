'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser, AuthUser } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { Hub } from 'aws-amplify/utils';
import amplifyConfig from '@/amplify_outputs.json';

// 🚀 Aurora's L10 Pattern: Configure Amplify immediately, globally, once
if (typeof window !== 'undefined') {
  try {
    Amplify.configure(amplifyConfig);
    console.log('🔧 Aurora: Amplify configured globally');
  } catch (error) {
    console.error('🚨 Aurora: Amplify configuration failed:', error);
  }
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  retry: () => {},
  isAuthenticated: false,
});

// 🧠 Aurora's Exponential Backoff Pattern
async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; baseDelay: number; maxDelay: number }
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay } = options;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt === maxRetries - 1) throw error;
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      console.log(`🔄 Aurora: Auth attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Aurora: Starting auth check...');
      
      // The Aurora pattern: Robust auth with progressive retry
      const currentUser = await retryWithExponentialBackoff(
        () => getCurrentUser(),
        { maxRetries: 3, baseDelay: 200, maxDelay: 2000 }
      );
      
      console.log('✅ Aurora: Auth success:', {
        userId: currentUser.userId,
        username: currentUser.username,
        signInDetails: currentUser.signInDetails
      });
      
      setUser(currentUser);
    } catch (err: any) {
      console.error('❌ Cipher: Auth check failed:', err);
      
      // 🔐 Cipher's L10 Gen 2 Error Classification
      if (err.name === 'UserUnAuthenticatedException' || 
          err.message?.includes('User needs to be authenticated') ||
          err.message?.includes('The user is not authenticated')) {
        // Definitely not authenticated - clear user state
        setError('Please sign in to continue');
        setUser(null);
      } else {
        // Network or other recoverable error - don't clear user state immediately
        console.warn('🔄 Cipher: Temporary auth error, not clearing user state:', err.message);
        setError(`Temporary authentication error: ${err.message}`);
        // Keep existing user state if this was just a network blip
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 🔐 Cipher's L10 Gen 2 Pattern - Listen for auth events
    const hubListener = Hub.listen('auth', ({ payload }) => {
      console.log('🔊 Cipher: Auth event received:', payload.event);
      
      switch (payload.event) {
        case 'signedIn':
        case 'signInWithRedirect':
          console.log('✅ Cipher: User signed in, refreshing auth state');
          checkAuth();
          break;
        case 'signedOut':
          console.log('🚪 Cipher: User signed out, clearing state');
          setUser(null);
          setError(null);
          setLoading(false);
          break;
        case 'tokenRefresh':
          console.log('🔄 Cipher: Token refreshed');
          break;
        case 'tokenRefresh_failure':
          console.log('❌ Cipher: Token refresh failed, checking auth');
          checkAuth();
          break;
      }
    });

    // Initial auth check with small delay to ensure Amplify is configured
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);
    
    return () => {
      clearTimeout(timer);
      hubListener();
    };
  }, []);

  // 🛠️ Cipher's L10 Gen 2 Pattern - Proper auth state logic
  // Only consider unauthenticated if we're not loading and explicitly have no user
  // Errors don't immediately mean unauthenticated (could be network issues)
  const isAuthenticated = !loading && user !== null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      retry: checkAuth,
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;  
};

// 🛠️ Aurora's Debug Helper
export const debugAuth = () => {
  console.log('🔍 Aurora Debug - Amplify Config:', Amplify.getConfig());
  getCurrentUser()
    .then(user => console.log('🔍 Aurora Debug - Current User:', user))
    .catch(err => console.log('🔍 Aurora Debug - Auth Error:', err));
};