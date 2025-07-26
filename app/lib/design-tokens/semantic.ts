// Semantic Design Tokens for consistent UI
export const semantic = {
  // Interactive elements
  interactive: {
    primary: {
      bg: "hsl(var(--primary))",
      hover: "hsl(var(--primary) / 0.9)",
      text: "hsl(var(--primary-foreground))",
    },
    secondary: {
      bg: "hsl(var(--secondary))",
      hover: "hsl(var(--secondary) / 0.8)",
      text: "hsl(var(--secondary-foreground))",
    },
    danger: {
      bg: "hsl(var(--destructive))",
      hover: "hsl(var(--destructive) / 0.9)",
      text: "hsl(var(--destructive-foreground))",
    },
    success: {
      bg: "hsl(142 76% 36%)", // green-600
      hover: "hsl(142 76% 30%)",
      text: "hsl(0 0% 100%)",
    },
  },

  // Feedback states
  feedback: {
    success: {
      bg: "hsl(142 76% 36% / 0.1)",
      border: "hsl(142 76% 36%)",
      text: "hsl(142 76% 36%)",
    },
    error: {
      bg: "hsl(var(--destructive) / 0.1)",
      border: "hsl(var(--destructive))",
      text: "hsl(var(--destructive))",
    },
    warning: {
      bg: "hsl(45 93% 47% / 0.1)", // amber-500
      border: "hsl(45 93% 47%)",
      text: "hsl(45 93% 47%)",
    },
    info: {
      bg: "hsl(217 91% 60% / 0.1)", // blue-500
      border: "hsl(217 91% 60%)",
      text: "hsl(217 91% 60%)",
    },
  },

  // Surface hierarchy
  surface: {
    base: "hsl(var(--background))",
    elevated: "hsl(var(--card))",
    overlay: "hsl(var(--background) / 0.95)",
    glassmorphic: "hsl(var(--background) / 0.75)",
  },

  // Text hierarchy
  text: {
    primary: "hsl(var(--foreground))",
    secondary: "hsl(var(--muted-foreground))",
    muted: "hsl(var(--muted-foreground) / 0.7)",
    inverse: "hsl(var(--background))",
  },

  // Spacing rhythm (4px grid)
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
  },

  // Touch targets
  touchTarget: {
    min: "44px", // WCAG minimum
    comfortable: "48px",
    large: "56px",
  },

  // Animation tokens
  motion: {
    duration: {
      instant: "100ms",
      fast: "200ms",
      normal: "300ms",
      slow: "500ms",
    },
    easing: {
      linear: "linear",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    },
  },

  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 10,
    overlay: 20,
    modal: 30,
    popover: 40,
    tooltip: 50,
  },
} as const;

// Type-safe token getter
export function getToken<T extends keyof typeof semantic>(
  category: T,
  path: string
): string {
  const keys = path.split(".");
  let value: any = semantic[category];
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || "";
}

// CSS variable generator for runtime theming
export function generateCSSVariables() {
  const vars: Record<string, string> = {};
  
  // Add success/warning/info colors to CSS vars
  vars["--color-success"] = "142 76% 36%";
  vars["--color-warning"] = "45 93% 47%";
  vars["--color-info"] = "217 91% 60%";
  
  return vars;
}