"use client";

import Countdown from "react-countdown";

export function CountdownTimer({ date }: { date: string }) {
  return (
    <Countdown
      date={new Date(date)}
      renderer={({ days, hours, minutes, completed }) =>
        completed ? <span>Started</span> : <span>{days}d {hours}h {minutes}m</span>
      }
    />
  );
}
