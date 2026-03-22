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

/**
 * Read raffle data from the PrivateRaffle contract.
 *
 * @param raffleId - On-chain raffle ID (bigint).
 */
export function useRaffle(raffleId: bigint | undefined): UseRaffleResult {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRaffle = useCallback(async () => {
    if (raffleId === undefined) return;

    setLoading(true);
    setError(null);

    try {
      const data = await publicClient.readContract({
        address: RAFFLE_CONTRACT,
        abi: RAFFLE_ABI,
        functionName: "raffles",
        args: [raffleId],
      });

      // Contract returns tuple: (levels, ticketPrice, maxSize, nextIndex, root, open, winnerSet, winnerIndex, prizePool)
      const [levels, ticketPrice, maxSize, nextIndex, root, open, winnerSet, winnerIndex, prizePool] = data;

      const r: Raffle = {
        id: raffleId,
        mode: "roulette", // Off-chain metadata — default for now
        visibility: "public",
        title: `Raffle #${raffleId}`,
        ticketPrice,
        levels: Number(levels),
        maxSize: Number(maxSize),
        nextIndex: Number(nextIndex),
        root,
        open,
        winnerSet,
        winnerIndex: Number(winnerIndex),
        prizePool,
        createdAt: 0, // Not in contract struct
        endsAt: 0,
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
      : raffle.winnerSet
      ? "completed"
      : "drawing"
    : null;

  return { raffle, status, loading, error, refetch: fetchRaffle };
}
