"use client";

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatAvax } from "@/lib/utils";
import { useRaffle } from "@/hooks/useRaffle";
import { useClaimPrize } from "@/hooks/useClaimPrize";
import { useProofGeneration } from "@/hooks/useProofGeneration";
import { useWallets } from "@privy-io/react-auth";
import { generateNullifierHash, generateRecipientBinding } from "@/lib/commitment";
import { MerkleTree } from "@/lib/merkle";
import { formatProofForContract, type ClaimProofInputs } from "@/lib/noir";
import { publicClient, getPaginatedLogs } from "@/lib/viem";
import { RAFFLE_ABI } from "@/lib/contracts";
import { RAFFLE_CONTRACT, MAX_TREE_DEPTH } from "@/lib/constants";

type ClaimStep = "loading" | "ready" | "proving" | "claiming" | "success" | "error";

function toHex32(val: bigint): string {
  return "0x" + val.toString(16).padStart(64, "0");
}

export default function ClaimPrizePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const raffleId = BigInt(id);
  const { raffle, loading: raffleLoading } = useRaffle(raffleId);
  const { claimPrize } = useClaimPrize();
  const { generateProof, progress } = useProofGeneration();
  const { wallets } = useWallets();
  const [step, setStep] = useState<ClaimStep>("loading");
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<{
    secret: string;
    nullifier: string;
    leafIndex: number;
  } | null>(null);

  // Load ticket from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("raffero_tickets") || "[]");
    const found = stored.find((t: { raffleId: string }) => t.raffleId === id);
    if (found) {
      setTicket({
        secret: found.secret,
        nullifier: found.nullifier,
        leafIndex: found.leafIndex,
      });
      setStep("ready");
    } else {
      setError("No ticket found for this raffle. Did you join?");
      setStep("error");
    }
  }, [id]);

  const handleClaim = async () => {
    if (!raffle || !ticket) return;

    const wallet = wallets[0];
    if (!wallet) {
      setError("No wallet connected");
      setStep("error");
      return;
    }

    setStep("proving");
    setError("");

    try {
      const provider = await wallet.getEthereumProvider();
      const [account] = await (await import("@/lib/viem")).getWalletClient(provider).getAddresses();
      const recipientAddress = account;

      // Fetch all commitments from on-chain events to build the Merkle tree
      const logs = await getPaginatedLogs({
        address: RAFFLE_CONTRACT,
        event: {
          type: "event",
          name: "TicketDeposited",
          inputs: [
            { name: "raffleId", type: "uint256", indexed: true },
            { name: "index", type: "uint256", indexed: false },
            { name: "commitment", type: "uint256", indexed: false },
          ],
        },
        args: { raffleId },
      });

      // Build commitment list in order
      const commitments: bigint[] = [];
      for (const log of logs) {
        const idx = Number(log.args.index);
        commitments[idx] = log.args.commitment!;
      }

      // Build Merkle tree from raw commitments
      const tree = new MerkleTree(raffle.levels, commitments);
      const { siblings, pathIndices } = await tree.getProof(ticket.leafIndex);

      // Pad to MAX_DEPTH
      while (siblings.length < MAX_TREE_DEPTH) siblings.push(0n);
      while (pathIndices.length < MAX_TREE_DEPTH) pathIndices.push(0);

      const root = await tree.getRoot();
      const nullifierHash = await generateNullifierHash(ticket.nullifier, raffleId);
      const recipientBinding = await generateRecipientBinding(
        nullifierHash,
        recipientAddress,
      );

      // Build circuit inputs
      const circuitInputs: ClaimProofInputs = {
        secret: toHex32(BigInt(ticket.secret)),
        nullifier: toHex32(BigInt(ticket.nullifier)),
        siblings: siblings.map(s => toHex32(s)),
        path_indices: pathIndices.map(p => toHex32(BigInt(p))),
        recipient: toHex32(BigInt(recipientAddress)),
        root: toHex32(root),
        nullifier_hash: toHex32(nullifierHash),
        recipient_binding: toHex32(recipientBinding),
        raffle_id: toHex32(raffleId),
        winner_index: toHex32(BigInt(raffle.winnerIndex)),
        tree_depth: toHex32(BigInt(raffle.levels)),
      };

      // Generate real ZK proof
      const proofResult = await generateProof(circuitInputs);
      const { proofBytes, publicInputs } = formatProofForContract(proofResult);

      // Submit claim transaction
      setStep("claiming");
      await claimPrize({
        proofBytes,
        publicInputs,
        recipient: recipientAddress as `0x${string}`,
        provider,
      });

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
      setStep("error");
    }
  };

  const prizePool = raffle?.prizePool ?? 0n;

  if (raffleLoading || step === "loading") {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <p className="text-gray-400">Loading...</p>
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
      {(step === "proving" || step === "claiming") && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-8 text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <motion.div
                className="w-24 h-24 rounded-full border-4 border-gray-700 border-t-mint"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-mint">
                  {step === "claiming" ? "TX" : `${progress}%`}
                </span>
              </div>
            </div>
            <h2 className="font-heading text-xl font-bold text-cream mb-2">
              {step === "claiming" ? "Submitting Transaction..." : "Generating ZK Proof..."}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {step === "claiming"
                ? "Waiting for on-chain confirmation."
                : "This may take a moment. Please don\u0027t close this page."}
            </p>
            {step === "proving" && (
              <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                <motion.div
                  className="h-full bg-mint rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
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
              {error.includes("No ticket") ? "No Ticket Found" : "Claim Failed"}
            </h2>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            {!error.includes("No ticket") && (
              <Button variant="primary" onClick={() => setStep("ready")}>
                Try Again
              </Button>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}
