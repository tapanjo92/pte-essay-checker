'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '@/amplify_outputs.json';
import Link from 'next/link';
import { FileText, PenTool, List, User, Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { GradientBackground } from '@/components/ui/gradient-background';

// Configure Amplify
if (!Amplify.getConfig().Auth) {
  Amplify.configure(amplifyConfig);
}

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

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

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.log('User not authenticated, redirecting to auth page');
      router.push('/auth');
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
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                PTE Essay Checker
              </h1>
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
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="max-w-[150px] truncate">
                      {user?.signInDetails?.loginId || user?.username || 'Profile'}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </Button>
                
                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-background/95 backdrop-blur-xl shadow-lg">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-medium truncate">
                        {user?.signInDetails?.loginId}
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
                  Profile
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