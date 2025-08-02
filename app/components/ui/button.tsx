"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[0.98]",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: `
          bg-gradient-to-r from-blue-600 to-purple-600 
          hover:from-blue-500 hover:to-purple-500 
          text-white
          shadow-lg shadow-purple-500/20
          hover:shadow-xl hover:shadow-purple-500/30
          active:scale-[0.98]
        `,
        glow: `
          bg-gradient-to-r from-blue-500 to-purple-600
          text-white
          before:absolute before:inset-0
          before:bg-gradient-to-r before:from-blue-400 before:to-purple-500
          before:blur-lg before:opacity-75
          hover:before:opacity-100
          before:transition-opacity before:-z-10
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
          active:scale-[0.98]
        `,
        glass: `
          bg-white/10 backdrop-blur-md
          border border-white/20
          text-white
          hover:bg-white/20
          hover:border-white/30
          shadow-lg
          active:scale-[0.98]
        `,
      },
      size: {
        default: "min-h-[44px] px-6 py-3 text-sm rounded-xl",
        sm: "min-h-[36px] px-4 py-2 text-xs rounded-lg",
        lg: "min-h-[48px] px-8 py-4 text-base rounded-2xl",
        icon: "min-h-[44px] h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type MotionButtonProps = HTMLMotionProps<"button"> & React.ButtonHTMLAttributes<HTMLButtonElement>

export interface ButtonProps
  extends Omit<MotionButtonProps, "ref">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  enableMotion?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    icon,
    iconPosition = "left",
    enableMotion = true,
    disabled,
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : enableMotion ? motion.button : "button"
    
    const motionProps = enableMotion ? {
      whileTap: { scale: disabled || loading ? 1 : 0.98 },
      whileHover: { scale: disabled || loading ? 1 : 1.02 },
      transition: { duration: 0.2 }
    } : {}

    const content = (
      <>
        {/* Loading spinner overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-inherit">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        
        {/* Button content */}
        <span className={cn(
          "inline-flex items-center gap-2 relative z-10",
          loading && "opacity-0"
        )}>
          {icon && iconPosition === "left" && <span className="w-4 h-4">{icon}</span>}
          {children}
          {icon && iconPosition === "right" && <span className="w-4 h-4">{icon}</span>}
        </span>

        {/* Hover effects for special variants */}
        {variant === "glow" && (
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-inherit">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-inherit" />
          </div>
        )}
      </>
    )

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          disabled={disabled || loading}
          {...props}
        >
          {content}
        </Slot>
      )
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...(enableMotion ? motionProps : {})}
        {...props}
      >
        {content}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }