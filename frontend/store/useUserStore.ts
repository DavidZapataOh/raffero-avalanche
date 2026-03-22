"use client";

// ─────────────────────────────────────────────────────────────────────────────
// useUserStore — Zustand store for the current user's tickets
// ─────────────────────────────────────────────────────────────────────────────
//
// Tickets are persisted to localStorage so the user can close the browser and
// still reclaim their secrets later.  The store hydrates from localStorage on
// first access via `loadTickets`.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import type { UserTicket } from "@/lib/types";

const STORAGE_KEY = "raffero:tickets";

// ─────────────────────────────────────────────────────────────────────────────
// localStorage helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read tickets from localStorage.
 *
 * bigint fields are stored as hex strings and revived during parsing so that
 * JSON round-tripping works correctly.
 */
function readFromStorage(): UserTicket[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown[] = JSON.parse(raw);
    return parsed.map((item) => {
      const t = item as Record<string, unknown>;
      return {
        ...t,
        raffleId: BigInt(t.raffleId as string),
      } as UserTicket;
    });
  } catch {
    console.warn("[useUserStore] Failed to parse tickets from localStorage.");
    return [];
  }
}

/** Write tickets to localStorage, serialising bigint fields as strings. */
function writeToStorage(tickets: UserTicket[]): void {
  if (typeof window === "undefined") return;

  try {
    const serialisable = tickets.map((t) => ({
      ...t,
      raffleId: t.raffleId.toString(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialisable));
  } catch {
    console.warn("[useUserStore] Failed to write tickets to localStorage.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

interface UserStore {
  /** All tickets the user holds across all raffles. */
  tickets: UserTicket[];
  /** Hydrate the store from localStorage. Call once on app mount. */
  loadTickets: () => void;
  /** Add a ticket and persist to localStorage. */
  addTicket: (ticket: UserTicket) => void;
  /** Look up the ticket for a specific raffle. */
  getTicket: (raffleId: bigint) => UserTicket | undefined;
  /** Remove all tickets from memory and localStorage. */
  clearTickets: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  tickets: [],

  loadTickets: () => {
    const tickets = readFromStorage();
    set({ tickets });
  },

  addTicket: (ticket) => {
    const updated = [...get().tickets, ticket];
    set({ tickets: updated });
    writeToStorage(updated);
  },

  getTicket: (raffleId) => {
    return get().tickets.find((t) => t.raffleId === raffleId);
  },

  clearTickets: () => {
    set({ tickets: [] });
    writeToStorage([]);
  },
}));
