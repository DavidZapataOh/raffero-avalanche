"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface RouletteResultProps {
  winnerAlias: string;
  prizeAmount: string;
  visible: boolean;
}

function RouletteResult({ winnerAlias, prizeAmount, visible }: RouletteResultProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.15,
          }}
          className={cn(
            "relative flex flex-col items-center justify-center gap-3 py-8 px-10",
            "rounded-2xl border border-mint/20",
            "bg-bg-surface/80 backdrop-blur-md",
          )}
        >
          {/* Spotlight glow */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 rounded-2xl"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(83,227,195,0.25) 0%, transparent 70%)",
            }}
          />

          {/* Outer glow ring */}
          <motion.div
            className="pointer-events-none absolute -inset-3 -z-20 rounded-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.3, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(83,227,195,0.18) 0%, transparent 70%)",
            }}
          />

          {/* WINNER heading */}
          <motion.h2
            className="font-display text-4xl tracking-wider text-mint sm:text-5xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            WINNER!
          </motion.h2>

          {/* Winner alias */}
          <motion.p
            className="font-heading text-2xl text-cream sm:text-3xl"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {winnerAlias}
          </motion.p>

          {/* Prize amount */}
          <motion.p
            className="font-body text-lg text-gray-300 sm:text-xl"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            {prizeAmount}
          </motion.p>

          {/* Decorative sparkle dots */}
          {[...Array(6)].map((_, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-mint"
              style={{
                top: `${15 + Math.sin(i * 1.1) * 35}%`,
                left: `${10 + ((i * 17) % 80)}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.2, 0],
              }}
              transition={{
                delay: 0.8 + i * 0.15,
                duration: 1.6,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { RouletteResult, type RouletteResultProps };
