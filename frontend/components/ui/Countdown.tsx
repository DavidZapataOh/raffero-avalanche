"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownProps {
  targetDate: Date | number;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calcTimeLeft(target: number): TimeLeft {
  const total = Math.max(0, target - Date.now());
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function DigitBox({
  value,
  label,
  pulse,
}: {
  value: string;
  label: string;
  pulse: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "flex items-center justify-center",
          "min-w-[3.5rem] px-3 py-2 rounded-xl",
          "bg-bg-card border border-gray-700",
          "font-heading text-3xl font-bold tracking-wider text-cream",
          "transition-colors duration-300",
          pulse && "text-mint animate-pulse"
        )}
      >
        {value}
      </div>
      <span className="text-[10px] uppercase tracking-widest text-gray-500">
        {label}
      </span>
    </div>
  );
}

function Countdown({ targetDate, className }: CountdownProps) {
  const target =
    typeof targetDate === "number" ? targetDate : targetDate.getTime();

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(target));

  useEffect(() => {
    const interval = setInterval(() => {
      const tl = calcTimeLeft(target);
      setTimeLeft(tl);
      if (tl.total <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [target]);

  const isEnded = timeLeft.total <= 0;
  const isUrgent = !isEnded && timeLeft.total < 60_000;

  if (isEnded) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <span className="font-heading text-3xl font-bold text-danger tracking-wider">
          ENDED
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DigitBox value={pad(timeLeft.days)} label="Days" pulse={isUrgent} />
      <span className="text-2xl font-bold text-gray-500 -mt-4">:</span>
      <DigitBox value={pad(timeLeft.hours)} label="Hrs" pulse={isUrgent} />
      <span className="text-2xl font-bold text-gray-500 -mt-4">:</span>
      <DigitBox value={pad(timeLeft.minutes)} label="Min" pulse={isUrgent} />
      <span className="text-2xl font-bold text-gray-500 -mt-4">:</span>
      <DigitBox value={pad(timeLeft.seconds)} label="Sec" pulse={isUrgent} />
    </div>
  );
}

export { Countdown, type CountdownProps };
