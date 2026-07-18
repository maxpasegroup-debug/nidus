/**
 * Media contracts for NIDUS Experience V2.
 * This namespace keeps future photography and video assets organized by approved role.
 */

export type ExperienceMediaRole = "hero" | "dream" | "identity" | "discipline" | "training" | "mentor" | "parent" | "proof" | "commitment";

export type ExperienceMediaAsset = {
  id: string;
  role: ExperienceMediaRole;
  src: string;
  alt: string;
  credit?: string;
};

/**
 * Validates that a media asset has the minimum metadata required by the experience.
 */
export function isValidExperienceMediaAsset(asset: ExperienceMediaAsset): boolean {
  return Boolean(asset.id && asset.role && asset.src && asset.alt);
}

export * from "./assets";
