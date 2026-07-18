/**
 * Centralized design tokens for NIDUS Experience V2.
 * Future scenes should reference these values rather than inventing local measurements.
 */
export const experienceTokens = {
  spacing: {
    tiny: "0.25rem",
    small: "0.5rem",
    medium: "1rem",
    large: "1.5rem",
    xl: "2.5rem",
    xxl: "4rem",
    hero: "6rem",
    scene: "8rem",
    cinematic: "12rem"
  },
  typography: {
    displayXXL: "clamp(4.75rem, 10vw, 9.5rem)",
    displayXL: "clamp(3.75rem, 7vw, 7rem)",
    hero: "clamp(3rem, 5.8vw, 6rem)",
    headline: "clamp(2.5rem, 4.6vw, 4.75rem)",
    section: "clamp(2rem, 3.4vw, 3.5rem)",
    lead: "clamp(1.125rem, 1.8vw, 1.5rem)",
    bodyLarge: "1.125rem",
    body: "1rem",
    bodySmall: "0.875rem",
    caption: "0.8125rem",
    label: "0.75rem",
    overline: "0.75rem",
    micro: "0.6875rem"
  },
  lineHeight: {
    display: "0.98",
    heading: "1.08",
    lead: "1.65",
    body: "1.75",
    compact: "1.35"
  },
  containers: {
    reading: "46rem",
    content: "76rem",
    visual: "96rem",
    full: "100%"
  },
  radius: {
    small: "0.375rem",
    medium: "0.75rem",
    large: "1.25rem",
    xl: "1.75rem",
    cinematic: "2.25rem",
    full: "999px"
  },
  elevation: {
    flat: "none",
    low: "0 10px 28px rgba(7, 29, 54, 0.06)",
    medium: "0 18px 54px rgba(7, 29, 54, 0.10)",
    high: "0 28px 90px rgba(7, 29, 54, 0.16)",
    floating: "0 36px 110px rgba(7, 29, 54, 0.22)",
    overlay: "0 44px 140px rgba(7, 29, 54, 0.30)"
  },
  zIndex: {
    base: 0,
    scene: 10,
    sticky: 20,
    navigation: 50,
    overlay: 80,
    modal: 100
  },
  opacity: {
    disabled: 0.42,
    muted: 0.64,
    visible: 1,
    veil: 0.72
  },
  blur: {
    soft: "12px",
    glass: "24px",
    atmosphere: "72px"
  },
  safeArea: {
    mobile: "1rem",
    tablet: "1.5rem",
    desktop: "2rem",
    cinematic: "4rem"
  },
  breakpoints: {
    mobile: "320px",
    tablet: "768px",
    laptop: "1024px",
    desktop: "1280px",
    wide: "1536px"
  },
  sceneSpacing: {
    short: "min(72vh, 42rem)",
    medium: "min(110vh, 64rem)",
    long: "min(150vh, 88rem)",
    extraLong: "min(210vh, 130rem)"
  }
} as const;

export type ExperienceTokens = typeof experienceTokens;
