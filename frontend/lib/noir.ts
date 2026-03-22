// ─────────────────────────────────────────────────────────────────────────────
// Noir circuit loading & ZK proof generation — real implementation
// Uses @noir-lang/noir_js for witness generation and @aztec/bb.js for proving.
// ─────────────────────────────────────────────────────────────────────────────

import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend } from "@aztec/bb.js";

// Circuit artifact is served from frontend/public/circuits/raffle.json
// Copy from circuits/raffle/target/raffle.json during build.
const CLAIM_CIRCUIT_URL = "/circuits/raffle.json";

export interface ClaimProofInputs {
  secret: string;           // hex
  nullifier: string;        // hex
  siblings: string[];       // hex[32]
  path_indices: string[];   // hex[32] ("0x00...00" or "0x00...01")
  recipient: string;        // hex (address as uint256)
  root: string;             // hex
  nullifier_hash: string;   // hex
  recipient_binding: string;// hex
  raffle_id: string;        // hex
  winner_index: string;     // hex
  tree_depth: string;       // hex
}

export interface ProofResult {
  proof: Uint8Array;
  publicInputs: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedCircuit: any = null;

async function loadClaimCircuit() {
  if (cachedCircuit) return cachedCircuit;
  const res = await fetch(CLAIM_CIRCUIT_URL);
  if (!res.ok) throw new Error(`Failed to load circuit artifact: ${res.statusText}`);
  cachedCircuit = await res.json();
  return cachedCircuit;
}

/**
 * Generate a real ZK claim proof.
 * Uses keccak oracle hash mode for EVM-compatible verification.
 */
export async function generateClaimProof(
  inputs: ClaimProofInputs,
  onProgress?: (pct: number) => void,
): Promise<ProofResult> {
  onProgress?.(5);

  const circuit = await loadClaimCircuit();
  onProgress?.(15);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const noir = new Noir(circuit as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { witness } = await noir.execute(inputs as any);
  onProgress?.(40);

  const backend = new UltraHonkBackend(circuit.bytecode, { threads: 1 });
  onProgress?.(50);

  const proofData = await backend.generateProof(witness, { keccak: true });
  onProgress?.(95);

  await backend.destroy();
  onProgress?.(100);

  return {
    proof: proofData.proof,
    publicInputs: proofData.publicInputs,
  };
}

/**
 * Format proof data for the claimPrize contract call.
 */
export function formatProofForContract(result: ProofResult): {
  proofBytes: `0x${string}`;
  publicInputs: `0x${string}`[];
} {
  const proofHex = Array.from(result.proof)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  return {
    proofBytes: `0x${proofHex}`,
    publicInputs: result.publicInputs.map(pi => pi as `0x${string}`),
  };
}
