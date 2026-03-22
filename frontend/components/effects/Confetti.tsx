"use client";

import { useState, useEffect } from "react";

interface ConfettiProps {
  active: boolean;
  duration?: number;
}

const COLORS = ["#53e3c3", "#f5f0e1", "#e3c353", "#e3536e"];
const SHAPES = ["rect", "circle"] as const;

interface Piece {
  id: number;
  x: number;
  color: string;
  shape: (typeof SHAPES)[number];
  size: number;
  rotationSpeed: number;
  fallDuration: number;
  delay: number;
  drift: number;
}

function generatePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    size: 4 + Math.random() * 8,
    rotationSpeed: 0.5 + Math.random() * 3,
    fallDuration: 2 + Math.random() * 2.5,
    delay: Math.random() * 0.8,
    drift: -30 + Math.random() * 60,
  }));
}

function Confetti({ active, duration = 4000 }: ConfettiProps) {
  const [visible, setVisible] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }

    const count = 50 + Math.floor(Math.random() * 30);
    setPieces(generatePieces(count));
    setVisible(true);

    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [active, duration]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 10000 }}
      aria-hidden
    >
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) translateX(0px) rotate(0deg);
            opacity: 1;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(var(--drift)) rotate(var(--spin));
            opacity: 0;
          }
        }
      `}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: "-12px",
            width: p.shape === "rect" ? `${p.size}px` : `${p.size}px`,
            height: p.shape === "rect" ? `${p.size * 0.6}px` : `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            opacity: 0,
            ["--drift" as string]: `${p.drift}px`,
            ["--spin" as string]: `${p.rotationSpeed * 360}deg`,
            animation: `confetti-fall ${p.fallDuration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

export { Confetti, type ConfettiProps };
