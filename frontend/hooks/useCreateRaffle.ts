"use client";

import { useState } from "react";
import { getWalletClient } from "@/lib/viem";
import { RAFFLE_ABI } from "@/lib/contracts";
import { RAFFLE_CONTRACT } from "@/lib/constants";

interface CreateRaffleParams {
  raffleId: bigint;
  ticketPrice: bigint;
  levels: number;
  provider: unknown;
}

interface UseCreateRaffleResult {
  createRaffle: (params: CreateRaffleParams) => Promise<`0x${string}`>;
  loading: boolean;
  error: string | null;
}

/**
 * Create a new raffle on the PrivateRaffle contract.
 */
export function useCreateRaffle(): UseCreateRaffleResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRaffle = async ({
    raffleId,
    ticketPrice,
    levels,
    provider,
  }: CreateRaffleParams): Promise<`0x${string}`> => {
    setLoading(true);
    setError(null);

    try {
      const walletClient = getWalletClient(provider);
      const [account] = await walletClient.getAddresses();

      const hash = await walletClient.writeContract({
        address: RAFFLE_CONTRACT,
        abi: RAFFLE_ABI,
        functionName: "createRaffle",
        args: [raffleId, ticketPrice, BigInt(levels)],
        account,
      });

      return hash;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create raffle";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createRaffle, loading, error };
}
