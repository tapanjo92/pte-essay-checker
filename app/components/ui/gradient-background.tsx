'use client';

import { usePrefersReducedMotion } from '@/lib/motion-safe';

interface GradientBackgroundProps {
  variant?: 'default' | 'subtle' | 'vibrant';
  children: React.ReactNode;
}

export function GradientBackground({ 
  variant = 'default', 
  children 
}: GradientBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-pink-600/20" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} 
        />

        {/* Floating gradient orbs */}
        {variant !== 'subtle' && (
          <>
            <div className={`absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-[128px] opacity-30 ${!prefersReducedMotion && 'animate-float'}`} />
            <div className={`absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-[128px] opacity-30 ${!prefersReducedMotion && 'animate-float-delayed'}`} />
            {variant === 'vibrant' && (
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-screen filter blur-[128px] opacity-30 ${!prefersReducedMotion && 'animate-float-slow'}`} />
            )}
          </>
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}