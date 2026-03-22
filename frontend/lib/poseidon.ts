// ─────────────────────────────────────────────────────────────────────────────
// Client-side Poseidon2 hash — real implementation using @aztec/bb.js
// Matches the on-chain Poseidon2 (poseidon2-evm) and Noir circuit exactly.
// ─────────────────────────────────────────────────────────────────────────────

import { BarretenbergSync, Fr } from "@aztec/bb.js";

let api: BarretenbergSync | null = null;

async function getApi(): Promise<BarretenbergSync> {
  if (!api) {
    api = await BarretenbergSync.initSingleton();
  }
  return api;
}

/**
 * Poseidon2 hash of two field elements.
 * Matches: Poseidon2::hash([a, b], 2) in Noir, HASHER.hash_2(a, b) on-chain.
 */
export async function poseidon2(a: bigint, b: bigint): Promise<bigint> {
  const bb = await getApi();
  const result = bb.poseidon2Hash([new Fr(a), new Fr(b)]);
  return BigInt(result.toString());
}

/**
 * Poseidon2 hash of three field elements.
 * Matches: Poseidon2::hash([a, b, c], 3) in Noir, HASHER.hash_3(a, b, c) on-chain.
 */
export async function poseidon3(a: bigint, b: bigint, c: bigint): Promise<bigint> {
  const bb = await getApi();
  const result = bb.poseidon2Hash([new Fr(a), new Fr(b), new Fr(c)]);
  return BigInt(result.toString());
}
