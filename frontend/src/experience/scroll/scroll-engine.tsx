"use client";

/**
 * Scene registration and viewport tracking engine for NIDUS Experience V2.
 * It supports normal, pinned, layered, parallax, and immersive scene orchestration.
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { ExperienceSceneLength, ExperienceSceneMode, SceneProgressSnapshot, SceneRegistration } from "../types";

type SceneRegistryContextValue = {
  scenes: SceneRegistration[];
  registerScene: (scene: Omit<SceneRegistration, "element">) => (element: HTMLElement | null) => void;
  updateSceneProgress: (snapshot: SceneProgressSnapshot) => void;
  progress: Record<string, SceneProgressSnapshot>;
};

const SceneRegistryContext = createContext<SceneRegistryContextValue | null>(null);

/**
 * Provides a central registry for cinematic scene elements and progress snapshots.
 */
export function ExperienceScrollProvider({ children }: { children: ReactNode }) {
  const [scenes, setScenes] = useState<SceneRegistration[]>([]);
  const [progress, setProgress] = useState<Record<string, SceneProgressSnapshot>>({});
  const elementMap = useRef(new Map<string, HTMLElement | null>());

  const registerScene = useCallback((scene: Omit<SceneRegistration, "element">) => {
    return (element: HTMLElement | null) => {
      elementMap.current.set(scene.id, element);
      setScenes((current) => {
        const nextScene = { ...scene, element };
        const existing = current.findIndex((item) => item.id === scene.id);
        if (existing >= 0) {
          const next = [...current];
          next[existing] = nextScene;
          return next;
        }
        return [...current, nextScene];
      });
    };
  }, []);

  const updateSceneProgress = useCallback((snapshot: SceneProgressSnapshot) => {
    setProgress((current) => ({ ...current, [snapshot.id]: snapshot }));
  }, []);

  const value = useMemo(() => ({ scenes, registerScene, updateSceneProgress, progress }), [progress, registerScene, scenes, updateSceneProgress]);

  return <SceneRegistryContext.Provider value={value}>{children}</SceneRegistryContext.Provider>;
}

/**
 * Reads the current scene registry context.
 */
export function useExperienceScrollRegistry() {
  const context = useContext(SceneRegistryContext);
  if (!context) throw new Error("useExperienceScrollRegistry must be used inside ExperienceScrollProvider.");
  return context;
}

/**
 * Registers a scene with the central scroll engine and returns a ref callback.
 */
export function useSceneRegistration(id: string, mode: ExperienceSceneMode = "normal", length: ExperienceSceneLength = "medium") {
  const { registerScene } = useExperienceScrollRegistry();
  return registerScene({ id, mode, length });
}
