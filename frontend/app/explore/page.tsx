"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { RaffleMode, RaffleStatus, Raffle } from "@/lib/types";
import { RaffleCard } from "@/components/raffle/RaffleCard";

type ModeFilter = "all" | RaffleMode;
type StatusFilter = "all" | RaffleStatus;

// Mock data built inside component to avoid SSR/client Date.now() mismatch
function getMockRaffles(): Raffle[] {
  const now = Math.floor(Date.now() / 1000);
  return [
    {
      id: 1n, mode: "roulette", visibility: "public", title: "Spin to Win #1",
      ticketPrice: 500000000000000000n, levels: 4, maxSize: 16, nextIndex: 11,
      root: 0n, open: true, winnerSet: false, winnerIndex: 0,
      prizePool: 5500000000000000000n, createdAt: now - 86400, endsAt: now + 86400 * 2,
    },
    {
      id: 2n, mode: "duckrace", visibility: "public", title: "Duck Derby #3",
      ticketPrice: 250000000000000000n, levels: 3, maxSize: 8, nextIndex: 8,
      root: 0n, open: false, winnerSet: true, winnerIndex: 3,
      prizePool: 2000000000000000000n, createdAt: now - 172800, endsAt: now - 3600,
    },
    {
      id: 3n, mode: "roulette", visibility: "public", title: "High Roller Roulette",
      ticketPrice: 1000000000000000000n, levels: 5, maxSize: 32, nextIndex: 7,
      root: 0n, open: true, winnerSet: false, winnerIndex: 0,
      prizePool: 7000000000000000000n, createdAt: now - 43200, endsAt: now + 86400 * 5,
    },
    {
      id: 4n, mode: "duckrace", visibility: "public", title: "Quack Attack",
      ticketPrice: 100000000000000000n, levels: 4, maxSize: 16, nextIndex: 14,
      root: 0n, open: true, winnerSet: false, winnerIndex: 0,
      prizePool: 1400000000000000000n, createdAt: now - 7200, endsAt: now + 3600 * 8,
    },
    {
      id: 5n, mode: "roulette", visibility: "public", title: "Lucky Spin",
      ticketPrice: 200000000000000000n, levels: 3, maxSize: 8, nextIndex: 8,
      root: 0n, open: false, winnerSet: true, winnerIndex: 5,
      prizePool: 1600000000000000000n, createdAt: now - 259200, endsAt: now - 86400,
    },
    {
      id: 6n, mode: "duckrace", visibility: "public", title: "Pond Party",
      ticketPrice: 500000000000000000n, levels: 4, maxSize: 16, nextIndex: 3,
      root: 0n, open: true, winnerSet: false, winnerIndex: 0,
      prizePool: 1500000000000000000n, createdAt: now - 1800, endsAt: now + 86400 * 7,
    },
  ];
}

function getRaffleStatus(r: Raffle): RaffleStatus {
  if (r.open) return "open";
  if (r.winnerSet) return "completed";
  return "drawing";
}

const modeFilters: { value: ModeFilter; label: string }[] = [
  { value: "all", label: "All Modes" },
  { value: "roulette", label: "Roulette" },
  { value: "duckrace", label: "Duck Race" },
];

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "drawing", label: "Drawing" },
  { value: "completed", label: "Completed" },
];

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 text-sm font-medium rounded-full border transition-colors cursor-pointer",
        active
          ? "bg-mint/15 border-mint/40 text-mint"
          : "border-gray-700 text-gray-300 hover:border-gray-500 hover:text-cream"
      )}
    >
      {label}
    </button>
  );
}

export default function ExplorePage() {
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [raffles] = useState(getMockRaffles);

  const filtered = raffles.filter((r) => {
    if (modeFilter !== "all" && r.mode !== modeFilter) return false;
    const status = getRaffleStatus(r);
    if (statusFilter !== "all" && status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h1 className="font-heading text-4xl font-bold text-cream mb-2">
          Explore Raffles
        </h1>
        <p className="text-gray-300 text-lg">
          Browse public raffles and find your next win.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-wrap gap-6 mb-8"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 mr-1">Mode:</span>
          {modeFilters.map((f) => (
            <FilterPill
              key={f.value}
              label={f.label}
              active={modeFilter === f.value}
              onClick={() => setModeFilter(f.value)}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 mr-1">Status:</span>
          {statusFilters.map((f) => (
            <FilterPill
              key={f.value}
              label={f.label}
              active={statusFilter === f.value}
              onClick={() => setStatusFilter(f.value)}
            />
          ))}
        </div>
      </motion.div>

      {/* Raffle grid */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p className="text-gray-500 text-lg">No raffles match your filters.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((raffle, i) => (
            <motion.div
              key={raffle.id.toString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
            >
              <RaffleCard raffle={raffle} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
