import { createPublicClient, createWalletClient, custom, http } from "viem";
import { avalancheFuji } from "viem/chains";
import { FUJI_RPC_URL } from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// Public client — read-only access to Avalanche Fuji
// ─────────────────────────────────────────────────────────────────────────────

export const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(FUJI_RPC_URL),
});

// ─────────────────────────────────────────────────────────────────────────────
// Wallet client helper — wraps a Privy EIP-1193 provider into a viem
// WalletClient so we can call writeContract, sendTransaction, etc.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a viem `WalletClient` from a Privy-provided EIP-1193 provider.
 *
 * @example
 * ```ts
 * import { useWallets } from "@privy-io/react-auth";
 *
 * const { wallets } = useWallets();
 * const provider = await wallets[0].getEthereumProvider();
 * const walletClient = getWalletClient(provider);
 * ```
 */
export function getWalletClient(provider: unknown) {
  return createWalletClient({
    chain: avalancheFuji,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transport: custom(provider as any),
  });
}
