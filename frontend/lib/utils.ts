import { formatUnits } from "viem";

// ─────────────────────────────────────────────────────────────────────────────
// Address formatting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Truncate an Ethereum address for display: `0x1234...5678`.
 *
 * @param address Full checksummed or lowercase address.
 * @param prefixLen Number of hex chars to keep after "0x" (default 4).
 * @param suffixLen Number of hex chars to keep at the end (default 4).
 */
export function shortenAddress(
  address: string,
  prefixLen = 4,
  suffixLen = 4,
): string {
  if (!address) return "";
  return `${address.slice(0, 2 + prefixLen)}...${address.slice(-suffixLen)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Currency formatting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a wei amount as a human-readable AVAX string with up to `decimals`
 * significant fractional digits.
 *
 * @param wei Amount in wei (1 AVAX = 10^18 wei).
 * @param decimals Maximum number of decimal places to show (default 4).
 * @returns Formatted string, e.g. `"1.2345 AVAX"`.
 */
export function formatAvax(wei: bigint, decimals = 4): string {
  const raw = formatUnits(wei, 18);
  // Trim trailing zeros but keep at least one decimal if there is a fraction
  const [int, frac = ""] = raw.split(".");
  const trimmedFrac = frac.slice(0, decimals).replace(/0+$/, "");
  const formatted = trimmedFrac.length > 0 ? `${int}.${trimmedFrac}` : int;
  return `${formatted} AVAX`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Class name helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merge CSS class names, filtering out falsy values.
 *
 * @example
 * ```tsx
 * <div className={cn("base", isActive && "active", className)} />
 * ```
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Cryptographic helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random 32-byte hex string prefixed with `0x`.
 * Suitable for use as a Poseidon-compatible secret or nullifier preimage.
 *
 * Uses `crypto.getRandomValues` (available in all modern browsers and Node 19+).
 */
const BN254_PRIME = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001n;

export function generateRandomField(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const val = BigInt(`0x${hex}`) % BN254_PRIME;
  return "0x" + val.toString(16).padStart(64, "0");
}
