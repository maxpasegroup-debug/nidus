export const colors = {
  primary: "var(--ds-color-primary)",
  primaryForeground: "var(--ds-color-primary-foreground)",
  secondary: "var(--ds-color-secondary)",
  secondaryForeground: "var(--ds-color-secondary-foreground)",
  surface: "var(--ds-color-surface)",
  surfaceRaised: "var(--ds-color-surface-raised)",
  background: "var(--ds-color-background)",
  success: "var(--ds-color-success)",
  warning: "var(--ds-color-warning)",
  danger: "var(--ds-color-danger)",
  info: "var(--ds-color-info)",
  border: "var(--ds-color-border)",
  muted: "var(--ds-color-muted)",
  text: "var(--ds-color-text)"
} as const;

export const typography = {
  display: "ds-text-display",
  heading: "ds-text-heading",
  title: "ds-text-title",
  body: "ds-text-body",
  caption: "ds-text-caption",
  label: "ds-text-label",
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900
  }
} as const;

export const spacing = {
  4: "var(--ds-space-4)",
  8: "var(--ds-space-8)",
  12: "var(--ds-space-12)",
  16: "var(--ds-space-16)",
  20: "var(--ds-space-20)",
  24: "var(--ds-space-24)",
  32: "var(--ds-space-32)",
  40: "var(--ds-space-40)",
  48: "var(--ds-space-48)",
  64: "var(--ds-space-64)",
  80: "var(--ds-space-80)",
  96: "var(--ds-space-96)"
} as const;

export const radius = {
  small: "var(--ds-radius-small)",
  medium: "var(--ds-radius-medium)",
  large: "var(--ds-radius-large)",
  xl: "var(--ds-radius-xl)",
  full: "var(--ds-radius-full)"
} as const;

export const shadows = {
  soft: "var(--ds-shadow-soft)",
  medium: "var(--ds-shadow-medium)",
  large: "var(--ds-shadow-large)",
  floating: "var(--ds-shadow-floating)"
} as const;
