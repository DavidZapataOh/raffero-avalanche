"use client";

import { cn } from "@/lib/utils";

interface AliasSliceProps {
  alias: string;
  index: number;
  total: number;
  isWinner: boolean;
}

const COLORS = {
  mint: "rgba(83,227,195,0.20)",
  mintFull: "#53e3c3",
  dark: "#1a1a1a",
};

/**
 * Compute the SVG arc path for a pie slice centered at (cx, cy) with the
 * given radius, spanning from startAngle to endAngle (in radians).
 */
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${x1} ${y1}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
    "Z",
  ].join(" ");
}

/**
 * A single slice of the roulette wheel rendered as an SVG group.
 * Handles geometry, fill colour, and the label text positioned radially.
 */
function AliasSlice({ alias, index, total, isWinner }: AliasSliceProps) {
  const cx = 200;
  const cy = 200;
  const radius = 180;

  const sliceAngle = (2 * Math.PI) / total;
  // Offset by -90deg so index 0 starts at top-center
  const startAngle = index * sliceAngle - Math.PI / 2;
  const endAngle = startAngle + sliceAngle;
  const midAngle = startAngle + sliceAngle / 2;

  const fill = isWinner
    ? COLORS.mintFull
    : index % 2 === 0
      ? COLORS.mint
      : COLORS.dark;

  const stroke = isWinner ? COLORS.mintFull : "rgba(83,227,195,0.12)";

  // --- text positioning along the radial midline ---
  const textRadius = radius * 0.62;
  const textX = cx + textRadius * Math.cos(midAngle);
  const textY = cy + textRadius * Math.sin(midAngle);
  // Rotate text so it reads outward from center
  const textRotation = (midAngle * 180) / Math.PI + 90;
  // Flip if the text would be upside-down
  const flip =
    textRotation > 90 && textRotation < 270 ? textRotation + 180 : textRotation;

  // Truncate long aliases
  const label = alias.length > 10 ? `${alias.slice(0, 9)}...` : alias;

  // Dynamic font sizing based on participant count
  const fontSize = total <= 8 ? 11 : total <= 16 ? 9 : 7;

  const path = describeArc(cx, cy, radius, startAngle, endAngle);

  return (
    <g>
      {/* Slice wedge */}
      <path
        d={path}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.2}
        className={cn(
          "transition-all duration-500",
          isWinner && "drop-shadow-[0_0_18px_rgba(83,227,195,0.6)]",
        )}
      />

      {/* Decorative inner arc line */}
      <path
        d={describeArc(cx, cy, radius * 0.35, startAngle, endAngle)}
        fill="none"
        stroke="rgba(83,227,195,0.08)"
        strokeWidth={0.5}
      />

      {/* Label */}
      <text
        x={textX}
        y={textY}
        textAnchor="middle"
        dominantBaseline="central"
        transform={`rotate(${flip}, ${textX}, ${textY})`}
        fill={isWinner ? "#040404" : "#f5f0e1"}
        fontSize={fontSize}
        fontFamily="'Fredoka', sans-serif"
        fontWeight={isWinner ? 700 : 500}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {label}
      </text>
    </g>
  );
}

export { AliasSlice, type AliasSliceProps, describeArc };
