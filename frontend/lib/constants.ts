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
 * Zero leaf for the incremental Merkle tree.
 * keccak256("raffero") % BN254_PRIME — must match IncrementalMerkleTree.sol zeros(0).
 * zeros(i) = Poseidon2(zeros(i-1), zeros(i-1))
 */
export const ZERO_VALUE = 0x1d028cb78671d570e29d04748982b4d86bf5d94d10b081fc71ab63f5f319a144n;

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
  "0x55C7b78Cf96866CF36c35da452AF39b6A81c572b" as `0x${string}`;

/** Claim proof HonkVerifier contract */
export const CLAIM_VERIFIER_CONTRACT =
  "0x3445Cd4976fEC2492C8c6E7dCbb3Eae76a83a89D" as `0x${string}`;

/** Shuffle proof HonkVerifier contract */
export const SHUFFLE_VERIFIER_CONTRACT =
  "0xD857635E5D39Ad6C08e350E5Df21F2319c685361" as `0x${string}`;

/** Poseidon2 hash contract (poseidon2-evm) */
export const POSEIDON_CONTRACT =
  "0x1AcF62aDB348080721ae3Ff4dd68D77428Dc2099" as `0x${string}`;

/** Block number where contracts were deployed */
export const DEPLOY_BLOCK = 53055034n;

/** Max block range per RPC getLogs query on Fuji */
export const MAX_BLOCK_RANGE = 2048n;
