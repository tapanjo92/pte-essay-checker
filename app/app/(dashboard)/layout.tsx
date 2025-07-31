'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, PenTool, List, User, Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { initializeUserIfNeeded } from '@/lib/user-init';
import { createTracedClient } from '@/lib/xray-client';
import { GradientBackground } from '@/components/ui/gradient-background';
import { useAuth } from '@/lib/auth-provider';

// Client is created once globally
const client = createTracedClient();

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // 🔐 Aurora's L10 Fix: AppAuthenticator handles auth, we just initialize
  useEffect(() => {
    // User is already authenticated by AppAuthenticator - just initialize
    if (user && !initialized) {
      console.log('✅ Aurora: User authenticated, initializing...');
      initializeUser();
    }
  }, [user, initialized]); // Simplified dependencies

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileDropdownOpen]);

  const initializeUser = async () => {
    if (!user || initialized) return;
    
    try {
      console.log('🔧 Cipher: Initializing user data...');
      
      // Initialize user in database if needed (only once)
      if (user.userId && user.signInDetails?.loginId) {
        setInitialized(true);
        
        // Get names from session storage (set during signup)
        const firstName = sessionStorage.getItem('pendingUserFirstName');
        const lastName = sessionStorage.getItem('pendingUserLastName');
        
        await initializeUserIfNeeded(
          user.userId, 
          user.signInDetails.loginId,
          firstName || undefined,
          lastName || undefined
        );
        
        // Clear session storage after use
        sessionStorage.removeItem('pendingUserFirstName');
        sessionStorage.removeItem('pendingUserLastName');
      }
      
      // Fetch user data from DynamoDB
      try {
        const userResult = await client.models.User.get({ id: user.userId });
        if (userResult.data) {
          setUserData(userResult.data);
          console.log('✅ Cipher: User data loaded:', userResult.data);
          
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
        console.error('❌ Cipher: Error loading user data:', err);
      }
    } catch (initError) {
      console.error('❌ Cipher: User initialization failed:', initError);
      // Don't block the user from using the app
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

  // 🚀 Aurora's fix: Trust AppAuthenticator - no duplicate loading states
  // The user prop is guaranteed to exist here because AppAuthenticator wraps us

  return (
    <GradientBackground variant="subtle">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
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
              {/* Desktop Profile Dropdown */}
              <div className="relative hidden md:block profile-dropdown">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-2 hover:bg-accent/50"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                      {userData?.firstName ? userData.firstName[0].toUpperCase() : user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="max-w-[150px] truncate">
                      {userData?.firstName && userData?.lastName 
                        ? `${userData.firstName} ${userData.lastName}`
                        : userData?.email || user?.username || 'Profile'
                      }
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </Button>
                
                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-background/95 backdrop-blur-xl shadow-lg">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-medium truncate">
                        {userData?.email || user?.signInDetails?.loginId}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {userSubscription?.plan || 'FREE'} Plan • {userSubscription?.essaysRemaining || 0} essays left
                      </p>
                    </div>
                    <div className="p-1">
                      <Link href="/dashboard/profile" onClick={() => setProfileDropdownOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                          <User className="h-4 w-4" />
                          Profile Settings
                        </Button>
                      </Link>
                      <div className="my-1 border-t border-border" />
                      <Button 
                        variant="ghost" 
                        onClick={handleSignOut} 
                        className="w-full justify-start gap-2 text-sm hover:bg-red-500/10 hover:text-red-500"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mobile Menu Button */}
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
                    ? 'bg-primary/20 text-primary-foreground backdrop-blur-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'
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
                    ? 'bg-primary/20 text-primary-foreground backdrop-blur-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'
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
                    ? 'bg-primary/20 text-primary-foreground backdrop-blur-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'
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