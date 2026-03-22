"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
}

function Skeleton({ className, rounded = false }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gray-800",
        rounded ? "rounded-full" : "rounded-xl",
        className
      )}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 60%, transparent 100%)",
        }}
      />
    </div>
  );
}

export { Skeleton, type SkeletonProps };
