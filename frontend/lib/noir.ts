// ─────────────────────────────────────────────────────────────────────────────
// Noir circuit loading & ZK proof generation
// ─────────────────────────────────────────────────────────────────────────────
//
// This module wraps @noir-lang/noir_js and @noir-lang/backend_barretenberg to
// load the compiled circuit artifact, generate a witness, and produce a proof
// that can be verified on-chain.
//
// TODO: Replace the mock implementation with actual circuit integration once
// the Noir toolchain packages are installed and the circuit artifact path is
// finalised.
// ─────────────────────────────────────────────────────────────────────────────

import type { ProofInputs, ProofResult } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Circuit loading
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load the compiled Noir circuit artifact.
 *
 * TODO: Update the import path to point at the actual compiled circuit JSON
 * (e.g. `../../circuits/target/raffle.json`).
 */
export async function loadCircuit(): Promise<unknown> {
  try {
    // Dynamic import so the module is only fetched when needed and tree-shaken
    // in production builds that don't use proof generation.
    //
    // TODO: Replace with actual circuit artifact path:
    // const circuit = await import("../../circuits/target/raffle.json");
    // return circuit.default ?? circuit;

    console.warn(
      "[noir] Circuit artifact not available — returning mock circuit object.",
    );
    return { mock: true };
  } catch (err) {
    console.error("[noir] Failed to load circuit:", err);
    throw new Error("Could not load the Noir circuit artifact.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Proof generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a ZK proof for the given inputs.
 *
 * The real implementation will:
 *   1. Instantiate `Noir` from `@noir-lang/noir_js` with the circuit.
 *   2. Instantiate `BarretenbergBackend` from `@noir-lang/backend_barretenberg`.
 *   3. Call `noir.execute(inputs)` to produce the witness.
 *   4. Call `backend.generateProof(witness)` to produce the proof.
 *   5. Format the proof into the on-chain calldata layout (`ProofResult`).
 *
 * For now this returns a mock `ProofResult` so the UI can render the full
 * claim flow without a working prover.
 */
export async function generateProof(inputs: ProofInputs): Promise<ProofResult> {
  try {
    // ── Real implementation (uncomment when packages are installed) ──────
    //
    // const { Noir } = await import("@noir-lang/noir_js");
    // const { BarretenbergBackend } = await import("@noir-lang/backend_barretenberg");
    //
    // const circuit = await loadCircuit();
    // const backend = new BarretenbergBackend(circuit as any);
    // const noir = new Noir(circuit as any);
    //
    // const witness = await noir.execute({
    //   secret: inputs.secret,
    //   nullifier: inputs.nullifier,
    //   siblings: inputs.siblings,
    //   path_indices: inputs.pathIndices.map(String),
    //   recipient: inputs.recipient,
    // });
    //
    // const proof = await backend.generateProof(witness);
    // return formatProof(proof);

    console.warn(
      "[noir] Proof generation is mocked — returning placeholder proof.",
    );

    // Simulate computation time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockField = "0x" + "00".repeat(31) + "01";

    return {
      pA: [mockField, mockField],
      pB: [
        [mockField, mockField],
        [mockField, mockField],
      ],
      pC: [mockField, mockField],
      pubSignals: new Array(24).fill(mockField),
    } satisfies ProofResult;
  } catch (err) {
    console.error("[noir] Proof generation failed:", err);
    throw new Error(
      err instanceof Error ? err.message : "ZK proof generation failed.",
    );
  }
}
