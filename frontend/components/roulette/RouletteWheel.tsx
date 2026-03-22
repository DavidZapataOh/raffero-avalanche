"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AliasSlice } from "./AliasSlice";

interface RouletteWheelProps {
  participants: string[];
  winnerIndex: number;
  spinning: boolean;
  onSpinComplete?: () => void;
}

/**
 * SVG roulette wheel with CSS transition-based spin animation.
 *
 * We avoid framer-motion's `onAnimationComplete` for the spin because it
 * fires spuriously on mount (initial→animate with identical values counts as
 * a completed animation). Instead we use a plain CSS transition on the SVG
 * `transform` and a `setTimeout` matching the transition duration.
 */
function RouletteWheel({
  participants,
  winnerIndex,
  spinning,
  onSpinComplete,
}: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [settled, setSettled] = useState(false);
  const wheelRef = useRef<SVGGElement>(null);

  const total = Math.max(participants.length, 2);
  const sliceAngle = 360 / total;

  const SPIN_DURATION_MS = 4500;

  useEffect(() => {
    if (!spinning || animating) return;

    setSettled(false);
    setAnimating(true);

    // 5 full turns + offset to land winner slice under the pointer at top
    const fullTurns = 5;
    const targetSliceCenter = winnerIndex * sliceAngle + sliceAngle / 2;
    const finalAngle = fullTurns * 360 + (360 - targetSliceCenter);

    // Small delay so the browser paints the wheel at rotation=0 first
    requestAnimationFrame(() => {
      setRotation(finalAngle);
    });

    // Fire completion callback after the CSS transition ends
    const timer = setTimeout(() => {
      setSettled(true);
      setAnimating(false);
      onSpinComplete?.();
    }, SPIN_DURATION_MS + 200); // +200ms buffer

    return () => clearTimeout(timer);
  }, [spinning]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset when the parent sets spinning back to false (new round)
  useEffect(() => {
    if (!spinning && !animating) {
      setRotation(0);
      setSettled(false);
    }
  }, [spinning, animating]);

  return (
    <div className="relative mx-auto w-full max-w-[480px]">
      <svg
        viewBox="0 0 400 400"
        width="100%"
        height="100%"
        className="overflow-visible"
      >
        <defs>
          <filter id="wheel-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#53e3c3" floodOpacity="0.15" />
          </filter>
          <filter id="winner-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="ring-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="#0d0d0d" stopOpacity="0" />
            <stop offset="100%" stopColor="#53e3c3" stopOpacity="0.08" />
          </radialGradient>
        </defs>

        {/* Decorative outer ring */}
        <circle cx="200" cy="200" r="195" fill="none" stroke="rgba(83,227,195,0.12)" strokeWidth="2" />
        <circle cx="200" cy="200" r="190" fill="none" stroke="rgba(83,227,195,0.06)" strokeWidth="1" strokeDasharray="4 6" />

        {/* Rotating wheel group — CSS transition driven */}
        <g
          ref={wheelRef}
          filter="url(#wheel-shadow)"
          style={{
            transformOrigin: "200px 200px",
            transform: `rotate(${rotation}deg)`,
            transition: rotation > 0
              ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.12, 0.8, 0.24, 1)`
              : "none",
          }}
        >
          {/* Wheel background disc */}
          <circle cx="200" cy="200" r="180" fill="#0d0d0d" />

          {/* Slices */}
          {participants.map((alias, i) => (
            <AliasSlice
              key={`${alias}-${i}`}
              alias={alias}
              index={i}
              total={total}
              isWinner={settled && i === winnerIndex}
            />
          ))}

          {/* Inner ring decoration */}
          <circle cx="200" cy="200" r="64" fill="#0d0d0d" stroke="rgba(83,227,195,0.15)" strokeWidth="2" />
          <circle cx="200" cy="200" r="56" fill="#1a1a1a" stroke="rgba(83,227,195,0.10)" strokeWidth="1.5" />

          {/* Center hub */}
          <circle cx="200" cy="200" r="28" fill="#0d0d0d" />
          <circle cx="200" cy="200" r="24" fill="none" stroke="#53e3c3" strokeWidth="2.5" opacity="0.4" />
          <circle cx="200" cy="200" r="8" fill="#53e3c3" opacity="0.7" />

          {/* Tick marks on outer edge */}
          {participants.map((_, i) => {
            const angle = (i * sliceAngle - 90) * (Math.PI / 180);
            const x1 = 200 + 175 * Math.cos(angle);
            const y1 = 200 + 175 * Math.sin(angle);
            const x2 = 200 + 180 * Math.cos(angle);
            const y2 = 200 + 180 * Math.sin(angle);
            return (
              <line
                key={`tick-${i}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#53e3c3" strokeWidth="1.5" opacity="0.3"
              />
            );
          })}
        </g>

        {/* Pointer (stationary, points down at the wheel from top) */}
        <g filter={settled ? "url(#winner-glow)" : undefined}>
          <polygon points="200,28 190,6 210,6" fill="#53e3c3" stroke="#040404" strokeWidth="1.5" />
          <circle cx="200" cy="3" r="3" fill="#53e3c3" opacity="0.6" />
        </g>

        {/* Gradient overlay for depth */}
        <circle cx="200" cy="200" r="190" fill="url(#ring-gradient)" pointerEvents="none" />
      </svg>

      {/* Pulsing glow underneath during spin */}
      {animating && (
        <motion.div
          className="pointer-events-none absolute inset-0 -z-10 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0.1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(83,227,195,0.15) 0%, transparent 60%)",
          }}
        />
      )}
    </div>
  );
}

export { RouletteWheel, type RouletteWheelProps };
