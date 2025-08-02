"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, HTMLMotionProps } from "framer-motion"

const cardVariants = cva(
  "rounded-xl text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border bg-card shadow",
        "hover-glow": "bg-gray-900/60 border border-gray-800/50 hover:border-gray-700/50",
        "gradient-border": "bg-gray-900/80 backdrop-blur-xl",
        neon: "bg-black/90 shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-blue-500/50",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 shadow-lg",
        modern: "bg-gradient-to-b from-gray-900/90 to-gray-900/50 border border-gray-800/50 backdrop-blur-xl",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type MotionDivProps = HTMLMotionProps<"div"> & React.HTMLAttributes<HTMLDivElement>

export interface CardProps
  extends Omit<MotionDivProps, "ref">,
    VariantProps<typeof cardVariants> {
  enableMotion?: boolean
  glowColor?: string
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, enableMotion = false, glowColor = "rgba(94, 92, 230, 0.5)", children, ...props }, ref) => {
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })
    const Comp = enableMotion ? motion.div : "div"

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (variant === "gradient-border") {
        const rect = e.currentTarget.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }

    const motionProps = enableMotion ? {
      whileHover: { scale: 1.02 },
      transition: { duration: 0.2 }
    } : {}

    if (variant === "gradient-border") {
      return (
        <div className={cn("relative group", className)} ref={ref} {...props}>
          {/* Animated gradient border */}
          <div
            className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColor}, transparent 40%)`,
            }}
          />
          
          {/* Card content */}
          <div
            className={cn("relative rounded-xl p-6", cardVariants({ variant }))}
            onMouseMove={handleMouseMove}
          >
            {children}
          </div>
        </div>
      )
    }

    return (
      <Comp
        ref={ref}
        className={cn(cardVariants({ variant, className }))}
        onMouseMove={handleMouseMove}
        {...(enableMotion ? motionProps : {})}
        {...props}
      >
        {/* Glow effect overlay for hover-glow variant */}
        {variant === "hover-glow" && (
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
          </div>
        )}
        {children}
      </Comp>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }