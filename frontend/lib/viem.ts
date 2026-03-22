import { createPublicClient, createWalletClient, custom, http } from "viem";
import { avalancheFuji } from "viem/chains";
import { FUJI_RPC_URL, FUJI_CHAIN_ID, DEPLOY_BLOCK, MAX_BLOCK_RANGE } from "./constants";

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

/**
 * Ensure the wallet is on Avalanche Fuji. If not, request a chain switch.
 * Call this before any writeContract call.
 */
export async function ensureFujiChain(provider: unknown): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = provider as any;
  const chainIdHex = await p.request({ method: "eth_chainId" });
  const currentChainId = parseInt(chainIdHex, 16);

  if (currentChainId === FUJI_CHAIN_ID) return;

  const fujiChainIdHex = "0x" + FUJI_CHAIN_ID.toString(16);

  try {
    await p.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: fujiChainIdHex }],
    });
  } catch (switchError: unknown) {
    // Chain not added — add it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((switchError as any)?.code === 4902) {
      await p.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: fujiChainIdHex,
          chainName: "Avalanche Fuji",
          nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
          rpcUrls: [FUJI_RPC_URL],
          blockExplorerUrls: ["https://testnet.snowtrace.io"],
        }],
      });
    } else {
      throw switchError;
    }
  }
}

/**
 * Paginated getLogs that respects Fuji's 2048 block limit.
 * Fetches from DEPLOY_BLOCK to latest in chunks.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Paginated getLogs that respects Fuji's 2048 block limit.
 * Fetches from DEPLOY_BLOCK to latest in chunks.
 */
export async function getPaginatedLogs(params: {
  address: `0x${string}`;
  event: any;
  args?: any;
}): Promise<any[]> {
  const latestBlock = await publicClient.getBlockNumber();
  const allLogs: any[] = [];

  let from = DEPLOY_BLOCK;
  while (from <= latestBlock) {
    const to = from + MAX_BLOCK_RANGE - 1n > latestBlock ? latestBlock : from + MAX_BLOCK_RANGE - 1n;
    try {
      const logs = await publicClient.getLogs({
        ...params,
        fromBlock: from,
        toBlock: to,
      } as any);
      allLogs.push(...logs);
    } catch {
      // If a chunk fails, skip it
    }
    from = to + 1n;
  }

  return allLogs;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
