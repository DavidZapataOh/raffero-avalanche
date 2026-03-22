"use client";

// ─────────────────────────────────────────────────────────────────────────────
// useProofGeneration — async ZK proof generation with progress tracking
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from "react";
import { generateProof as generate } from "@/lib/noir";
import type { ProofInputs, ProofResult } from "@/lib/types";

interface UseProofGenerationResult {
  /** Trigger proof generation for the given circuit inputs. */
  generateProof: (inputs: ProofInputs) => Promise<ProofResult>;
  /** Whether proof generation is currently in progress. */
  loading: boolean;
  /** Human-readable error message if the last attempt failed. */
  error: string | null;
  /** Progress indicator 0–100 (mock for now). */
  progress: number;
}

/**
 * Hook that wraps the Noir prover in a React-friendly interface with loading /
 * error / progress state.
 *
 * Progress is simulated with a timer until the real prover provides granular
 * feedback — TODO: hook into actual prover progress events once available.
 */
export function useProofGeneration(): UseProofGenerationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearProgressTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startProgressTimer = useCallback(() => {
    setProgress(0);
    // Simulate progress: increment towards 90% over ~15 seconds, then stall
    // until the real proof arrives.
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 8;
      });
    }, 500);
  }, []);

  const generateProof = useCallback(
    async (inputs: ProofInputs): Promise<ProofResult> => {
      setLoading(true);
      setError(null);
      startProgressTimer();

      try {
        const result = await generate(inputs);
        setProgress(100);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Proof generation failed.";
        setError(message);
        throw err;
      } finally {
        clearProgressTimer();
        setLoading(false);
      }
    },
    [startProgressTimer, clearProgressTimer],
  );

  return { generateProof, loading, error, progress };
}
