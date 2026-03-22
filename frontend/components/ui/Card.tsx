"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: ReactNode;
  hover?: boolean;
}

function Card({ className, children, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-700 bg-transparent transition-colors duration-200",
        hover && "hover:border-mint/30 hover:shadow-[0_0_20px_rgba(83,227,195,0.08)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export { Card, type CardProps };
