/**
 * Viewport utilities for NIDUS Experience V2.
 * These helpers centralize safe browser checks for cinematic runtime code.
 */

/**
 * Returns true when browser APIs are available.
 */
export function canUseDOM(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Reads the current viewport size with safe server defaults.
 */
export function getViewportSize() {
  if (!canUseDOM()) return { width: 0, height: 0 };
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Returns true when the viewport should avoid heavy cinematic effects by default.
 */
export function isCompactViewport(width = getViewportSize().width): boolean {
  return width > 0 && width < 768;
}
