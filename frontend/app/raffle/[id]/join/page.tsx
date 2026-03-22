"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { formatAvax } from "@/lib/utils";
import { generateRandomField } from "@/lib/utils";
import { generateCommitment } from "@/lib/commitment";
import { useRaffle } from "@/hooks/useRaffle";
import { useDepositTicket } from "@/hooks/useDepositTicket";
import { useWallets } from "@privy-io/react-auth";
import { publicClient } from "@/lib/viem";
import { RAFFLE_ABI } from "@/lib/contracts";
import { parseEventLogs } from "viem";
import { saveParticipantAlias } from "@/lib/supabase";

type JoinStep = "alias" | "confirm" | "success";

export default function JoinRafflePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const raffleId = BigInt(id);
  const { raffle, loading: raffleLoading } = useRaffle(raffleId);
  const { wallets } = useWallets();
  const { depositTicket } = useDepositTicket();
  const [step, setStep] = useState<JoinStep>("alias");
  const [alias, setAlias] = useState("");
  const [displayAlias, setDisplayAlias] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const ticketPrice = raffle?.ticketPrice ?? 0n;

  const handleConfirm = async () => {
    setSubmitting(true);
    setError("");
    try {
      const wallet = wallets[0];
      if (!wallet) throw new Error("No wallet connected");
      const provider = await wallet.getEthereumProvider();

      // Generate cryptographic secrets
      const secret = generateRandomField();
      const nullifier = generateRandomField();

      // Compute real Poseidon2 commitment
      const commitment = await generateCommitment(secret, nullifier);

      // Call depositTicket on-chain
      const hash = await depositTicket({
        raffleId,
        commitment,
        ticketPrice,
        provider,
      });

      // Wait for receipt and parse TicketDeposited event to get leafIndex
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const logs = parseEventLogs({
        abi: RAFFLE_ABI,
        logs: receipt.logs,
        eventName: "TicketDeposited",
      });

      const leafIndex = logs.length > 0 ? Number(logs[0].args.index) : -1;

      // Add random 4-digit discriminator to alias
      const discriminator = Math.floor(1000 + Math.random() * 9000).toString();
      const fullAlias = `${alias}#${discriminator}`;
      setDisplayAlias(fullAlias);

      // Save alias to Supabase (public, visible to everyone)
      await saveParticipantAlias({
        raffleId: id,
        leafIndex,
        alias: fullAlias,
        joinedAt: Date.now(),
      });

      // Save secrets to localStorage (private, never leaves the browser)
      const ticket = {
        raffleId: id,
        secret,
        nullifier,
        alias: fullAlias,
        leafIndex,
        commitment: "0x" + commitment.toString(16).padStart(64, "0"),
        timestamp: Date.now(),
      };

      const existing = JSON.parse(localStorage.getItem("raffero_tickets") || "[]");
      existing.push(ticket);
      localStorage.setItem("raffero_tickets", JSON.stringify(existing));

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (raffleLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <p className="text-gray-400">Loading raffle...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-heading text-3xl font-bold text-cream mb-2">
          Join Raffle
        </h1>
        <p className="text-gray-300 mb-8">
          Raffle #{id} &middot; Entry: {formatAvax(ticketPrice)}
        </p>
      </motion.div>

      {/* Step: Choose Alias */}
      {step === "alias" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <h2 className="font-heading text-xl font-semibold text-cream mb-2">
              Choose Your Alias
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              This name will be shown on the roulette wheel or duck. Only you will
              know it&apos;s you.
            </p>
            <Input
              label="Alias"
              placeholder="e.g. LuckyDuck, NeonNinja, CryptoKitty"
              value={alias}
              onChange={(e) => setAlias(e.target.value.slice(0, 20))}
              error={alias.length > 0 && alias.length < 2 ? "At least 2 characters" : undefined}
            />
            <p className="text-xs text-gray-500 mt-2 text-right">
              {alias.length}/20
            </p>
            <div className="mt-6 flex justify-end">
              <Button
                variant="primary"
                onClick={() => setStep("confirm")}
                disabled={alias.length < 2}
              >
                Continue
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <h2 className="font-heading text-xl font-semibold text-cream mb-4">
              Confirm Your Entry
            </h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Alias</span>
                <span className="text-cream font-medium">{alias}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ticket Price</span>
                <span className="text-cream font-medium">{formatAvax(ticketPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Raffle</span>
                <span className="text-cream font-medium">#{id}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-mint/5 border border-mint/20 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-mint shrink-0 mt-0.5"
                >
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
                <div>
                  <p className="text-sm text-mint font-medium">Your secrets stay local</p>
                  <p className="text-xs text-gray-300 mt-1">
                    A secret key will be generated and stored in your browser.
                    Do NOT clear your browser data — you need it to claim prizes.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-danger mb-4">{error}</p>
            )}

            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep("alias")}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                loading={submitting}
                className="glow-pulse"
              >
                Buy Ticket &mdash; {formatAvax(ticketPrice)}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Step: Success */}
      {step === "success" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-8 text-center border-mint/30">
            <div className="w-16 h-16 rounded-full bg-mint/15 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-mint">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl font-bold text-cream mb-2">
              You&apos;re In!
            </h2>
            <p className="text-gray-300 mb-2">
              Welcome, <span className="text-mint font-semibold">{displayAlias || alias}</span>!
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Your ticket has been purchased. Good luck!
            </p>
            <Link href={`/raffle/${id}`}>
              <Button variant="primary">
                View Raffle
              </Button>
            </Link>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
