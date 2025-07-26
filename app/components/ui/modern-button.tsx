"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface ModernButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "glow" | "neon";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ 
    className, 
    variant = "primary", 
    size = "md", 
    loading = false,
    icon,
    children, 
    disabled,
    onClick,
    type = "button"
  }, ref) => {
    const variants = {
      primary: `
        bg-gradient-to-r from-blue-600 to-purple-600 
        hover:from-blue-500 hover:to-purple-500 
        text-white font-medium
        shadow-lg shadow-purple-500/20
        hover:shadow-xl hover:shadow-purple-500/30
        active:scale-[0.98]
      `,
      secondary: `
        bg-gray-800/80 backdrop-blur-sm
        hover:bg-gray-700/80
        text-gray-100 font-medium
        border border-gray-700/50
        hover:border-gray-600/50
        active:scale-[0.98]
      `,
      ghost: `
        bg-transparent
        hover:bg-gray-800/50
        text-gray-300 hover:text-white
        font-medium
      `,
      glow: `
        relative
        bg-gradient-to-r from-blue-500 to-purple-600
        text-white font-semibold
        before:absolute before:inset-0
        before:bg-gradient-to-r before:from-blue-400 before:to-purple-500
        before:blur-lg before:opacity-75
        hover:before:opacity-100
        before:transition-opacity
        active:scale-[0.98]
      `,
      neon: `
        bg-black/90 
        text-blue-400 
        border border-blue-500/50
        shadow-[0_0_20px_rgba(59,130,246,0.5)]
        hover:shadow-[0_0_30px_rgba(59,130,246,0.8)]
        hover:border-blue-400/70
        hover:text-blue-300
        font-semibold
        active:scale-[0.98]
      `,
    };

    const sizes = {
      sm: "px-4 py-2 text-sm rounded-lg",
      md: "px-6 py-3 text-base rounded-xl",
      lg: "px-8 py-4 text-lg rounded-2xl",
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "overflow-hidden",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        onClick={onClick}
        type={type}
      >
        {/* Loading spinner overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        
        {/* Button content */}
        <span className={cn(
          "inline-flex items-center gap-2",
          loading && "opacity-0"
        )}>
          {icon && <span className="w-5 h-5">{icon}</span>}
          {children}
        </span>

        {/* Hover effect for glow variant */}
        {variant === "glow" && (
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5" />
          </div>
        )}
      </motion.button>
    );
  }
);

ModernButton.displayName = "ModernButton";