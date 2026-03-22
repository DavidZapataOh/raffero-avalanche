"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn, formatAvax } from "@/lib/utils";
import { publicClient, getPaginatedLogs } from "@/lib/viem";
import { RAFFLE_ABI } from "@/lib/contracts";
import { RAFFLE_CONTRACT } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getAllRaffleMetadata } from "@/lib/supabase";
import type { RaffleStatus } from "@/lib/types";

type StatusFilter = "all" | RaffleStatus;

interface RaffleSummary {
  id: bigint;
  ticketPrice: bigint;
  levels: number;
  maxSize: number;
  nextIndex: number;
  open: boolean;
  winnerSet: boolean;
  finalized: boolean;
  prizePool: bigint;
  title: string;
  status: RaffleStatus;
}

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "finalized", label: "Finalized" },
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [raffles, setRaffles] = useState<RaffleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRaffles() {
      try {
        // Load metadata from Supabase
        const allMeta = await getAllRaffleMetadata();
        const metaMap = new Map(allMeta.map((m) => [m.raffle_id, m]));

        // Read RaffleCreated events to discover all raffles
        const logs = await getPaginatedLogs({
          address: RAFFLE_CONTRACT,
          event: {
            type: "event",
            name: "RaffleCreated",
            inputs: [
              { name: "raffleId", type: "uint256", indexed: true },
              { name: "ticketPrice", type: "uint256", indexed: false },
              { name: "levels", type: "uint256", indexed: false },
              { name: "maxSize", type: "uint256", indexed: false },
            ],
          },
        });

        // For each raffle, fetch current state
        const results: RaffleSummary[] = [];
        for (const log of logs) {
          const raffleId = log.args.raffleId!;
          try {
            const core = await publicClient.readContract({
              address: RAFFLE_CONTRACT,
              abi: RAFFLE_ABI,
              functionName: "getRaffleCore",
              args: [raffleId],
            });
            const extra = await publicClient.readContract({
              address: RAFFLE_CONTRACT,
              abi: RAFFLE_ABI,
              functionName: "getRaffleExtra",
              args: [raffleId],
            });

            const [levels, ticketPrice, maxSize, nextIndex, , open, winnerSet, , prizePool] = core;
            const [, , , , finalized] = extra;

            const meta = metaMap.get(raffleId.toString());
            let title = meta?.title || `Raffle #${raffleId}`;

            const status: RaffleStatus = open ? "open" : finalized ? "finalized" : "closed";

            results.push({
              id: raffleId,
              ticketPrice,
              levels: Number(levels),
              maxSize: Number(maxSize),
              nextIndex: Number(nextIndex),
              open,
              winnerSet,
              finalized,
              prizePool,
              title,
              status,
            });
          } catch { /* skip unreadable raffles */ }
        }

        setRaffles(results);
      } catch (err) {
        console.error("Failed to fetch raffles:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRaffles();
  }, []);

  const filtered = raffles.filter(
    (r) => statusFilter === "all" || r.status === statusFilter
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
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

      {/* Raffles grid */}
      {loading ? (
        <p className="text-gray-500 text-center py-20">Loading raffles...</p>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p className="text-gray-500 text-lg">
            {raffles.length === 0
              ? "No raffles created yet. Be the first!"
              : "No raffles match your filters."}
          </p>
          {raffles.length === 0 && (
            <Link
              href="/raffle/create"
              className="inline-block mt-4 text-mint hover:text-mint/80 font-medium"
            >
              Create a Raffle &rarr;
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((r, i) => (
            <motion.div
              key={r.id.toString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/raffle/${r.id}`}>
                <Card className="p-5 hover:border-mint/30 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading text-lg font-bold text-cream truncate">
                      {r.title}
                    </h3>
                    <Badge variant={r.open ? "success" : r.finalized ? "neutral" : "warning"}>
                      {r.open ? "Open" : r.finalized ? "Finalized" : "Closed"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-500">Prize Pool</span>
                    <span className="text-mint font-semibold">{formatAvax(r.prizePool)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-500">Ticket</span>
                    <span className="text-cream">{formatAvax(r.ticketPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Participants</span>
                    <span className="text-cream">{r.nextIndex}/{r.maxSize}</span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-mint transition-all"
                      style={{ width: `${Math.round((r.nextIndex / r.maxSize) * 100)}%` }}
                    />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
