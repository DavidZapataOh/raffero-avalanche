"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatAvax } from "@/lib/utils";

type ClaimStep = "loading" | "ready" | "proving" | "success" | "error";

export default function ClaimPrizePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [step, setStep] = useState<ClaimStep>("ready");
  const [proofProgress, setProofProgress] = useState(0);

  // Mock data
  const prizePool = 5500000000000000000n;

  const handleClaim = async () => {
    setStep("proving");
    setProofProgress(0);

    // Simulate proof generation with progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((r) => setTimeout(r, 200));
      setProofProgress(i);
    }

    // TODO: Actually generate ZK proof and submit claim transaction
    // 1. Load secrets from localStorage
    // 2. Fetch Merkle tree data from contract
    // 3. Generate ZK proof with Noir.js + Barretenberg
    // 4. Submit claimPrize transaction

    setStep("success");
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-heading text-3xl font-bold text-cream mb-2">
          Claim Prize
        </h1>
        <p className="text-gray-300 mb-8">Raffle #{id}</p>
      </motion.div>

      {/* Ready to claim */}
      {step === "ready" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 text-center border-mint/20">
            <div className="w-20 h-20 rounded-full bg-mint/10 flex items-center justify-center mx-auto mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-mint">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl font-bold text-cream mb-2">
              Congratulations!
            </h2>
            <p className="text-gray-300 mb-1">You won the raffle!</p>
            <p className="font-heading text-3xl font-bold text-mint mb-8">
              {formatAvax(prizePool)}
            </p>

            <div className="p-4 rounded-xl bg-bg-elevated border border-gray-700 mb-6 text-left">
              <p className="text-sm text-gray-500 mb-2">What happens next:</p>
              <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                <li>A zero-knowledge proof is generated in your browser</li>
                <li>The proof verifies you&apos;re the winner without revealing your identity</li>
                <li>Prize is sent to your wallet</li>
              </ol>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleClaim}
              className="glow-pulse"
            >
              Generate Proof & Claim
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Generating proof */}
      {step === "proving" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-8 text-center">
            {/* Vintage loading reel animation */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <motion.div
                className="w-24 h-24 rounded-full border-4 border-gray-700 border-t-mint"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-mint">{proofProgress}%</span>
              </div>
            </div>
            <h2 className="font-heading text-xl font-bold text-cream mb-2">
              Generating ZK Proof...
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              This may take a moment. Please don&apos;t close this page.
            </p>
            <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
              <motion.div
                className="h-full bg-mint rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${proofProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Success */}
      {step === "success" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-8 text-center border-mint/30">
            <div className="w-20 h-20 rounded-full bg-mint/15 flex items-center justify-center mx-auto mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-mint">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl font-bold text-cream mb-2">
              Prize Claimed!
            </h2>
            <p className="font-heading text-3xl font-bold text-mint mb-4">
              {formatAvax(prizePool)}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              has been sent to your wallet.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/explore">
                <Button variant="secondary">Explore More</Button>
              </Link>
              <Link href={`/raffle/${id}`}>
                <Button variant="primary">View Raffle</Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Error */}
      {step === "error" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="p-8 text-center border-danger/30">
            <div className="w-16 h-16 rounded-full bg-danger/15 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-danger">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>
            <h2 className="font-heading text-xl font-bold text-cream mb-2">
              Claim Failed
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Something went wrong. Please try again.
            </p>
            <Button variant="primary" onClick={() => setStep("ready")}>
              Try Again
            </Button>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
