'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '@/amplify_outputs.json';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, PenTool } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check failed:', error);
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
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold">PTE Essay Checker</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.username}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
          <nav className="flex gap-6 border-t pt-2">
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
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}