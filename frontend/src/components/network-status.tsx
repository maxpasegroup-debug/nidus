"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

export function NetworkStatus() {
  const [online, setOnline] = useState(true);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      setTouched(true);
    };

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!touched || online) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex min-h-11 max-w-md items-center justify-center gap-2 rounded border border-gold/30 bg-navy-deep/95 px-4 py-3 text-sm font-semibold text-gold-soft shadow-2xl backdrop-blur-xl lg:bottom-5" role="status" aria-live="polite">
      {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
      Offline mode active. Changes will sync when the network returns.
    </div>
  );
}
