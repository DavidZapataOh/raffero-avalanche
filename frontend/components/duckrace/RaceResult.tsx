"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Duck } from "./Duck";

interface RaceResultProps {
  winnerAlias: string;
  prizeAmount: string;
  visible: boolean;
}

/**
 * Winner celebration overlay — animated entrance with sparkles and a
 * crowned duck. Mirrors the roulette RouletteResult but with duck theming.
 */
function RaceResult({ winnerAlias, prizeAmount, visible }: RaceResultProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(4,4,4,0.85)] backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Sparkle / splash particles */}
          <Sparkles />

          {/* Main card */}
          <motion.div
            className={cn(
              "relative flex flex-col items-center gap-5 rounded-3xl border border-[rgba(83,227,195,0.25)]",
              "bg-[#0d0d0d] px-10 py-10 shadow-[0_0_60px_rgba(83,227,195,0.15)]",
            )}
            initial={{ opacity: 0, scale: 0.5, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.35 }}
          >
            {/* Winner banner */}
            <motion.span
              className="font-[family-name:var(--font-display)] text-4xl tracking-wide text-[#e3c353] drop-shadow-[0_0_18px_rgba(227,195,83,0.5)]"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              WINNER!
            </motion.span>

            {/* Crowned duck */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.35, type: "spring", bounce: 0.5 }}
            >
              <Duck
                alias={winnerAlias}
                color="#e3c353"
                isWinner
                className="scale-[1.8]"
              />
            </motion.div>

            {/* Alias */}
            <motion.p
              className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold text-[#f5f0e1]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {winnerAlias}
            </motion.p>

            {/* Prize amount */}
            <motion.div
              className="flex items-center gap-2 rounded-full border border-[rgba(83,227,195,0.3)] bg-[rgba(83,227,195,0.08)] px-5 py-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#53e3c3]">
                {prizeAmount}
              </span>
            </motion.div>

            {/* Subtle water splash decoration */}
            <svg
              viewBox="0 0 200 24"
              className="absolute -bottom-3 left-1/2 w-48 -translate-x-1/2 opacity-30"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 20 Q25 8 50 18 Q75 4 100 16 Q125 6 150 18 Q175 8 200 20"
                fill="none"
                stroke="#53e3c3"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sparkles sub-component — floating celebration particles
// ─────────────────────────────────────────────────────────────────────────────

function Sparkles() {
  const particles = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    const distance = 120 + (i % 3) * 60;
    const size = 4 + (i % 4) * 2;
    const delay = (i % 6) * 0.1;
    const isDroplet = i % 3 === 0;

    return (
      <motion.div
        key={i}
        className={cn(
          "absolute rounded-full",
          isDroplet ? "bg-[#53e3c3]" : "bg-[#e3c353]",
        )}
        style={{
          width: size,
          height: isDroplet ? size * 1.5 : size,
          borderRadius: isDroplet ? "50% 50% 50% 50% / 60% 60% 40% 40%" : "50%",
          left: "50%",
          top: "50%",
        }}
        initial={{
          x: 0,
          y: 0,
          opacity: 1,
          scale: 0,
        }}
        animate={{
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          opacity: 0,
          scale: [0, 1.5, 0],
        }}
        transition={{
          duration: 1.5,
          delay,
          ease: "easeOut",
          repeat: Infinity,
          repeatDelay: 1.2,
        }}
      />
    );
  });

  return <div className="pointer-events-none absolute inset-0">{particles}</div>;
}

export { RaceResult, type RaceResultProps };
