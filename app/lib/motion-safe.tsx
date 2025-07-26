"use client";

import { useEffect, useState } from "react";

// Hook to check if user prefers reduced motion
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

// Motion-safe wrapper component
interface MotionSafeProps {
  children: React.ReactNode;
  className?: string;
  animationClass?: string;
  reducedMotionClass?: string;
}

export function MotionSafe({ 
  children, 
  className = "", 
  animationClass = "",
  reducedMotionClass = ""
}: MotionSafeProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  
  return (
    <div className={`${className} ${prefersReducedMotion ? reducedMotionClass : animationClass}`}>
      {children}
    </div>
  );
}

// Utility function for motion-safe transitions
export function getMotionSafeTransition(
  duration: number | string, 
  prefersReducedMotion: boolean
) {
  if (prefersReducedMotion) {
    return "0.01ms";
  }
  return typeof duration === "number" ? `${duration}ms` : duration;
}