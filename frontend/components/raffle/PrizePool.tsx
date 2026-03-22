"use client";

import { formatAvax } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PrizePoolProps {
  amount: bigint;
  className?: string;
}

export function PrizePool({ amount, className }: PrizePoolProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="text-mint shrink-0"
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 8L8 4L11 8L8 12Z" fill="currentColor" opacity="0.6" />
      </svg>
      <span className="font-heading text-lg font-bold text-mint">
        {formatAvax(amount)}
      </span>
    </div>
  );
}
