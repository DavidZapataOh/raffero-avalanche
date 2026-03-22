"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type Tab = "participated" | "created";

interface StoredTicket {
  raffleId: string;
  alias: string;
  timestamp: number;
  secret: string;
  nullifier: string;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="mx-auto text-gray-500 mb-4"
      >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M9 9h6M9 13h4" strokeLinecap="round" />
      </svg>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

export default function MyRafflesPage() {
  const [tab, setTab] = useState<Tab>("participated");
  const [tickets, setTickets] = useState<StoredTicket[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("raffero_tickets") || "[]");
      setTickets(stored);
    } catch {
      setTickets([]);
    }
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-heading text-4xl font-bold text-cream mb-2">
          My Raffles
        </h1>
        <p className="text-gray-300">
          Track your participated and created raffles.
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-bg-elevated border border-gray-700 mb-8 w-fit">
        {(["participated", "created"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-5 py-2 text-sm font-medium rounded-lg transition-colors capitalize cursor-pointer",
              tab === t
                ? "bg-mint/15 text-mint"
                : "text-gray-300 hover:text-cream"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Participated tab */}
      {tab === "participated" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {tickets.length === 0 ? (
            <EmptyState message="You haven't joined any raffles yet." />
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket, i) => (
                <motion.div
                  key={`${ticket.raffleId}-${ticket.timestamp}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card hover className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-cream font-medium">
                            Raffle #{ticket.raffleId}
                          </p>
                          <Badge variant="success">Joined</Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Alias: <span className="text-gray-300">{ticket.alias}</span>
                          {" "}&middot;{" "}
                          {new Date(ticket.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <Link href={`/raffle/${ticket.raffleId}`}>
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Created tab */}
      {tab === "created" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <EmptyState message="You haven't created any raffles yet." />
          <div className="mt-6 text-center">
            <Link href="/raffle/create">
              <Button variant="primary" className="glow-pulse">
                Create Your First Raffle
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
