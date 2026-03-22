"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm text-gray-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full bg-bg-elevated border border-gray-700 text-cream placeholder:text-gray-500",
            "rounded-xl px-4 py-2.5 text-base outline-none transition-all duration-150",
            "focus:border-mint focus:ring-1 focus:ring-mint/30",
            error && "border-danger focus:border-danger focus:ring-danger/30",
            className
          )}
          {...rest}
        />
        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, type InputProps };
