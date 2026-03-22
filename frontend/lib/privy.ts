import type { PrivyClientConfig } from "@privy-io/react-auth";
import { avalancheFuji } from "viem/chains";

// ─────────────────────────────────────────────────────────────────────────────
// Privy configuration
//
// Replace the appId with your actual Privy application ID from
// https://dashboard.privy.io before deploying.
// ─────────────────────────────────────────────────────────────────────────────

export const privyConfig: PrivyClientConfig = {
  appearance: {
    theme: "dark",
    accentColor: "#53e3c3",
    logo: undefined,
  },
  loginMethods: ["wallet", "email"],
  supportedChains: [avalancheFuji],
  defaultChain: avalancheFuji,
};

/** Privy application ID — set via NEXT_PUBLIC_PRIVY_APP_ID in .env.local */
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";
