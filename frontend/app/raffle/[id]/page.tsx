"use client";

import { use, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Countdown } from "@/components/ui/Countdown";
import { RouletteWheel } from "@/components/roulette/RouletteWheel";
import { DuckRaceTrack } from "@/components/duckrace/DuckRaceTrack";
import { Confetti } from "@/components/effects/Confetti";
import { formatAvax, cn } from "@/lib/utils";
import { useRaffle } from "@/hooks/useRaffle";
import { publicClient, getPaginatedLogs, getWalletClient, ensureFujiChain } from "@/lib/viem";
import { RAFFLE_ABI } from "@/lib/contracts";
import { RAFFLE_CONTRACT, PROOF_SERVER_URL } from "@/lib/constants";
import type { RaffleStatus } from "@/lib/types";
import { getRaffleParticipants, getRaffleMetadata } from "@/lib/supabase";
import { useWallets } from "@privy-io/react-auth";
import { MerkleTree } from "@/lib/merkle";

function StatusBadge({ status }: { status: RaffleStatus }) {
  const map: Record<RaffleStatus, { variant: "success" | "warning" | "danger" | "neutral"; label: string }> = {
    open: { variant: "success", label: "Open" },
    closed: { variant: "warning", label: "Closed" },
    finalized: { variant: "neutral", label: "Finalized" },
    claimed: { variant: "neutral", label: "Claimed" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function ParticipantList({ participants }: { participants: { index: number; commitment: string; alias?: string }[] }) {
  if (participants.length === 0) {
    return <p className="text-gray-500 text-sm">No participants yet.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {participants.map((p, i) => (
        <motion.div
          key={p.index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="px-3 py-1.5 rounded-full border border-gray-700 bg-bg-elevated text-sm text-cream"
        >
          {p.alias || `Ticket #${p.index}`}
        </motion.div>
      ))}
    </div>
  );
}

function ModeIcon({ mode }: { mode: string }) {
  if (mode === "duckrace") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-mint">
        <ellipse cx="12" cy="15" rx="8" ry="5" opacity="0.3" />
        <circle cx="9" cy="10" r="4" />
        <circle cx="7.5" cy="9" r="1" fill="var(--bg-primary)" />
        <path d="M5 11c-1.5 0-2.5 1-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-mint">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <line x1="12" y1="3" x2="12" y2="6" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="21" strokeLinecap="round" />
    </svg>
  );
}

export default function RaffleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const raffleId = BigInt(id);
  const { raffle, status: fetchedStatus, loading, error, refetch } = useRaffle(raffleId);
  const { wallets } = useWallets();

  // Mode comes from Supabase metadata, no longer toggleable
  const [participants, setParticipants] = useState<{ index: number; commitment: string; alias?: string }[]>([]);
  const [contractOwner, setContractOwner] = useState<string>("");
  const [closing, setClosing] = useState(false);

  // Draw animation state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawComplete, setDrawComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Metadata from Supabase
  const [metaTitle, setMetaTitle] = useState(`Raffle #${id}`);
  const [metaMode, setMetaMode] = useState<"roulette" | "duckrace">("roulette");
  const [endsAt, setEndsAt] = useState(0);

  // Fetch contract owner
  useEffect(() => {
    publicClient.readContract({
      address: RAFFLE_CONTRACT,
      abi: RAFFLE_ABI,
      functionName: "owner",
    }).then((owner) => setContractOwner((owner as string).toLowerCase()));
  }, []);

  // Fetch participants from on-chain events
  useEffect(() => {
    async function fetchParticipants() {
      try {
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

        // Load aliases from Supabase
        const aliases = await getRaffleParticipants(id);
        const aliasMap = new Map<number, string>();
        for (const a of aliases) {
          aliasMap.set(a.leaf_index, a.alias);
        }

        const result = logs.map((log) => {
          const idx = Number(log.args.index);
          return {
            index: idx,
            commitment: "0x" + (log.args.commitment?.toString(16) ?? "0"),
            alias: aliasMap.get(idx),
          };
        });

        setParticipants(result);
      } catch {
        // Silently fail — participants list is non-critical
      }
    }

    fetchParticipants();
  }, [raffleId]);

  // Fetch metadata from Supabase
  useEffect(() => {
    getRaffleMetadata(id).then((meta) => {
      if (meta) {
        setMetaTitle(meta.title || `Raffle #${id}`);
        setMetaMode(meta.mode || "roulette");
        if (meta.ends_at) {
          setEndsAt(meta.ends_at);
        }
      }
    });
  }, [id]);

  // Poll for state changes so ALL viewers see the draw animation
  const [prevStatus, setPrevStatus] = useState<RaffleStatus | null>(null);
  useEffect(() => {
    if (!raffle) return;
    // If raffle just transitioned to finalized and we didn't trigger it locally
    if (fetchedStatus === "finalized" && prevStatus === "open" && !isDrawing && !drawComplete) {
      setIsDrawing(true);
      setDrawComplete(false);
      setShowConfetti(false);
    }
    setPrevStatus(fetchedStatus ?? null);
  }, [fetchedStatus]);

  // Poll contract every 3 seconds while raffle is open
  useEffect(() => {
    if (fetchedStatus !== "open") return;
    const interval = setInterval(() => refetch(), 3000);
    return () => clearInterval(interval);
  }, [fetchedStatus, refetch]);

  const status: RaffleStatus = isDrawing
    ? "closed"
    : drawComplete
      ? "finalized"
      : fetchedStatus ?? "open";

  const handleStartDraw = () => {
    setIsDrawing(true);
    setDrawComplete(false);
    setShowConfetti(false);
  };

  const handleAnimationComplete = useCallback(() => {
    setIsDrawing(false);
    setDrawComplete(true);
    setShowConfetti(true);
  }, []);

  const [drawStep, setDrawStep] = useState("");

  const handleDrawWinner = async () => {
    const wallet = wallets[0];
    if (!wallet) return;
    setClosing(true);
    setDrawStep("");
    try {
      const provider = await wallet.getEthereumProvider();
      await ensureFujiChain(provider);
      const wc = getWalletClient(provider);
      const [account] = await wc.getAddresses();

      const commitmentHexes = participants.map((p) => p.commitment);
      const vrfRandomness = BigInt(Math.floor(Date.now() / 1000));
      const vrfHex = "0x" + vrfRandomness.toString(16).padStart(64, "0");
      const raffleIdHex = "0x" + raffleId.toString(16).padStart(64, "0");

      // Step 1: Close raffle on-chain
      setDrawStep("Closing raffle on-chain...");
      const closeTx = await wc.writeContract({
        address: RAFFLE_CONTRACT,
        abi: RAFFLE_ABI,
        functionName: "closeRaffle",
        args: [raffleId, vrfRandomness],
        account,
        chain: wc.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: closeTx });

      // Step 2: Generate shuffle proof (server-side via API route)
      setDrawStep("Generating ZK shuffle proof... (this may take ~30s)");
      const proofRes = await fetch(`${PROOF_SERVER_URL}/api/shuffle-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitments: commitmentHexes,
          vrf_output: vrfHex,
          raffle_id: raffleIdHex,
          tree_depth: raffle!.levels,
        }),
      });

      if (!proofRes.ok) {
        const errData = await proofRes.json();
        throw new Error(errData.error || "Shuffle proof generation failed");
      }

      const proofData = await proofRes.json();

      // Step 3: Commit shuffle secret on-chain
      setDrawStep("Committing shuffle secret...");
      const secretHashBytes32 = proofData.operator_secret_hash as `0x${string}`;
      const commitTx = await wc.writeContract({
        address: RAFFLE_CONTRACT,
        abi: RAFFLE_ABI,
        functionName: "commitShuffleSecret",
        args: [raffleId, secretHashBytes32],
        account,
        chain: wc.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: commitTx });

      // Step 4: Finalize raffle with shuffle proof on-chain
      setDrawStep("Finalizing raffle with ZK proof...");
      const proofBytes = proofData.proof as `0x${string}`;
      const publicInputs = proofData.publicInputs as `0x${string}`[];
      const finalizeTx = await wc.writeContract({
        address: RAFFLE_CONTRACT,
        abi: RAFFLE_ABI,
        functionName: "finalizeRaffle",
        args: [raffleId, proofBytes, publicInputs],
        account,
        chain: wc.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: finalizeTx });

      // Start animation
      setDrawStep("");
      setIsDrawing(true);
      setDrawComplete(false);
      setShowConfetti(false);

      refetch();
    } catch (err) {
      console.error("Draw failed:", err);
      setDrawStep("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-gray-500 text-center py-20">Loading raffle...</p>
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-gray-500 text-center py-20">{error ?? "Raffle not found."}</p>
      </div>
    );
  }

  const mode = metaMode;
  const title = metaTitle;
  const fillPercent = Math.round((raffle.nextIndex / raffle.maxSize) * 100);
  const participantLabels = participants.map((p) => p.alias || `Ticket #${p.index}`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Confetti active={showConfetti} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <ModeIcon mode={mode} />
          <h1 className="font-heading text-3xl font-bold text-cream">
            {title}
          </h1>
          <StatusBadge status={status} />
        </div>
        <p className="text-gray-300 text-sm">
          Raffle #{id} &middot; {mode === "duckrace" ? "Duck Race" : "Roulette"}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
      >
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Prize Pool</p>
          <p className="font-heading text-xl font-bold text-mint">
            {formatAvax(raffle.prizePool)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Ticket Price</p>
          <p className="font-heading text-xl font-bold text-cream">
            {formatAvax(raffle.ticketPrice)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Participants</p>
          <p className="font-heading text-xl font-bold text-cream">
            {raffle.nextIndex}/{raffle.maxSize}
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-mint transition-all duration-500"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Tree Levels</p>
          <p className="font-heading text-xl font-bold text-cream">
            {raffle.levels}
          </p>
        </Card>
      </motion.div>

      {/* Drawing animation */}
      {status === "closed" && isDrawing && participantLabels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-6">
            <p className="text-center text-sm text-gray-500 mb-4">Drawing winner...</p>
            {mode === "roulette" ? (
              <RouletteWheel
                participants={participantLabels}
                winnerIndex={raffle.winnerIndex}
                spinning={isDrawing}
                onSpinComplete={handleAnimationComplete}
              />
            ) : (
              <DuckRaceTrack
                participants={participantLabels}
                winnerIndex={raffle.winnerIndex}
                racing={isDrawing}
                onRaceComplete={handleAnimationComplete}
              />
            )}
          </Card>
        </motion.div>
      )}

      {/* Countdown & CTA */}
      {status === "open" && (() => {
        const isExpired = endsAt > 0 && Date.now() >= endsAt;
        const isOwner = wallets[0]?.address?.toLowerCase() === contractOwner;

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="p-6">
              {endsAt > 0 && !isExpired && (
                <>
                  <p className="text-sm text-gray-500 mb-4 text-center">Ends in</p>
                  <Countdown
                    targetDate={endsAt}
                    className="justify-center mb-6"
                  />
                </>
              )}
              {isExpired && (
                <p className="text-sm text-yellow-400 mb-4 text-center font-medium">
                  Raffle ended — waiting for draw
                </p>
              )}
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                {!isExpired && (
                  <Link href={`/raffle/${id}/join`}>
                    <Button variant="primary" size="lg" className="glow-pulse">
                      Join Raffle &mdash; {formatAvax(raffle.ticketPrice)}
                    </Button>
                  </Link>
                )}
                {isExpired && isOwner && participants.length > 0 && (
                  <div className="flex flex-col items-center gap-3">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleDrawWinner}
                      loading={closing}
                      disabled={closing}
                      className="glow-pulse"
                    >
                      {closing ? "Drawing..." : "Draw Winner"}
                    </Button>
                    {drawStep && (
                      <p className={`text-sm text-center ${drawStep.startsWith("Error") ? "text-red-400" : "text-gray-400"}`}>
                        {drawStep}
                      </p>
                    )}
                  </div>
                )}
                {isExpired && !isOwner && (
                  <p className="text-gray-500 text-sm text-center">
                    Waiting for the raffle operator to draw the winner.
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        );
      })()}

      {/* Winner state */}
      {(status === "finalized" || drawComplete) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-8 text-center border-mint/30">
            <p className="text-sm text-gray-500 mb-2">Winner</p>
            <p className="font-display text-3xl text-mint mb-4">
              {participants.find(p => p.index === raffle.winnerIndex)?.alias || `Ticket #${raffle.winnerIndex}`}
            </p>
            <p className="text-gray-300 mb-6">
              Prize: <span className="text-cream font-semibold">{formatAvax(raffle.prizePool)}</span>
            </p>
            <Link href={`/raffle/${id}/claim`}>
              <Button variant="primary" size="lg" className="glow-pulse">
                Claim Prize
              </Button>
            </Link>
          </Card>
        </motion.div>
      )}

      {/* Participants */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-heading text-xl font-bold text-cream mb-4">
          Participants ({participants.length})
        </h2>
        <ParticipantList participants={participants} />
      </motion.div>
    </div>
  );
}
