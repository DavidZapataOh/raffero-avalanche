"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

const typeConfig: Record<
  ToastType,
  { color: string; icon: React.ReactNode }
> = {
  success: {
    color: "text-mint",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M5.5 9.5L7.5 11.5L12.5 6.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  error: {
    color: "text-danger",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M6.5 6.5L11.5 11.5M11.5 6.5L6.5 11.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  info: {
    color: "text-cream",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M9 8V12.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="9" cy="5.5" r="0.75" fill="currentColor" />
      </svg>
    ),
  },
};

function Toast({ message, type = "info", onClose }: ToastProps) {
  const config = typeConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, y: -10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-bg-elevated border border-gray-700",
        "shadow-[0_8px_32px_rgba(0,0,0,0.6)]",
        "min-w-[280px] max-w-[400px]"
      )}
    >
      <span className={cn("shrink-0", config.color)}>{config.icon}</span>
      <p className="flex-1 text-sm text-cream">{message}</p>
      <button
        onClick={onClose}
        className="shrink-0 text-gray-500 hover:text-cream transition-colors cursor-pointer"
        aria-label="Close notification"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <line x1="2" y1="2" x2="12" y2="12" />
          <line x1="12" y1="2" x2="2" y2="12" />
        </svg>
      </button>
    </motion.div>
  );
}

export { Toast, type ToastProps, type ToastType };
