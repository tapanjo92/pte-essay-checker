import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'blur';
  children: React.ReactNode;
}

export function GlassCard({ 
  variant = 'default', 
  className, 
  children,
  ...props 
}: GlassCardProps) {
  const variants = {
    default: "bg-card/50 backdrop-blur-xl border-border/50",
    gradient: "bg-gradient-to-br from-primary/10 to-secondary/5 backdrop-blur-xl border-border/50",
    blur: "bg-card/30 backdrop-blur-md border-border/30"
  };

  return (
    <Card 
      className={cn(
        "shadow-2xl transition-all duration-300 hover:shadow-3xl",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

export const GlassCardHeader = CardHeader;
export const GlassCardTitle = CardTitle;
export const GlassCardDescription = CardDescription;
export const GlassCardContent = CardContent;
export const GlassCardFooter = CardFooter;