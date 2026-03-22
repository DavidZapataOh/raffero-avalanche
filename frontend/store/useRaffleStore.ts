"use client";

// ─────────────────────────────────────────────────────────────────────────────
// useRaffleStore — Zustand store for the currently viewed raffle
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import type { Raffle, Participant } from "@/lib/types";

interface RaffleStore {
  /** The raffle currently being viewed / interacted with. */
  currentRaffle: Raffle | null;
  /** Participant list for the current raffle. */
  participants: Participant[];
  /** Replace the current raffle. */
  setCurrentRaffle: (raffle: Raffle) => void;
  /** Replace the participant list. */
  setParticipants: (participants: Participant[]) => void;
  /** Reset both raffle and participants to their initial state. */
  clearRaffle: () => void;
}

export const useRaffleStore = create<RaffleStore>((set) => ({
  currentRaffle: null,
  participants: [],

  setCurrentRaffle: (raffle) => set({ currentRaffle: raffle }),

  setParticipants: (participants) => set({ participants }),

  clearRaffle: () => set({ currentRaffle: null, participants: [] }),
}));
