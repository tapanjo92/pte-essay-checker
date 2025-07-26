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
    default: "bg-white/5 backdrop-blur-xl border-white/10",
    gradient: "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-white/10",
    blur: "bg-white/3 backdrop-blur-md border-white/10"
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