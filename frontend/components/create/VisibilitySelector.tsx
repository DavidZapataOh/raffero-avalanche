"use client";

import { cn } from "@/lib/utils";
import type { RaffleVisibility } from "@/lib/types";

interface VisibilitySelectorProps {
  value: RaffleVisibility;
  onChange: (v: RaffleVisibility) => void;
}

const options: { value: RaffleVisibility; label: string; description: string; icon: string }[] = [
  {
    value: "public",
    label: "Public",
    description: "Visible in Explore page",
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
  },
  {
    value: "hidden",
    label: "Hidden",
    description: "Only accessible via link",
    icon: "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z",
  },
  {
    value: "private",
    label: "Private",
    description: "Requires PIN to join",
    icon: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
  },
];

export function VisibilitySelector({ value, onChange }: VisibilitySelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border transition-colors text-left cursor-pointer",
              selected
                ? "border-mint bg-mint/5"
                : "border-gray-700 hover:border-gray-500"
            )}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={cn(
                "shrink-0 transition-colors",
                selected ? "text-mint" : "text-gray-500"
              )}
            >
              <path d={opt.icon} />
            </svg>
            <div>
              <p className={cn(
                "font-medium transition-colors",
                selected ? "text-mint" : "text-cream"
              )}>
                {opt.label}
              </p>
              <p className="text-sm text-gray-500">{opt.description}</p>
            </div>
            <div
              className={cn(
                "ml-auto w-5 h-5 rounded-full border-2 shrink-0 transition-colors",
                selected
                  ? "border-mint bg-mint"
                  : "border-gray-600"
              )}
            >
              {selected && (
                <svg viewBox="0 0 20 20" fill="white" className="w-full h-full">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
