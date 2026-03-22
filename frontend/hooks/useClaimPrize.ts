"use client";

import { useState, useCallback } from "react";
import { getWalletClient, ensureFujiChain } from "@/lib/viem";
import { RAFFLE_ABI } from "@/lib/contracts";
import { RAFFLE_CONTRACT } from "@/lib/constants";

interface ClaimPrizeParams {
  /** Raw proof bytes (hex). */
  proofBytes: `0x${string}`;
  /** Public inputs array (hex bytes32[]). */
  publicInputs: `0x${string}`[];
  /** Address that will receive the prize payout. */
  recipient: `0x${string}`;
  /** EIP-1193 provider (e.g. from Privy wallet). */
  provider: unknown;
}

interface UseClaimPrizeResult {
  claimPrize: (params: ClaimPrizeParams) => Promise<`0x${string}`>;
  loading: boolean;
  error: string | null;
}

export function useClaimPrize(): UseClaimPrizeResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claimPrize = useCallback(
    async (params: ClaimPrizeParams): Promise<`0x${string}`> => {
      const { proofBytes, publicInputs, recipient, provider } = params;

      setLoading(true);
      setError(null);

      try {
        await ensureFujiChain(provider);
        const walletClient = getWalletClient(provider);
        const [account] = await walletClient.getAddresses();

        const hash = await walletClient.writeContract({
          address: RAFFLE_CONTRACT,
          abi: RAFFLE_ABI,
          functionName: "claimPrize",
          args: [proofBytes, publicInputs, recipient],
          account,
          chain: walletClient.chain,
        });

        return hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to claim prize.";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { claimPrize, loading, error };
}
