'use client';

import { usePathname } from 'next/navigation';
import { AppAuthenticator } from './app-authenticator';

// 🔐 Cipher's L10 Main App Router
export function MainApp() {
  const pathname = usePathname();

  // Public routes that don't need authentication
  const publicRoutes = [];
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // For now, all routes require authentication
  return <AppAuthenticator />;
}