export const motionTokens = {
  duration: {
    instant: "var(--ds-duration-instant)",
    fast: "var(--ds-duration-fast)",
    normal: "var(--ds-duration-normal)",
    slow: "var(--ds-duration-slow)"
  },
  delay: {
    none: "var(--ds-delay-none)",
    short: "var(--ds-delay-short)",
    medium: "var(--ds-delay-medium)"
  },
  easing: {
    standard: "var(--ds-ease-standard)",
    entrance: "var(--ds-ease-entrance)",
    exit: "var(--ds-ease-exit)"
  },
  utilities: {
    interactive: "ds-motion-interactive",
    fadeIn: "ds-motion-fade-in",
    slideUp: "ds-motion-slide-up"
  }
} as const;
