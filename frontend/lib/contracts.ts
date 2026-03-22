import { RAFFLE_CONTRACT } from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// PrivateRaffle ABI — matches current src/Raffle.sol (inherits IncrementalMerkleTree)
// ─────────────────────────────────────────────────────────────────────────────

export const RAFFLE_ABI = [
  // ── Admin ──────────────────────────────────────────────────────────────
  {
    type: "function",
    name: "createRaffle",
    inputs: [
      { name: "raffleId", type: "uint256" },
      { name: "ticketPrice", type: "uint256" },
      { name: "levels", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "closeRaffle",
    inputs: [
      { name: "raffleId", type: "uint256" },
      { name: "randomness", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "commitShuffleSecret",
    inputs: [
      { name: "raffleId", type: "uint256" },
      { name: "secretHash", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "finalizeRaffle",
    inputs: [
      { name: "raffleId", type: "uint256" },
      { name: "shuffleProof", type: "bytes" },
      { name: "shufflePublicInputs", type: "bytes32[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "closeAndFinalizeSimple",
    inputs: [
      { name: "raffleId", type: "uint256" },
      { name: "randomness", type: "uint256" },
      { name: "commitmentRoot", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ── User actions ───────────────────────────────────────────────────────
  {
    type: "function",
    name: "depositTicket",
    inputs: [
      { name: "raffleId", type: "uint256" },
      { name: "commitment", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "claimPrize",
    inputs: [
      { name: "claimProof", type: "bytes" },
      { name: "claimPublicInputs", type: "bytes32[]" },
      { name: "recipient", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ── Views ──────────────────────────────────────────────────────────────
  {
    type: "function",
    name: "getRoot",
    inputs: [{ name: "raffleId", type: "uint256" }],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRaffleCore",
    inputs: [{ name: "raffleId", type: "uint256" }],
    outputs: [
      { name: "levels", type: "uint256" },
      { name: "ticketPrice", type: "uint256" },
      { name: "maxSize", type: "uint256" },
      { name: "nextIndex", type: "uint256" },
      { name: "root", type: "bytes32" },
      { name: "open", type: "bool" },
      { name: "winnerSet", type: "bool" },
      { name: "winnerIndex", type: "uint256" },
      { name: "prizePool", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRaffleExtra",
    inputs: [{ name: "raffleId", type: "uint256" }],
    outputs: [
      { name: "shuffleSecretHash", type: "bytes32" },
      { name: "vrfRandomness", type: "uint256" },
      { name: "finalRoot", type: "bytes32" },
      { name: "aliasRoot", type: "bytes32" },
      { name: "finalized", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "commitments",
    inputs: [
      { name: "raffleId", type: "uint256" },
      { name: "index", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nullifiers",
    inputs: [
      { name: "raffleId", type: "uint256" },
      { name: "nullifierHash", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },

  // ── Events ─────────────────────────────────────────────────────────────
  {
    type: "event",
    name: "RaffleCreated",
    inputs: [
      { name: "raffleId", type: "uint256", indexed: true },
      { name: "ticketPrice", type: "uint256", indexed: false },
      { name: "levels", type: "uint256", indexed: false },
      { name: "maxSize", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TicketDeposited",
    inputs: [
      { name: "raffleId", type: "uint256", indexed: true },
      { name: "index", type: "uint256", indexed: false },
      { name: "commitment", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RaffleClosed",
    inputs: [
      { name: "raffleId", type: "uint256", indexed: true },
      { name: "winnerIndex", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PrizeClaimed",
    inputs: [
      { name: "raffleId", type: "uint256", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "nullifierHash", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ShuffleSecretCommitted",
    inputs: [
      { name: "raffleId", type: "uint256", indexed: true },
      { name: "secretHash", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RaffleFinalized",
    inputs: [
      { name: "raffleId", type: "uint256", indexed: true },
      { name: "finalRoot", type: "bytes32", indexed: false },
      { name: "aliasRoot", type: "bytes32", indexed: false },
    ],
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: contract config for viem calls
// ─────────────────────────────────────────────────────────────────────────────

export function getRaffleConfig() {
  return { address: RAFFLE_CONTRACT, abi: RAFFLE_ABI } as const;
}
