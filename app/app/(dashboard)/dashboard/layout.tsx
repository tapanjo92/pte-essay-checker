'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '@/amplify_outputs.json';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, PenTool, List, User, Menu, X, Sparkles } from 'lucide-react';
import { initializeUserIfNeeded } from '@/lib/user-init';
import { createTracedClient } from '@/lib/xray-client';
import { GradientBackground } from '@/components/ui/gradient-background';

const client = createTracedClient();

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userSubscription, setUserSubscription] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      console.log('Current user from Cognito:', currentUser);
      
      // If we got a user, they're authenticated
      if (currentUser) {
        setUser(currentUser);
        
        // Initialize user in database if needed (only once)
        if (!initialized && currentUser.userId && currentUser.signInDetails?.loginId) {
          setInitialized(true);
          try {
            // Get names from session storage (set during signup)
            const firstName = sessionStorage.getItem('pendingUserFirstName');
            const lastName = sessionStorage.getItem('pendingUserLastName');
            
            await initializeUserIfNeeded(
              currentUser.userId, 
              currentUser.signInDetails.loginId,
              firstName || undefined,
              lastName || undefined
            );
            
            // Clear session storage after use
            sessionStorage.removeItem('pendingUserFirstName');
            sessionStorage.removeItem('pendingUserLastName');
          } catch (initError) {
            console.error('User initialization failed:', initError);
            // Don't block the user from using the app
          }
        } else if (!currentUser.userId || !currentUser.signInDetails?.loginId) {
          console.warn('User missing required fields:', { 
            userId: currentUser.userId, 
            loginId: currentUser.signInDetails?.loginId 
          });
        }
        
        // Fetch user data from DynamoDB
        try {
          const userResult = await client.models.User.get({ id: currentUser.userId });
          if (userResult.data) {
            setUserData(userResult.data);
            console.log('User data loaded:', userResult.data);
            
            // Load subscription data
            if (userResult.data.subscriptionId) {
              const subResult = await client.models.UserSubscription.get({ 
                id: userResult.data.subscriptionId 
              });
              if (subResult.data) {
                setUserSubscription(subResult.data);
              }
            }
          }
        } catch (err) {
          console.error('Error loading user data:', err);
        }
      }
    } catch (error) {
      // Check if it's specifically an unauthenticated error
      if (error instanceof Error && 
          (error.name === 'UserUnAuthenticatedException' || 
           error.message.includes('User needs to be authenticated'))) {
        console.log('User not authenticated, redirecting to auth page');
        router.push('/auth');
      } else {
        // For other errors, log but don't necessarily redirect
        console.error('Auth check error:', error);
        router.push('/auth');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <GradientBackground variant="subtle">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl backdrop-saturate-150">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">PTE Essay Checker</h1>
              {userSubscription && (
                <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  {userSubscription.essaysRemaining} essays remaining
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/dashboard/profile" className="hidden md:block">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {userData?.firstName && userData?.lastName 
                    ? `${userData.firstName} ${userData.lastName}`
                    : userData?.email || user?.username || 'Profile'
                  }
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleSignOut} 
                className="hidden md:block border-white/10 hover:bg-white/10 text-white backdrop-blur-sm"
              >
                Sign Out
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          {/* Desktop Navigation */}
          <nav id="navigation" className="hidden md:flex gap-2 border-t border-white/10 pt-2">
            <Link href="/essay-questions">
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  pathname === '/essay-questions' 
                    ? 'bg-white/10 text-white backdrop-blur-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <List className="h-4 w-4" />
                Essay Topics
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  pathname === '/dashboard' 
                    ? 'bg-white/10 text-white backdrop-blur-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <PenTool className="h-4 w-4" />
                Write Essay
              </Button>
            </Link>
            <Link href="/dashboard/history">
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  pathname === '/dashboard/history' 
                    ? 'bg-white/10 text-white backdrop-blur-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText className="h-4 w-4" />
                Essay History
              </Button>
            </Link>
          </nav>
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden flex flex-col gap-2 py-4 border-t">
              <Link href="/dashboard/profile" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-2 min-h-[44px]"
                >
                  <User className="h-4 w-4" />
                  {userData?.firstName && userData?.lastName 
                    ? `${userData.firstName} ${userData.lastName}`
                    : userData?.email || user?.username || 'Profile'
                  }
                </Button>
              </Link>
              <Link href="/essay-questions" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start gap-2 min-h-[44px] ${
                    pathname === '/essay-questions' 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <List className="h-4 w-4" />
                  Essay Topics
                </Button>
              </Link>
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start gap-2 min-h-[44px] ${
                    pathname === '/dashboard' 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PenTool className="h-4 w-4" />
                  Write Essay
                </Button>
              </Link>
              <Link href="/dashboard/history" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start gap-2 min-h-[44px] ${
                    pathname === '/dashboard/history' 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Essay History
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleSignOut} 
                className="w-full mt-2 min-h-[44px]"
              >
                Sign Out
              </Button>
            </nav>
          )}
        </div>
      </header>
      <main id="main-content" className="relative z-10 w-full">
        <div className="container mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </GradientBackground>
  );
}