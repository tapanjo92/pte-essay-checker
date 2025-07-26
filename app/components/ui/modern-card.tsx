"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface ModernCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover-glow" | "gradient-border" | "neon";
  glowColor?: string;
  children: React.ReactNode;
}

export function ModernCard({
  variant = "default",
  glowColor = "rgba(94, 92, 230, 0.5)",
  className,
  children,
  ...props
}: ModernCardProps) {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const variants = {
    default: "bg-gradient-to-b from-gray-900/90 to-gray-900/50 border border-gray-800/50",
    "hover-glow": "bg-gray-900/60 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300",
    "gradient-border": "bg-gray-900/80",
    neon: "bg-black/90 shadow-neon",
  };

  if (variant === "gradient-border") {
    return (
      <div
        className={cn("relative group", className)}
        onMouseMove={handleMouseMove}
        {...props}
      >
        {/* Animated gradient border */}
        <div
          className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColor}, transparent 40%)`,
          }}
        />
        
        {/* Card content */}
        <div className={cn(
          "relative rounded-2xl backdrop-blur-xl p-6",
          variants[variant]
        )}>
          {children}
        </div>
      </div>
    );
  }

  if (variant === "hover-glow") {
    return (
      <motion.div
        className={cn(
          "relative rounded-2xl backdrop-blur-xl p-6 overflow-hidden",
          variants[variant],
          className
        )}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
        </div>
        
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl backdrop-blur-xl p-6",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function ModernCardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-6", className)} {...props}>
      {children}
    </div>
  );
}

export function ModernCardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-2xl font-semibold tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
}

export function ModernCardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-gray-400 mt-2", className)} {...props}>
      {children}
    </p>
  );
}

export function ModernCardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}