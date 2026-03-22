"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Countdown } from "@/components/ui/Countdown";
import { RaffleStatus } from "./RaffleStatus";
import { ParticipantCount } from "./ParticipantCount";
import { PrizePool } from "./PrizePool";
import { formatAvax, cn } from "@/lib/utils";
import type { Raffle, RaffleStatus as Status } from "@/lib/types";

interface RaffleCardProps {
  raffle: Raffle;
  className?: string;
}

function getStatus(r: Raffle): Status {
  if (r.open) return "open";
  if (r.winnerSet) return "completed";
  return "drawing";
}

function ModeIcon({ mode }: { mode: string }) {
  if (mode === "duckrace") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-mint">
        <ellipse cx="12" cy="15" rx="8" ry="5" opacity="0.2" />
        <circle cx="9" cy="10" r="4" />
        <circle cx="7.5" cy="9" r="1" fill="var(--bg-primary)" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-mint">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <line x1="12" y1="3" x2="12" y2="6" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="21" strokeLinecap="round" />
    </svg>
  );
}

export function RaffleCard({ raffle, className }: RaffleCardProps) {
  const status = getStatus(raffle);
  const isOpen = status === "open";

  return (
    <Link href={`/raffle/${raffle.id.toString()}`}>
      <Card hover className={cn("p-5 flex flex-col gap-4 h-full", className)}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ModeIcon mode={raffle.mode} />
            <h3 className="font-heading text-lg font-semibold text-cream leading-tight">
              {raffle.title}
            </h3>
          </div>
          <RaffleStatus status={status} />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <PrizePool amount={raffle.prizePool} />
          <p className="text-sm text-gray-500">
            {formatAvax(raffle.ticketPrice)} / ticket
          </p>
        </div>

        {/* Participants */}
        <ParticipantCount current={raffle.nextIndex} max={raffle.maxSize} />

        {/* Countdown or status */}
        {isOpen && raffle.endsAt > 0 ? (
          <div className="pt-2 border-t border-gray-800">
            <p className="text-xs text-gray-500 mb-2">Ends in</p>
            <Countdown targetDate={raffle.endsAt * 1000} className="scale-75 origin-left" />
          </div>
        ) : (
          <div className="pt-2 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              {status === "completed" ? "Winner selected" : status === "drawing" ? "Drawing in progress..." : "Raffle ended"}
            </p>
          </div>
        )}
      </Card>
    </Link>
  );
}
