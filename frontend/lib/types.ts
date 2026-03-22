// ─────────────────────────────────────────────────────────────────────────────
// Raffle enums / union types
// ─────────────────────────────────────────────────────────────────────────────

/** Visual mode of the raffle (cosmetic only). */
export type RaffleMode = "roulette" | "duckrace";

/** Who can see the list of participants. */
export type RaffleVisibility = "public" | "hidden" | "private";

/** Lifecycle status of a raffle. */
export type RaffleStatus = "open" | "drawing" | "completed" | "claimed";

// ─────────────────────────────────────────────────────────────────────────────
// On-chain data models
// ─────────────────────────────────────────────────────────────────────────────

/** Mirrors the PrivateRaffle.Raffle struct returned by the contract. */
export interface Raffle {
  /** Unique on-chain raffle identifier. */
  id: bigint;
  /** UI display mode. */
  mode: RaffleMode;
  /** Participant-list visibility setting. */
  visibility: RaffleVisibility;
  /** Human-readable raffle title (off-chain metadata). */
  title: string;
  /** Ticket price in wei. */
  ticketPrice: bigint;
  /** Merkle tree height (capacity = 2^levels). */
  levels: number;
  /** Maximum number of tickets (2^levels). */
  maxSize: number;
  /** Next available leaf index. */
  nextIndex: number;
  /** Current Merkle root of the commitment tree. */
  root: bigint;
  /** Whether the raffle is still accepting tickets. */
  open: boolean;
  /** Whether the winner index has been set. */
  winnerSet: boolean;
  /** Index of the winning leaf (valid only when winnerSet is true). */
  winnerIndex: number;
  /** Total AVAX accumulated from ticket sales (wei). */
  prizePool: bigint;
  /** Block timestamp when the raffle was created. */
  createdAt: number;
  /** Optional deadline timestamp (0 = no deadline). */
  endsAt: number;
}

/** A single participant entry (off-chain / indexer data). */
export interface Participant {
  /** User-chosen display name or generated alias. */
  alias: string;
  /** Poseidon commitment stored as the Merkle leaf. */
  commitment: bigint;
  /** Leaf index inside the Merkle tree. */
  index: number;
  /** Timestamp when the ticket was deposited. */
  joinedAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client-side ticket data (stored in local storage / encrypted)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Everything the user needs to later generate a ZK proof and claim the prize.
 * Secrets are stored as hex strings so they serialise cleanly to JSON.
 */
export interface UserTicket {
  /** Which raffle this ticket belongs to. */
  raffleId: bigint;
  /** Random field element used to build the commitment (hex). */
  secret: string;
  /** Random field element used to derive the nullifier (hex). */
  nullifier: string;
  /** User alias submitted alongside the ticket. */
  alias: string;
  /** Leaf index assigned on-chain after deposit. */
  leafIndex: number;
  /** Poseidon commitment H(secret, nullifier) stored as hex. */
  commitment: string;
  /** Unix timestamp when the ticket was deposited. */
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// ZK proof types
// ─────────────────────────────────────────────────────────────────────────────

/** Inputs fed into the circuit / prover. */
export interface ProofInputs {
  /** Secret field element (hex). */
  secret: string;
  /** Nullifier field element (hex). */
  nullifier: string;
  /** Merkle sibling hashes from leaf to root (hex strings). */
  siblings: string[];
  /** Path direction bits (0 = left, 1 = right) from leaf to root. */
  pathIndices: number[];
  /** Address that will receive the prize (checksummed). */
  recipient: string;
}

/**
 * Output of the prover, ready to be passed to the on-chain verifier.
 * Matches the ICircomVerifier.verifyProof calldata layout.
 */
export interface ProofResult {
  /** Proof element A — [x, y]. */
  pA: [string, string];
  /** Proof element B — [[x1, y1], [x2, y2]]. */
  pB: [[string, string], [string, string]];
  /** Proof element C — [x, y]. */
  pC: [string, string];
  /** Public signals array (length depends on circuit). */
  pubSignals: string[];
}
