"use client";

/**
 * Shared intersection hook for NIDUS Experience V2.
 * It avoids duplicate observers in future scenes and supports lazy cinematic reveals.
 */
import { useEffect, useRef, useState } from "react";

/**
 * Observes when an element enters the viewport and returns the element ref plus entry.
 */
export function useIntersectionObserver<TElement extends Element>(options?: IntersectionObserverInit) {
  const ref = useRef<TElement | null>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([nextEntry]) => setEntry(nextEntry ?? null), options);
    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return { ref, entry, isIntersecting: Boolean(entry?.isIntersecting) };
}
