// ─────────────────────────────────────────────────────────────────────────────
// Client-side Poseidon2 hash — calls the on-chain Poseidon2 contract.
// Guarantees 100% compatibility with the circuits and contracts.
// ─────────────────────────────────────────────────────────────────────────────

import { publicClient } from "./viem";
import { POSEIDON_CONTRACT } from "./constants";

const POSEIDON_ABI = [
  {
    type: "function",
    name: "hash_2",
    inputs: [{ name: "x", type: "uint256" }, { name: "y", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "hash_3",
    inputs: [{ name: "x", type: "uint256" }, { name: "y", type: "uint256" }, { name: "z", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "pure",
  },
] as const;

/**
 * Poseidon2 hash of two field elements.
 * Calls the on-chain Poseidon2 contract via RPC (view call, no gas).
 */
export async function poseidon2(a: bigint, b: bigint): Promise<bigint> {
  const result = await publicClient.readContract({
    address: POSEIDON_CONTRACT,
    abi: POSEIDON_ABI,
    functionName: "hash_2",
    args: [a, b],
  });
  return result;
}

/**
 * Poseidon2 hash of three field elements.
 * Calls the on-chain Poseidon2 contract via RPC (view call, no gas).
 */
export async function poseidon3(a: bigint, b: bigint, c: bigint): Promise<bigint> {
  const result = await publicClient.readContract({
    address: POSEIDON_CONTRACT,
    abi: POSEIDON_ABI,
    functionName: "hash_3",
    args: [a, b, c],
  });
  return result;
}
