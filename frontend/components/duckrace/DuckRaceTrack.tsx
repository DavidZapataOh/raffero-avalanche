"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Duck } from "./Duck";
import { WaterEffect } from "./WaterEffect";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LANE_HEIGHT = 68;
const MAX_VISIBLE_LANES = 16;
const RACE_DURATION = 5.5; // seconds
const TRACK_PADDING_LEFT = 120; // space for lane labels
const TRACK_PADDING_RIGHT = 40;
const FINISH_LINE_WIDTH = 10;

/** Rubber-hose palette for duck bodies. */
const DUCK_COLORS = [
  "#e3c353", "#53e3c3", "#e3536e", "#53a3e3", "#c35ce3",
  "#e38a53", "#53e370", "#e35393", "#7ae353", "#e3d453",
  "#53d4e3", "#e35353", "#9b53e3", "#53e3a8", "#e37053",
  "#53c4e3",
];

// ─────────────────────────────────────────────────────────────────────────────
// Seeded pseudo-random (deterministic per-participant)
// ─────────────────────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface DuckRaceTrackProps {
  participants: string[];
  winnerIndex: number;
  racing: boolean;
  onRaceComplete?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

function DuckRaceTrack({
  participants,
  winnerIndex,
  racing,
  onRaceComplete,
}: DuckRaceTrackProps) {
  const [progress, setProgress] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const calledCompleteRef = useRef(false);

  const count = participants.length;
  const visibleCount = Math.min(count, MAX_VISIBLE_LANES);
  const trackHeight = visibleCount * LANE_HEIGHT;

  // Pre-compute per-duck speed curves (deterministic).
  // The winner gets a slight base-speed boost so it always finishes first.
  const speedCurves = useMemo(() => {
    return participants.map((_, i) => {
      const rng = seededRandom((i + 1) * 7919);
      // Base speed factor: 0.65 – 0.85 for non-winners, 0.90 for the winner
      const base = i === winnerIndex ? 0.92 : 0.65 + rng() * 0.2;
      // Per-frame jitter amplitude
      const jitter = 0.05 + rng() * 0.08;
      // Phase offset for sine wobble
      const phase = rng() * Math.PI * 2;
      return { base, jitter, phase, rng };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants.length, winnerIndex]);

  // Animation loop
  useEffect(() => {
    if (!racing) {
      setProgress(participants.map(() => 0));
      setFinished(false);
      calledCompleteRef.current = false;
      return;
    }

    startTimeRef.current = performance.now();
    const positions = participants.map(() => 0);

    function tick(now: number) {
      const elapsed = (now - startTimeRef.current) / 1000;
      const t = Math.min(elapsed / RACE_DURATION, 1);

      // Ease-in-out progress curve
      const easedT = t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;

      for (let i = 0; i < participants.length; i++) {
        const { base, jitter, phase } = speedCurves[i];
        const wobble = Math.sin(elapsed * 3 + phase) * jitter;
        positions[i] = Math.min((easedT * (base + wobble)) / 0.92, 1);
      }

      // Force winner to be at 1.0 when t reaches 1
      if (t >= 1) {
        positions[winnerIndex] = 1;
      }

      setProgress([...positions]);

      if (t >= 1) {
        setFinished(true);
        if (!calledCompleteRef.current) {
          calledCompleteRef.current = true;
          onRaceComplete?.();
        }
        return;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [racing]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-gray-700 bg-[#060e18]">
      {/* Water background */}
      <WaterEffect />

      {/* Scrollable lane area */}
      <div
        className="relative overflow-y-auto"
        style={{ maxHeight: MAX_VISIBLE_LANES * LANE_HEIGHT }}
      >
        <div style={{ height: count * LANE_HEIGHT }}>
          {participants.map((alias, i) => {
            const y = i * LANE_HEIGHT;
            const p = progress[i] ?? 0;
            const isWinner = finished && i === winnerIndex;

            return (
              <div
                key={i}
                className="absolute left-0 w-full"
                style={{ top: y, height: LANE_HEIGHT }}
              >
                {/* Lane divider */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-[rgba(83,227,195,0.08)]" />

                {/* Lane number + alias label */}
                <div
                  className="absolute left-2 top-0 flex h-full items-center gap-2"
                  style={{ width: TRACK_PADDING_LEFT - 16 }}
                >
                  <span className="text-xs font-bold text-[#666666] font-[family-name:var(--font-heading)]">
                    {i + 1}
                  </span>
                  <span
                    className={cn(
                      "max-w-[80px] truncate text-xs font-[family-name:var(--font-heading)]",
                      isWinner ? "text-[#e3c353] font-bold" : "text-[#a8a8a8]",
                    )}
                  >
                    {alias}
                  </span>
                </div>

                {/* Start line */}
                <div
                  className="absolute top-0 h-full w-px bg-[rgba(83,227,195,0.2)]"
                  style={{ left: TRACK_PADDING_LEFT }}
                />

                {/* Track area for this lane — duck moves within as percentage */}
                <div
                  className="absolute top-0 h-full"
                  style={{
                    left: TRACK_PADDING_LEFT,
                    right: TRACK_PADDING_RIGHT + FINISH_LINE_WIDTH,
                  }}
                >
                  <div
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ left: `${p * 100}%` }}
                  >
                    <Duck
                      alias=""
                      color={DUCK_COLORS[i % DUCK_COLORS.length]}
                      isWinner={isWinner}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Finish line — checkered pattern */}
          <div
            className="absolute top-0 h-full"
            style={{
              right: TRACK_PADDING_RIGHT,
              width: FINISH_LINE_WIDTH,
            }}
          >
            {Array.from({ length: Math.ceil((count * LANE_HEIGHT) / 8) }).map(
              (_, row) => (
                <div key={row} className="flex" style={{ height: 8 }}>
                  <div
                    className={cn(
                      "h-2 w-[5px]",
                      row % 2 === 0 ? "bg-white" : "bg-[#040404]",
                    )}
                  />
                  <div
                    className={cn(
                      "h-2 w-[5px]",
                      row % 2 === 0 ? "bg-[#040404]" : "bg-white",
                    )}
                  />
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* "GO!" overlay at race start */}
      {racing && !finished && progress.every((p) => p < 0.05) && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          initial={{ opacity: 1, scale: 2 }}
          animate={{ opacity: 0, scale: 4 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="font-[family-name:var(--font-display)] text-6xl text-[#53e3c3] drop-shadow-[0_0_20px_rgba(83,227,195,0.6)]">
            GO!
          </span>
        </motion.div>
      )}
    </div>
  );
}

export { DuckRaceTrack, type DuckRaceTrackProps };
