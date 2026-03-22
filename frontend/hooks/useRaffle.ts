"use client";

import { useState, useEffect, useCallback } from "react";
import { publicClient } from "@/lib/viem";
import { RAFFLE_ABI } from "@/lib/contracts";
import { RAFFLE_CONTRACT } from "@/lib/constants";
import type { Raffle, RaffleStatus } from "@/lib/types";

interface UseRaffleResult {
  raffle: Raffle | null;
  status: RaffleStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRaffle(raffleId: bigint | undefined): UseRaffleResult {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRaffle = useCallback(async () => {
    if (raffleId === undefined) return;

    setLoading(true);
    setError(null);

    try {
      // Read core data
      const core = await publicClient.readContract({
        address: RAFFLE_CONTRACT,
        abi: RAFFLE_ABI,
        functionName: "getRaffleCore",
        args: [raffleId],
      });

      // Read extra data
      const extra = await publicClient.readContract({
        address: RAFFLE_CONTRACT,
        abi: RAFFLE_ABI,
        functionName: "getRaffleExtra",
        args: [raffleId],
      });

      const [levels, ticketPrice, maxSize, nextIndex, root, open, winnerSet, winnerIndex, prizePool] = core;
      const [shuffleSecretHash, vrfRandomness, finalRoot, aliasRoot, finalized] = extra;

      const r: Raffle = {
        id: raffleId,
        levels: Number(levels),
        ticketPrice,
        maxSize: Number(maxSize),
        nextIndex: Number(nextIndex),
        root: root as string,
        open,
        winnerSet,
        winnerIndex: Number(winnerIndex),
        prizePool,
        shuffleSecretHash: shuffleSecretHash as string,
        vrfRandomness,
        finalRoot: finalRoot as string,
        aliasRoot: aliasRoot as string,
        finalized,
        metadata: {
          mode: "roulette",
          visibility: "public",
          title: `Raffle #${raffleId}`,
          endsAt: 0,
          createdAt: 0,
        },
      };

      setRaffle(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch raffle");
    } finally {
      setLoading(false);
    }
  }, [raffleId]);

  useEffect(() => {
    fetchRaffle();
  }, [fetchRaffle]);

  const status: RaffleStatus | null = raffle
    ? raffle.open
      ? "open"
      : raffle.finalized
        ? "finalized"
        : "closed"
    : null;

  return { raffle, status, loading, error, refetch: fetchRaffle };
}
