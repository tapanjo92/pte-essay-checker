'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '@/amplify_outputs.json';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, PenTool, List, User, Menu, X } from 'lucide-react';
import { initializeUserIfNeeded } from '@/lib/user-init';
import { createTracedClient } from '@/lib/xray-client';

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
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-xl md:text-2xl font-bold">PTE Essay Checker</h1>
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
              <Button variant="outline" onClick={handleSignOut} className="hidden md:block">
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
          <nav className="hidden md:flex gap-6 border-t pt-2">
            <Link href="/essay-questions">
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 rounded-none border-b-2 ${
                  pathname === '/essay-questions' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="h-4 w-4" />
                Essay Topics
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 rounded-none border-b-2 ${
                  pathname === '/dashboard' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <PenTool className="h-4 w-4" />
                Write Essay
              </Button>
            </Link>
            <Link href="/dashboard/history">
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 rounded-none border-b-2 ${
                  pathname === '/dashboard/history' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
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
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}