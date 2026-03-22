// ─────────────────────────────────────────────────────────────────────────────
// Raffle enums / union types
// ─────────────────────────────────────────────────────────────────────────────

/** Visual mode of the raffle (cosmetic only — off-chain metadata). */
export type RaffleMode = "roulette" | "duckrace";

/** Who can see the list of participants (off-chain metadata). */
export type RaffleVisibility = "public" | "hidden" | "private";

/** Lifecycle status of a raffle. */
export type RaffleStatus = "open" | "closed" | "finalized" | "claimed";

// ─────────────────────────────────────────────────────────────────────────────
// On-chain data models
// ─────────────────────────────────────────────────────────────────────────────

/** On-chain raffle state from getRaffleCore + getRaffleExtra. */
export interface OnChainRaffle {
  id: bigint;
  levels: number;
  ticketPrice: bigint;
  maxSize: number;
  nextIndex: number;
  root: string;              // bytes32 hex
  open: boolean;
  winnerSet: boolean;
  winnerIndex: number;
  prizePool: bigint;
  shuffleSecretHash: string; // bytes32 hex
  vrfRandomness: bigint;
  finalRoot: string;         // bytes32 hex
  aliasRoot: string;         // bytes32 hex
  finalized: boolean;
}

/** Off-chain metadata (localStorage, URL params, or future backend). */
export interface RaffleMetadata {
  mode: RaffleMode;
  visibility: RaffleVisibility;
  title: string;
  endsAt: number;
  createdAt: number;
}

/** Full raffle = on-chain + off-chain. */
export interface Raffle extends OnChainRaffle {
  metadata: RaffleMetadata;
}

/** A single participant entry (from TicketDeposited events). */
export interface Participant {
  alias: string;
  commitment: bigint;
  index: number;
  joinedAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client-side ticket data (stored in localStorage)
// ─────────────────────────────────────────────────────────────────────────────

export interface UserTicket {
  raffleId: bigint;
  secret: string;      // hex
  nullifier: string;   // hex
  alias: string;
  leafIndex: number;
  commitment: string;  // hex
  timestamp: number;
}
