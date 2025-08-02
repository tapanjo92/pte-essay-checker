import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, type CardProps } from "./card";

interface GlassCardProps extends CardProps {
  // Glass card uses the unified Card component with glass variant by default
}

export function GlassCard({ 
  variant = 'glass',
  ...props 
}: GlassCardProps) {
  return (
    <Card 
      variant={variant}
      {...props}
    />
  );
}

export const GlassCardHeader = CardHeader;
export const GlassCardTitle = CardTitle;
export const GlassCardDescription = CardDescription;
export const GlassCardContent = CardContent;
export const GlassCardFooter = CardFooter;