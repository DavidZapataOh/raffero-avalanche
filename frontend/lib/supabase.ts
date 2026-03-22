import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xmdkdfmiekkkjherzmzi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZGtkZm1pZWtra2poZXJ6bXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTc5MzYsImV4cCI6MjA4OTczMzkzNn0.HoW0zdKZxLVmAkJ7GToeoPcE2sar3PiZT0cC9RShApk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Raffle metadata ────────────────────────────────────────────────────

export async function saveRaffleMetadata(data: {
  raffleId: string;
  title: string;
  mode: string;
  visibility: string;
  endsAt: number;
  createdAt: number;
  creator?: string;
}) {
  const { error } = await supabase.from("raffle_metadata").insert({
    raffle_id: data.raffleId,
    title: data.title,
    mode: data.mode,
    visibility: data.visibility,
    ends_at: data.endsAt,
    created_at: data.createdAt,
    creator: data.creator,
  });
  if (error) throw new Error(error.message);
}

export async function getRaffleMetadata(raffleId: string) {
  const { data, error } = await supabase
    .from("raffle_metadata")
    .select("*")
    .eq("raffle_id", raffleId)
    .single();
  if (error) return null;
  return data;
}

export async function getAllRaffleMetadata() {
  const { data, error } = await supabase
    .from("raffle_metadata")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

// ── Participants (aliases) ─────────────────────────────────────────────

export async function saveParticipantAlias(data: {
  raffleId: string;
  leafIndex: number;
  alias: string;
  joinedAt: number;
}) {
  const { error } = await supabase.from("raffle_participants").insert({
    raffle_id: data.raffleId,
    leaf_index: data.leafIndex,
    alias: data.alias,
    joined_at: data.joinedAt,
  });
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
}

export async function getRaffleParticipants(raffleId: string) {
  const { data, error } = await supabase
    .from("raffle_participants")
    .select("*")
    .eq("raffle_id", raffleId)
    .order("leaf_index", { ascending: true });
  if (error) return [];
  return data;
}
