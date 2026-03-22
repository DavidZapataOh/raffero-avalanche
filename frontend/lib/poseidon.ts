// ─────────────────────────────────────────────────────────────────────────────
// Client-side Poseidon2 hash — placeholder implementation
// ─────────────────────────────────────────────────────────────────────────────
//
// TODO: Replace this placeholder with the actual Poseidon2 implementation that
// matches the Noir circuit and on-chain Poseidon2 precompile. The keccak256
// stand-in used here produces different outputs and will NOT generate valid
// proofs — it only exists so the rest of the frontend can compile and run.
// ─────────────────────────────────────────────────────────────────────────────

import { keccak256, encodePacked } from "viem";

/**
 * Poseidon2 hash of two field elements.
 *
 * Placeholder: returns `keccak256(abi.encodePacked(a, b))` truncated to 254
 * bits so it fits inside the BN254 scalar field.
 */
export async function poseidon2(a: bigint, b: bigint): Promise<bigint> {
  const hash = keccak256(
    encodePacked(["uint256", "uint256"], [a, b]),
  );
  // Mask to 254 bits to stay within the BN254 scalar field
  return BigInt(hash) & ((1n << 254n) - 1n);
}

/**
 * Domain-separated Poseidon2: hash(domain, a) then hash(result, b).
 *
 * This mirrors the circuit's two-step domain-tagged hashing scheme:
 *   intermediate = Poseidon2(domain, a)
 *   result       = Poseidon2(intermediate, b)
 */
export async function poseidon2WithDomain(
  domain: bigint,
  a: bigint,
  b: bigint,
): Promise<bigint> {
  const intermediate = await poseidon2(domain, a);
  return poseidon2(intermediate, b);
}
