"use client";

import { useState, useEffect } from "react";

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEnded: boolean;
  isUrgent: boolean;
  total: number;
}

/**
 * Countdown hook — returns days, hours, minutes, seconds until a target date.
 *
 * @param targetMs - Target date as Unix milliseconds.
 */
export function useCountdown(targetMs: number): CountdownResult {
  const calc = (): CountdownResult => {
    const total = Math.max(0, targetMs - Date.now());
    return {
      days: Math.floor(total / (1000 * 60 * 60 * 24)),
      hours: Math.floor((total / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((total / (1000 * 60)) % 60),
      seconds: Math.floor((total / 1000) % 60),
      isEnded: total <= 0,
      isUrgent: total > 0 && total < 60_000,
      total,
    };
  };

  const [result, setResult] = useState<CountdownResult>(calc);

  useEffect(() => {
    const interval = setInterval(() => {
      const r = calc();
      setResult(r);
      if (r.isEnded) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  return result;
}
