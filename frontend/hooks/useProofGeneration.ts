"use client";

import { useState, useCallback } from "react";
import { generateClaimProof, type ClaimProofInputs, type ProofResult } from "@/lib/noir";

interface UseProofGenerationResult {
  generateProof: (inputs: ClaimProofInputs) => Promise<ProofResult>;
  loading: boolean;
  error: string | null;
  progress: number;
}

export function useProofGeneration(): UseProofGenerationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const generateProof = useCallback(
    async (inputs: ClaimProofInputs): Promise<ProofResult> => {
      setLoading(true);
      setError(null);
      setProgress(0);

      try {
        const result = await generateClaimProof(inputs, (pct) => {
          setProgress(Math.round(pct));
        });
        setProgress(100);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Proof generation failed.";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { generateProof, loading, error, progress };
}
