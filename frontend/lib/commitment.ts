// ─────────────────────────────────────────────────────────────────────────────
// Commitment & nullifier generation
// ─────────────────────────────────────────────────────────────────────────────
//
// All functions mirror the hashing logic inside the Noir circuit and the
// on-chain Solidity contract. Uses real Poseidon2 via @aztec/bb.js.
// ─────────────────────────────────────────────────────────────────────────────

import { poseidon3 } from "./poseidon";
import {
  DOMAIN_COMMIT,
  DOMAIN_NULL,
  DOMAIN_BIND,
  DOMAIN_ENTRY,
} from "./constants";

/**
 * Encode a UTF-8 string as a big-endian `bigint` field element.
 * Strings longer than 31 bytes will overflow BN254 — callers should limit.
 */
export function aliasToField(alias: string): bigint {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(alias);
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  return value;
}

/**
 * commitment = Poseidon2(DOMAIN_COMMIT, secret, nullifier)
 */
export async function generateCommitment(
  secret: string,
  nullifier: string,
): Promise<bigint> {
  return poseidon3(DOMAIN_COMMIT, BigInt(secret), BigInt(nullifier));
}

/**
 * nullifierHash = Poseidon2(DOMAIN_NULL, nullifier, raffleId)
 */
export async function generateNullifierHash(
  nullifier: string,
  raffleId: bigint,
): Promise<bigint> {
  return poseidon3(DOMAIN_NULL, BigInt(nullifier), raffleId);
}

/**
 * recipientBinding = Poseidon2(DOMAIN_BIND, nullifierHash, recipient)
 */
export async function generateRecipientBinding(
  nullifierHash: bigint,
  recipient: string,
): Promise<bigint> {
  return poseidon3(DOMAIN_BIND, nullifierHash, BigInt(recipient));
}

/**
 * entryHash = Poseidon2(DOMAIN_ENTRY, commitment, leafIndex)
 * This is what the contract inserts into the Merkle tree.
 */
export async function generateEntryHash(
  commitment: bigint,
  leafIndex: bigint,
): Promise<bigint> {
  return poseidon3(DOMAIN_ENTRY, commitment, leafIndex);
}
