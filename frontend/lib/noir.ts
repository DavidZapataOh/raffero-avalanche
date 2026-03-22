// ─────────────────────────────────────────────────────────────────────────────
// Noir circuit loading & ZK proof generation — real implementation
// Uses @noir-lang/noir_js for witness generation and @aztec/bb.js for proving.
// Lazy-imported to avoid SSR issues with WASM.
// ─────────────────────────────────────────────────────────────────────────────

const CLAIM_CIRCUIT_URL = "/circuits/raffle.json";

export interface ClaimProofInputs {
  secret: string;
  nullifier: string;
  siblings: string[];
  path_indices: string[];
  recipient: string;
  root: string;
  nullifier_hash: string;
  recipient_binding: string;
  raffle_id: string;
  winner_index: string;
  tree_depth: string;
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
 * Generate a real ZK claim proof in the browser.
 * Uses keccak oracle hash mode for EVM-compatible verification.
 * Noir.js and bb.js are lazy-imported to avoid SSR/Node.js issues.
 */
export async function generateClaimProof(
  inputs: ClaimProofInputs,
  onProgress?: (pct: number) => void,
): Promise<ProofResult> {
  onProgress?.(5);

  // Lazy import to avoid SSR issues — these only run in the browser
  const { Noir } = await import("@noir-lang/noir_js");
  const { UltraHonkBackend } = await import("@aztec/bb.js");

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
