"use client";

import { cn } from "@/lib/utils";

interface DuckProps {
  alias: string;
  color: string;
  isWinner: boolean;
  className?: string;
}

/**
 * Rubber-hose style duck — inline SVG, side-view facing right.
 * Includes a bobbing animation class and optional winner crown + glow.
 */
function Duck({ alias, color, isWinner, className }: DuckProps) {
  const label = alias.length > 12 ? `${alias.slice(0, 11)}…` : alias;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-0.5",
        isWinner && "drop-shadow-[0_0_14px_rgba(83,227,195,0.55)]",
        className,
      )}
    >
      <svg
        viewBox="0 0 80 64"
        width={56}
        height={44}
        xmlns="http://www.w3.org/2000/svg"
        className={cn("duck-bob", isWinner && "duck-winner")}
        style={{ overflow: "visible" }}
      >
        {/* ---------- crown (winner only) ---------- */}
        {isWinner && (
          <g>
            <polygon
              points="25,8 30,0 35,6 40,0 45,6 50,0 55,8"
              fill="#e3c353"
              stroke="#c4a620"
              strokeWidth={1.2}
              strokeLinejoin="round"
            />
            {/* jewels */}
            <circle cx={30} cy={4} r={1.2} fill="#e3536e" />
            <circle cx={40} cy={3} r={1.2} fill="#53e3c3" />
            <circle cx={50} cy={4} r={1.2} fill="#e3536e" />
          </g>
        )}

        {/* ---------- body ---------- */}
        <ellipse
          cx={40}
          cy={38}
          rx={22}
          ry={16}
          fill={color}
          stroke="#040404"
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ---------- wing ---------- */}
        <ellipse
          cx={36}
          cy={36}
          rx={10}
          ry={8}
          fill="none"
          stroke="#040404"
          strokeWidth={2}
          strokeLinecap="round"
          transform="rotate(-10 36 36)"
        />

        {/* ---------- tail ---------- */}
        <path
          d="M18 34 Q10 28 14 22 Q18 26 20 30"
          fill={color}
          stroke="#040404"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ---------- neck / head ---------- */}
        <ellipse
          cx={58}
          cy={22}
          rx={11}
          ry={10}
          fill={color}
          stroke="#040404"
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ---------- bill ---------- */}
        <path
          d="M66 24 Q76 22 76 26 Q76 28 66 27 Z"
          fill="#e3a33a"
          stroke="#040404"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ---------- eye ---------- */}
        <circle cx={61} cy={19} r={3} fill="#ffffff" />
        <circle cx={62.4} cy={18.6} r={1.5} fill="#040404" />

        {/* ---------- eye highlight ---------- */}
        <circle cx={63} cy={17.8} r={0.6} fill="#ffffff" />

        {/* ---------- water-line splash marks ---------- */}
        <path
          d="M20 52 Q24 48 28 52"
          fill="none"
          stroke="rgba(83,227,195,0.35)"
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        <path
          d="M34 54 Q37 50 40 54"
          fill="none"
          stroke="rgba(83,227,195,0.25)"
          strokeWidth={1}
          strokeLinecap="round"
        />
      </svg>

      {/* Alias label */}
      <span
        className={cn(
          "max-w-[72px] truncate text-center font-[family-name:var(--font-heading)] text-[10px] leading-tight",
          isWinner ? "text-[#e3c353] font-bold" : "text-[#a8a8a8]",
        )}
      >
        {label}
      </span>

      {/* Inline keyframes for bobbing */}
      <style jsx>{`
        .duck-bob {
          animation: duck-bob 0.6s ease-in-out infinite alternate;
        }
        .duck-winner {
          animation: duck-bob-winner 0.4s ease-in-out infinite alternate;
        }
        @keyframes duck-bob {
          from { transform: translateY(0); }
          to   { transform: translateY(-3px); }
        }
        @keyframes duck-bob-winner {
          from { transform: translateY(0) scale(1); }
          to   { transform: translateY(-5px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

export { Duck, type DuckProps };
