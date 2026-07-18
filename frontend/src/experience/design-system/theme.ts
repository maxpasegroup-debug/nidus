/**
 * Semantic theme tokens for NIDUS Experience V2.
 * These names describe creative meaning rather than raw color values.
 */
export const experienceTheme = {
  surface: {
    primary: "var(--page-bg)",
    secondary: "rgba(255, 255, 255, 0.92)",
    highlight: "rgba(231, 200, 115, 0.22)",
    interactive: "rgba(255, 255, 255, 0.78)",
    ceremonial: "linear-gradient(135deg,#fff3bf 0%,#e7c873 34%,#b9913f 72%,#8a6426 100%)",
    trust: "#ffffff",
    recovery: "#fbf8f1",
    immersive: "#071d36"
  },
  text: {
    primary: "#071d36",
    secondary: "#40516a",
    muted: "#64748b",
    inverse: "#ffffff",
    ceremonial: "#8a6426",
    danger: "#991b1b",
    success: "#166534",
    warning: "#92400e"
  },
  border: {
    quiet: "rgba(7, 29, 54, 0.10)",
    default: "rgba(7, 29, 54, 0.14)",
    strong: "rgba(7, 29, 54, 0.24)",
    ceremonial: "rgba(185, 145, 63, 0.42)",
    inverse: "rgba(255, 255, 255, 0.18)"
  },
  button: {
    primary: "linear-gradient(135deg,#fff3bf 0%,#e7c873 34%,#b9913f 72%,#8a6426 100%)",
    secondary: "#ffffff",
    ghost: "transparent",
    danger: "#991b1b",
    success: "#166534"
  },
  shadow: {
    low: "0 10px 28px rgba(7, 29, 54, 0.06)",
    medium: "0 18px 54px rgba(7, 29, 54, 0.10)",
    high: "0 28px 90px rgba(7, 29, 54, 0.16)",
    ceremonial: "0 18px 46px rgba(185, 145, 63, 0.24)"
  },
  motion: {
    slow: "900ms",
    medium: "520ms",
    fast: "180ms"
  },
  scene: {
    quiet: "rgba(251, 248, 241, 0.98)",
    cinematic: "#071d36",
    information: "#ffffff",
    recovery: "#f7f3ea",
    decision: "rgba(255, 255, 255, 0.94)"
  }
} as const;

export type ExperienceTheme = typeof experienceTheme;
