"use client";

import { useState } from "react";
import { getWalletClient } from "@/lib/viem";
import { RAFFLE_ABI } from "@/lib/contracts";
import { RAFFLE_CONTRACT } from "@/lib/constants";

interface DepositTicketParams {
  raffleId: bigint;
  commitment: bigint;
  ticketPrice: bigint;
  provider: unknown;
}

interface UseDepositTicketResult {
  depositTicket: (params: DepositTicketParams) => Promise<`0x${string}`>;
  loading: boolean;
  error: string | null;
}

/**
 * Buy a raffle ticket by depositing a commitment to the Merkle tree.
 */
export function useDepositTicket(): UseDepositTicketResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const depositTicket = async ({
    raffleId,
    commitment,
    ticketPrice,
    provider,
  }: DepositTicketParams): Promise<`0x${string}`> => {
    setLoading(true);
    setError(null);

    try {
      const walletClient = getWalletClient(provider);
      const [account] = await walletClient.getAddresses();

      const hash = await walletClient.writeContract({
        address: RAFFLE_CONTRACT,
        abi: RAFFLE_ABI,
        functionName: "depositTicket",
        args: [raffleId, commitment],
        value: ticketPrice,
        account,
      });

      return hash;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to deposit ticket";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { depositTicket, loading, error };
}
