"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { RaffleMode } from "@/lib/types";

interface ModeSelectorProps {
  value: RaffleMode;
  onChange: (mode: RaffleMode) => void;
}

function RouletteIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" />
      <circle cx="32" cy="32" r="4" fill="currentColor" />
      <line x1="32" y1="4" x2="32" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="50" x2="32" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="32" x2="14" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="32" x2="60" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DuckIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <ellipse cx="30" cy="40" rx="20" ry="14" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="22" cy="26" r="10" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="19" cy="24" r="2" fill="currentColor" />
      <path d="M12 28 C8 28, 6 30, 8 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M44 44 C48 44, 52 42, 50 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Water waves */}
      <path d="M8 54 Q16 50, 24 54 Q32 58, 40 54 Q48 50, 56 54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

const modes: { value: RaffleMode; label: string; description: string; Icon: () => React.JSX.Element }[] = [
  {
    value: "roulette",
    label: "Roulette",
    description: "Spin the wheel to pick a winner",
    Icon: RouletteIcon,
  },
  {
    value: "duckrace",
    label: "Duck Race",
    description: "Ducks race across the pond",
    Icon: DuckIcon,
  },
];

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {modes.map((mode) => {
        const selected = value === mode.value;
        return (
          <motion.button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-colors cursor-pointer",
              selected
                ? "border-mint bg-mint/5 text-mint"
                : "border-gray-700 text-gray-300 hover:border-gray-500 hover:text-cream"
            )}
          >
            {selected && (
              <motion.div
                layoutId="mode-selected"
                className="absolute inset-0 rounded-2xl border-2 border-mint"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <mode.Icon />
            <div className="text-center">
              <p className="font-heading text-xl font-semibold">{mode.label}</p>
              <p className="text-sm text-gray-500 mt-1">{mode.description}</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
