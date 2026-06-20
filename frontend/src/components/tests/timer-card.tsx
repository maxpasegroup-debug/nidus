"use client";

import { useEffect, useMemo, useState } from "react";

export function TimerCard({
  minutes,
  remainingSeconds,
  onExpire
}: {
  minutes: number;
  remainingSeconds?: number;
  onExpire: () => void;
}) {
  const initialSeconds = useMemo(() => Math.max(0, Math.floor(remainingSeconds ?? minutes * 60)), [minutes, remainingSeconds]);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          onExpire();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [onExpire]);

  const minutesPart = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const secondsPart = (secondsLeft % 60).toString().padStart(2, "0");
  const ratio = secondsLeft / Math.max(1, minutes * 60);
  const urgent = secondsLeft <= 300;
  const tone = urgent ? "border-red-300 bg-red-50 text-red-700" : ratio <= 0.35 ? "border-orange-300 bg-orange-50 text-orange-700" : "border-emerald-300 bg-emerald-50 text-emerald-700";

  return (
    <div className={`rounded-lg border p-4 text-center ${tone} ${urgent ? "animate-pulse" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em]">Time Left</p>
      <p className="mt-2 text-3xl font-semibold">{minutesPart}:{secondsPart}</p>
      <p className="mt-2 text-xs">Auto-submit starts when timer reaches zero.</p>
    </div>
  );
}
