"use client";

// ─────────────────────────────────────────────────────────────────────────────
// useClaimPrize — submit a ZK proof on-chain to claim the raffle prize
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { getWalletClient } from "@/lib/viem";
import { RAFFLE_ABI } from "@/lib/contracts";
import { RAFFLE_CONTRACT } from "@/lib/constants";
import type { ProofResult } from "@/lib/types";

interface ClaimPrizeParams {
  /** ZK proof + public signals produced by the prover. */
  proofResult: ProofResult;
  /** Address that will receive the prize payout. */
  recipient: string;
  /** EIP-1193 provider (e.g. from Privy wallet). */
  provider: unknown;
}

interface UseClaimPrizeResult {
  /** Submit the claim transaction. Returns the transaction hash. */
  claimPrize: (params: ClaimPrizeParams) => Promise<`0x${string}`>;
  /** Whether a claim transaction is in flight. */
  loading: boolean;
  /** Human-readable error from the last failed attempt. */
  error: string | null;
}

/**
 * Hook that calls `PrivateRaffle.claimPrize` with the ZK proof calldata.
 */
export function useClaimPrize(): UseClaimPrizeResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claimPrize = useCallback(
    async (params: ClaimPrizeParams): Promise<`0x${string}`> => {
      const { proofResult, recipient, provider } = params;

      setLoading(true);
      setError(null);

      try {
        const walletClient = getWalletClient(provider);
        const [account] = await walletClient.getAddresses();

        const hash = await walletClient.writeContract({
          address: RAFFLE_CONTRACT,
          abi: RAFFLE_ABI,
          functionName: "claimPrize",
          args: [
            proofResult.pA.map(BigInt) as [bigint, bigint],
            proofResult.pB.map((pair) => pair.map(BigInt)) as [
              [bigint, bigint],
              [bigint, bigint],
            ],
            proofResult.pC.map(BigInt) as [bigint, bigint],
            proofResult.pubSignals.map(BigInt) as unknown as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
            recipient as `0x${string}`,
          ],
          account,
          chain: walletClient.chain,
        });

        return hash;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to claim prize.";
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
