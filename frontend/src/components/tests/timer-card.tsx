"use client";

import { useEffect, useState } from "react";

export function TimerCard({ minutes, onExpire }: { minutes: number; onExpire: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);

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

  return (
    <div className="rounded-lg border border-gold/25 bg-gold/10 p-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Time Left</p>
      <p className="mt-2 text-3xl font-semibold text-gold-soft">{minutesPart}:{secondsPart}</p>
    </div>
  );
}
