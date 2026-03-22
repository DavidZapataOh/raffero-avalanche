"use client";

import { use, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Countdown } from "@/components/ui/Countdown";
import { RouletteWheel } from "@/components/roulette/RouletteWheel";
import { DuckRaceTrack } from "@/components/duckrace/DuckRaceTrack";
import { Confetti } from "@/components/effects/Confetti";
import { formatAvax, cn } from "@/lib/utils";
import type { Raffle, RaffleStatus } from "@/lib/types";

// Mock raffle for development
const MOCK_RAFFLE: Raffle = {
  id: 1n,
  mode: "roulette",
  visibility: "public",
  title: "Spin to Win #1",
  ticketPrice: 500000000000000000n,
  levels: 4,
  maxSize: 16,
  nextIndex: 11,
  root: 0n,
  open: true,
  winnerSet: false,
  winnerIndex: 0,
  prizePool: 5500000000000000000n,
  createdAt: Math.floor(Date.now() / 1000) - 86400,
  endsAt: Math.floor(Date.now() / 1000) + 86400 * 2,
};

const MOCK_ALIASES = [
  "SilverFox", "MoonWalker", "CryptoKitty", "NeonNinja",
  "PixelPunk", "DuckMaster", "GhostRider", "StarDust",
  "ZenMonk", "IronWolf", "LuckyClover",
];

const MOCK_WINNER_INDEX = 3;

function getStatus(r: Raffle): RaffleStatus {
  if (r.open) return "open";
  if (r.winnerSet) return "completed";
  return "drawing";
}

function StatusBadge({ status }: { status: RaffleStatus }) {
  const map: Record<RaffleStatus, { variant: "success" | "warning" | "danger" | "neutral"; label: string }> = {
    open: { variant: "success", label: "Open" },
    drawing: { variant: "warning", label: "Drawing..." },
    completed: { variant: "neutral", label: "Completed" },
    claimed: { variant: "neutral", label: "Claimed" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function ParticipantList({ aliases }: { aliases: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {aliases.map((alias, i) => (
        <motion.div
          key={alias}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="px-3 py-1.5 rounded-full border border-gray-700 bg-bg-elevated text-sm text-cream"
        >
          {alias}
        </motion.div>
      ))}
    </div>
  );
}

function ModeIcon({ mode }: { mode: string }) {
  if (mode === "duckrace") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-mint">
        <ellipse cx="12" cy="15" rx="8" ry="5" opacity="0.3" />
        <circle cx="9" cy="10" r="4" />
        <circle cx="7.5" cy="9" r="1" fill="var(--bg-primary)" />
        <path d="M5 11c-1.5 0-2.5 1-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-mint">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <line x1="12" y1="3" x2="12" y2="6" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="21" strokeLinecap="round" />
    </svg>
  );
}

export default function RaffleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // TODO: Fetch real raffle data using id
  const [testMode, setTestMode] = useState<"roulette" | "duckrace">(MOCK_RAFFLE.mode);
  const raffle = { ...MOCK_RAFFLE, mode: testMode };
  const baseStatus = getStatus(raffle);
  const fillPercent = Math.round((raffle.nextIndex / raffle.maxSize) * 100);

  // Draw animation state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawComplete, setDrawComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Derive the effective status: override with drawing/completed when animating
  const status: RaffleStatus = isDrawing
    ? "drawing"
    : drawComplete
      ? "completed"
      : baseStatus;

  const handleStartDraw = () => {
    setIsDrawing(true);
    setDrawComplete(false);
    setShowConfetti(false);
  };

  const handleAnimationComplete = useCallback(() => {
    setIsDrawing(false);
    setDrawComplete(true);
    setShowConfetti(true);
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* Confetti overlay */}
      <Confetti active={showConfetti} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <ModeIcon mode={raffle.mode} />
          <h1 className="font-heading text-3xl font-bold text-cream">
            {raffle.title}
          </h1>
          <StatusBadge status={status} />
        </div>
        <p className="text-gray-300 text-sm">
          Raffle #{id} &middot; {raffle.mode === "duckrace" ? "Duck Race" : "Roulette"} &middot; {raffle.visibility}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
      >
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Prize Pool</p>
          <p className="font-heading text-xl font-bold text-mint">
            {formatAvax(raffle.prizePool)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Ticket Price</p>
          <p className="font-heading text-xl font-bold text-cream">
            {formatAvax(raffle.ticketPrice)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Participants</p>
          <p className="font-heading text-xl font-bold text-cream">
            {raffle.nextIndex}/{raffle.maxSize}
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-mint transition-all duration-500"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Tree Levels</p>
          <p className="font-heading text-xl font-bold text-cream">
            {raffle.levels}
          </p>
        </Card>
      </motion.div>

      {/* Drawing animation */}
      {status === "drawing" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-6">
            <p className="text-center text-sm text-gray-500 mb-4">Drawing winner...</p>
            {raffle.mode === "roulette" ? (
              <RouletteWheel
                participants={MOCK_ALIASES}
                winnerIndex={MOCK_WINNER_INDEX}
                spinning={isDrawing}
                onSpinComplete={handleAnimationComplete}
              />
            ) : (
              <DuckRaceTrack
                participants={MOCK_ALIASES}
                winnerIndex={MOCK_WINNER_INDEX}
                racing={isDrawing}
                onRaceComplete={handleAnimationComplete}
              />
            )}
          </Card>
        </motion.div>
      )}

      {/* Countdown & CTA */}
      {status === "open" && raffle.endsAt > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-6">
            <p className="text-sm text-gray-500 mb-4 text-center">Ends in</p>
            <Countdown
              targetDate={raffle.endsAt * 1000}
              className="justify-center mb-6"
            />
            {/* Test mode toggle */}
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => setTestMode("roulette")}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-full border transition-colors cursor-pointer",
                  testMode === "roulette"
                    ? "bg-mint/15 border-mint/40 text-mint"
                    : "border-gray-700 text-gray-300 hover:border-gray-500"
                )}
              >
                Roulette
              </button>
              <button
                onClick={() => setTestMode("duckrace")}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-full border transition-colors cursor-pointer",
                  testMode === "duckrace"
                    ? "bg-mint/15 border-mint/40 text-mint"
                    : "border-gray-700 text-gray-300 hover:border-gray-500"
                )}
              >
                Duck Race
              </button>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href={`/raffle/${id}/join`}>
                <Button variant="primary" size="lg" className="glow-pulse">
                  Join Raffle &mdash; {formatAvax(raffle.ticketPrice)}
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleStartDraw}
                disabled={isDrawing}
              >
                Start Draw (Test)
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Winner state */}
      {status === "completed" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-8 text-center border-mint/30">
            <p className="text-sm text-gray-500 mb-2">Winner</p>
            <p className="font-display text-3xl text-mint mb-4">
              {MOCK_ALIASES[drawComplete ? MOCK_WINNER_INDEX : raffle.winnerIndex] ?? `Participant #${raffle.winnerIndex}`}
            </p>
            <p className="text-gray-300 mb-6">
              Prize: <span className="text-cream font-semibold">{formatAvax(raffle.prizePool)}</span>
            </p>
            <Link href={`/raffle/${id}/claim`}>
              <Button variant="primary" size="lg" className="glow-pulse">
                Claim Prize
              </Button>
            </Link>
          </Card>
        </motion.div>
      )}

      {/* Participants */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-heading text-xl font-bold text-cream mb-4">
          Participants ({MOCK_ALIASES.length})
        </h2>
        <ParticipantList aliases={MOCK_ALIASES} />
      </motion.div>
    </div>
  );
}
