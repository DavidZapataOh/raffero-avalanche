import {
  RAFFLE_CONTRACT,
  VERIFIER_CONTRACT,
  POSEIDON_CONTRACT,
} from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// PrivateRaffle ABI (matches src/Raffle.sol)
// ─────────────────────────────────────────────────────────────────────────────

export const RAFFLE_ABI = [
  // ── Admin ──────────────────────────────────────────────────────────────
  {
    type: "function",
    name: "createRaffle",
    inputs: [
      { name: "raffleId", type: "uint256", internalType: "uint256" },
      { name: "ticketPrice", type: "uint256", internalType: "uint256" },
      { name: "levels", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "closeAndSetWinner",
    inputs: [
      { name: "raffleId", type: "uint256", internalType: "uint256" },
      { name: "randomness", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ── User actions ───────────────────────────────────────────────────────
  {
    type: "function",
    name: "depositTicket",
    inputs: [
      { name: "raffleId", type: "uint256", internalType: "uint256" },
      { name: "commitment", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "claimPrize",
    inputs: [
      { name: "_pA", type: "uint256[2]", internalType: "uint256[2]" },
      { name: "_pB", type: "uint256[2][2]", internalType: "uint256[2][2]" },
      { name: "_pC", type: "uint256[2]", internalType: "uint256[2]" },
      { name: "_pubSignals", type: "uint256[24]", internalType: "uint256[24]" },
      { name: "recipient", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ── Views ──────────────────────────────────────────────────────────────
  {
    type: "function",
    name: "getRoot",
    inputs: [
      { name: "raffleId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "raffles",
    inputs: [
      { name: "raffleId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "levels", type: "uint256", internalType: "uint256" },
      { name: "ticketPrice", type: "uint256", internalType: "uint256" },
      { name: "maxSize", type: "uint256", internalType: "uint256" },
      { name: "nextIndex", type: "uint256", internalType: "uint256" },
      { name: "root", type: "uint256", internalType: "uint256" },
      { name: "open", type: "bool", internalType: "bool" },
      { name: "winnerSet", type: "bool", internalType: "bool" },
      { name: "winnerIndex", type: "uint256", internalType: "uint256" },
      { name: "prizePool", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "commitments",
    inputs: [
      { name: "raffleId", type: "uint256", internalType: "uint256" },
      { name: "index", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nullifiers",
    inputs: [
      { name: "raffleId", type: "uint256", internalType: "uint256" },
      { name: "nullifierHash", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },

  // ── Events ─────────────────────────────────────────────────────────────
  {
    type: "event",
    name: "RaffleCreated",
    inputs: [
      { name: "raffleId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "ticketPrice", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "levels", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "maxSize", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "TicketDeposited",
    inputs: [
      { name: "raffleId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "index", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "commitment", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RaffleClosed",
    inputs: [
      { name: "raffleId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "winnerIndex", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PrizeClaimed",
    inputs: [
      { name: "raffleId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "to", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "nullifierHash", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Verifier ABI (ICircomVerifier — single function)
// ─────────────────────────────────────────────────────────────────────────────

export const VERIFIER_ABI = [
  {
    type: "function",
    name: "verifyProof",
    inputs: [
      { name: "_pA", type: "uint256[2]", internalType: "uint256[2]" },
      { name: "_pB", type: "uint256[2][2]", internalType: "uint256[2][2]" },
      { name: "_pC", type: "uint256[2]", internalType: "uint256[2]" },
      { name: "_pubSignals", type: "uint256[24]", internalType: "uint256[24]" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Poseidon2 ABI (IPoseidon2 — single function)
// ─────────────────────────────────────────────────────────────────────────────

export const POSEIDON_ABI = [
  {
    type: "function",
    name: "poseidon",
    inputs: [
      { name: "inputs", type: "uint256[2]", internalType: "uint256[2]" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: get { address, abi } for a named contract
// ─────────────────────────────────────────────────────────────────────────────

type ContractName = "raffle" | "verifier" | "poseidon";

const CONTRACT_MAP = {
  raffle: { address: RAFFLE_CONTRACT, abi: RAFFLE_ABI },
  verifier: { address: VERIFIER_CONTRACT, abi: VERIFIER_ABI },
  poseidon: { address: POSEIDON_CONTRACT, abi: POSEIDON_ABI },
} as const;

/**
 * Returns the `{ address, abi }` pair for the requested contract, ready to be
 * spread into a viem `readContract` / `writeContract` call.
 *
 * @example
 * ```ts
 * const root = await publicClient.readContract({
 *   ...getContractConfig("raffle"),
 *   functionName: "getRoot",
 *   args: [raffleId],
 * });
 * ```
 */
export function getContractConfig(name: ContractName) {
  return CONTRACT_MAP[name];
}
