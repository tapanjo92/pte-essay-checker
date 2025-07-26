// Modern Design System inspired by top websites
// References: Linear, Vercel, Stripe, Framer, Raycast

export const modernTheme = {
  // Color palette inspired by Linear and Vercel
  colors: {
    // Background layers
    background: {
      primary: '#0A0A0B', // Deep black
      secondary: '#111113', // Slightly lighter
      tertiary: '#1A1A1D', // Card backgrounds
      accent: '#252529', // Hover states
    },
    
    // Foreground colors
    foreground: {
      primary: '#FAFAFA', // Pure white text
      secondary: '#A1A1AA', // Muted text
      tertiary: '#71717A', // Extra muted
    },
    
    // Brand colors - Modern gradient approach
    brand: {
      primary: '#5E5CE6', // Purple from Linear
      secondary: '#BF5AF2', // Pink accent
      tertiary: '#32ADE6', // Blue accent
      gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
      glow: 'radial-gradient(circle at center, rgba(94, 92, 230, 0.35) 0%, transparent 70%)',
    },
    
    // Semantic colors
    semantic: {
      success: '#34D399', // Emerald
      warning: '#FBBF24', // Amber
      error: '#F87171', // Red
      info: '#60A5FA', // Blue
    },
    
    // Glass morphism
    glass: {
      light: 'rgba(255, 255, 255, 0.02)',
      medium: 'rgba(255, 255, 255, 0.06)',
      heavy: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.08)',
    },
  },
  
  // Typography inspired by Stripe and Framer
  typography: {
    fonts: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
      display: 'Cal Sans, Inter, sans-serif', // For headings
    },
    
    sizes: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem', // 48px
      '6xl': '3.75rem', // 60px
      '7xl': '4.5rem', // 72px
    },
    
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    lineHeights: {
      tight: 1.1,
      snug: 1.3,
      normal: 1.5,
      relaxed: 1.7,
    },
  },
  
  // Spacing system
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem', // 48px
    '4xl': '4rem', // 64px
    '5xl': '5rem', // 80px
    '6xl': '7.5rem', // 120px
  },
  
  // Modern effects
  effects: {
    blur: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(16px)',
      xl: 'blur(24px)',
    },
    
    shadows: {
      sm: '0 1px 3px rgba(0, 0, 0, 0.12)',
      md: '0 4px 6px rgba(0, 0, 0, 0.15)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.2)',
      xl: '0 20px 25px rgba(0, 0, 0, 0.25)',
      glow: '0 0 40px rgba(94, 92, 230, 0.3)',
      neon: '0 0 60px rgba(94, 92, 230, 0.5)',
    },
    
    transitions: {
      fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
      normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: '600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  
  // Border radius
  radius: {
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },
  
  // Animations
  animations: {
    // Fade in with scale
    fadeInScale: `
      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `,
    
    // Shimmer effect for loading
    shimmer: `
      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }
    `,
    
    // Glow pulse
    glowPulse: `
      @keyframes glowPulse {
        0%, 100% {
          opacity: 1;
          filter: brightness(1);
        }
        50% {
          opacity: 0.8;
          filter: brightness(1.2);
        }
      }
    `,
    
    // Float animation
    float: `
      @keyframes float {
        0%, 100% {
          transform: translateY(0) rotate(0deg);
        }
        33% {
          transform: translateY(-10px) rotate(-1deg);
        }
        66% {
          transform: translateY(5px) rotate(1deg);
        }
      }
    `,
  },
};