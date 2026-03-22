// ─────────────────────────────────────────────────────────────────────────────
// Domain tags — must match Solidity / Noir circuit constants exactly.
// Each value is the big-endian hex encoding of the ASCII string shown in the
// comment.  The circuit and the contract hash with these tags so that
// commitments, nullifiers, etc. are domain-separated.
// ─────────────────────────────────────────────────────────────────────────────

/** "COMMIT_V1" */
export const DOMAIN_COMMIT = 0x434f4d4d49545f5631n;

/** "NULL_V1" */
export const DOMAIN_NULL = 0x4e554c4c5f5631n;

/** "BIND_V1" */
export const DOMAIN_BIND = 0x42494e445f5631n;

/** "ENTRY_V1" */
export const DOMAIN_ENTRY = 0x454e5452595f5631n;

/** "SHUFFLE_V1" */
export const DOMAIN_SHUFFLE = 0x53485546464c455f5631n;

/** "SECRET_V1" */
export const DOMAIN_SECRET = 0x5345435245545f5631n;

// ─────────────────────────────────────────────────────────────────────────────
// Merkle tree
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum depth the on-chain incremental Merkle tree supports. */
export const MAX_TREE_DEPTH = 32;

/**
 * Zero hashes for the incremental Merkle tree.
 * zeroHashes[0] = 0  (empty leaf)
 * zeroHashes[i] = Poseidon(zeroHashes[i-1], 0)
 *
 * These are computed on-chain during `createRaffle` so they always stay in
 * sync with the Poseidon instance the contract uses.  The frontend only needs
 * the root-level constant (the empty leaf value) when building local trees.
 */
export const ZERO_VALUE = 0n;

// ─────────────────────────────────────────────────────────────────────────────
// Avalanche Fuji testnet
// ─────────────────────────────────────────────────────────────────────────────

export const FUJI_CHAIN_ID = 43113;

export const FUJI_RPC_URL =
  "https://api.avax-test.network/ext/bc/C/rpc";

export const FUJI_BLOCK_EXPLORER = "https://testnet.snowtrace.io";

export const FUJI_CHAIN_CONFIG = {
  chainId: FUJI_CHAIN_ID,
  name: "Avalanche Fuji",
  rpcUrl: FUJI_RPC_URL,
  blockExplorer: FUJI_BLOCK_EXPLORER,
  nativeCurrency: {
    name: "AVAX",
    symbol: "AVAX",
    decimals: 18,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Deployed contract addresses (replace after deployment)
// ─────────────────────────────────────────────────────────────────────────────

/** PrivateRaffle main contract */
export const RAFFLE_CONTRACT =
  "0x0000000000000000000000000000000000000000" as `0x${string}`;

/** Groth16 / UltraHonk verifier contract */
export const VERIFIER_CONTRACT =
  "0x0000000000000000000000000000000000000000" as `0x${string}`;

/** Poseidon2 hash precompile / library contract */
export const POSEIDON_CONTRACT =
  "0x0000000000000000000000000000000000000000" as `0x${string}`;
