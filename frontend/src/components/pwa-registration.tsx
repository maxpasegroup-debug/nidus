"use client";

import { useEffect } from "react";
import { useToast } from "@/components/providers/toast-provider";

export function PwaRegistration() {
  const { showToast } = useToast();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
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
              showToast("NIDUS reliability update ready. Refreshing safely.", "info");
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch(() => showToast("Offline shell registration failed. App remains usable online.", "error"));
  }, [showToast]);

  return null;
}
