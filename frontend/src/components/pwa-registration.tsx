"use client";

import { useEffect } from "react";
import { useToast } from "@/components/providers/toast-provider";

export function PwaRegistration() {
  const { showToast } = useToast();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return;
    }

    const pwaEnabled = process.env.NEXT_PUBLIC_ENABLE_PWA === "true";
    if (!pwaEnabled) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => caches.keys())
        .then((keys) => Promise.all(keys.filter((key) => key.startsWith("nidus-")).map((key) => caches.delete(key))))
        .catch(() => undefined);
      return;
    }

    let refreshing = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        void registration.update();

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              showToast("NIDUS update ready. Refreshing app shell.", "info");
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch(() => showToast("Offline shell registration failed. App remains usable online.", "error"));
  }, [showToast]);

  return null;
}
