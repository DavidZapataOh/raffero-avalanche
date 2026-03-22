"use client";

import { cn } from "@/lib/utils";

interface ParticipantCountProps {
  current: number;
  max: number;
  className?: string;
}

export function ParticipantCount({ current, max, className }: ParticipantCountProps) {
  const percent = Math.round((current / max) * 100);

  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-sm text-gray-300">
        <span className="text-cream font-semibold">{current}</span>
        <span className="text-gray-500">/{max}</span>
      </p>
      <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-mint transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
