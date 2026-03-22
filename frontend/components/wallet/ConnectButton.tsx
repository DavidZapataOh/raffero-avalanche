"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/Button";
import { shortenAddress } from "@/lib/utils";
import { PRIVY_APP_ID } from "@/lib/privy";

const isPrivyConfigured =
  !!PRIVY_APP_ID && !PRIVY_APP_ID.startsWith("YOUR_");

function PrivyConnectButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  if (!ready) {
    return (
      <Button variant="secondary" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (!authenticated) {
    return (
      <Button variant="primary" size="sm" onClick={login} className="glow-pulse">
        Connect Wallet
      </Button>
    );
  }

  const address = user?.wallet?.address;

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 bg-bg-elevated">
        <div className="w-2 h-2 rounded-full bg-mint" />
        <span className="text-sm text-cream font-medium">
          {address ? shortenAddress(address) : "Connected"}
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={logout}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M6 8h8" />
        </svg>
      </Button>
    </div>
  );
}

export function ConnectButton() {
  if (!isPrivyConfigured) {
    return (
      <Button variant="primary" size="sm" disabled className="opacity-60">
        Wallet (No API Key)
      </Button>
    );
  }

  return <PrivyConnectButton />;
}
