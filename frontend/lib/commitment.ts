// ─────────────────────────────────────────────────────────────────────────────
// Commitment & nullifier generation
// ─────────────────────────────────────────────────────────────────────────────
//
// All functions in this module mirror the hashing logic inside the Noir circuit
// and the on-chain Solidity contract so that commitments, nullifier hashes, and
// entry hashes produced client-side are accepted by the verifier.
// ─────────────────────────────────────────────────────────────────────────────

import { poseidon2WithDomain } from "./poseidon";
import {
  DOMAIN_COMMIT,
  DOMAIN_NULL,
  DOMAIN_ENTRY,
} from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encode a UTF-8 string as a big-endian `bigint` field element.
 *
 * The string is converted to its raw byte representation and then interpreted
 * as an unsigned big-endian integer.  Strings longer than 31 bytes will
 * overflow the BN254 field — callers should enforce a length limit.
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

// ─────────────────────────────────────────────────────────────────────────────
// Commitment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate the Poseidon commitment stored as a Merkle leaf.
 *
 *   commitment = Poseidon2(DOMAIN_COMMIT, secret, nullifier)
 *
 * @param secret     Hex-encoded random field element (e.g. from `generateRandomField`).
 * @param nullifier  Hex-encoded random field element.
 */
export async function generateCommitment(
  secret: string,
  nullifier: string,
): Promise<bigint> {
  return poseidon2WithDomain(DOMAIN_COMMIT, BigInt(secret), BigInt(nullifier));
}

// ─────────────────────────────────────────────────────────────────────────────
// Nullifier hash
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive the nullifier hash that is revealed on-chain when claiming the prize.
 *
 *   nullifierHash = Poseidon2(DOMAIN_NULL, nullifier, raffleId)
 *
 * @param nullifier Hex-encoded nullifier preimage.
 * @param raffleId  On-chain raffle identifier.
 */
export async function generateNullifierHash(
  nullifier: string,
  raffleId: bigint,
): Promise<bigint> {
  return poseidon2WithDomain(DOMAIN_NULL, BigInt(nullifier), raffleId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry hash
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the entry hash that binds a commitment to a user alias.
 *
 *   entryHash = Poseidon2(DOMAIN_ENTRY, commitment, aliasAsField)
 *
 * @param commitment Poseidon commitment (the Merkle leaf).
 * @param alias      User-chosen display name.
 */
export async function generateEntryHash(
  commitment: bigint,
  alias: string,
): Promise<bigint> {
  return poseidon2WithDomain(DOMAIN_ENTRY, commitment, aliasToField(alias));
}
