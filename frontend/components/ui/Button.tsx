"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children" | "disabled"> {
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-mint text-bg-primary hover:bg-mint-hover active:bg-mint-active font-semibold",
  secondary:
    "border border-gray-700 text-cream hover:border-gray-500 hover:bg-white/5",
  danger:
    "bg-danger text-cream hover:bg-danger-hover font-semibold",
  ghost:
    "bg-transparent text-cream hover:bg-white/5",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-5 py-2.5 text-base rounded-xl gap-2",
  lg: "px-7 py-3.5 text-lg rounded-xl gap-2.5",
};

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
      />
    </svg>
  );
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      disabled = false,
      loading = false,
      children,
      className,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        whileTap={isDisabled ? undefined : { scale: 0.96 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "inline-flex items-center justify-center cursor-pointer transition-colors duration-150",
          variantClasses[variant],
          sizeClasses[size],
          isDisabled && "opacity-50 saturate-0 bg-gray-700 cursor-not-allowed pointer-events-none",
          className
        )}
        {...rest}
      >
        {loading && <Spinner />}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export { Button, type ButtonProps };
