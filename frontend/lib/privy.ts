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

/** Privy application ID. Set this before deploying. */
export const PRIVY_APP_ID = "YOUR_PRIVY_APP_ID";
