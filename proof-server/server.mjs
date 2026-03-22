#!/usr/bin/env node
/**
 * Raffero Proof Server
 *
 * Dedicated server for generating ZK shuffle proofs.
 * Runs on the operator's machine (not on Vercel).
 *
 * Endpoints:
 *   POST /api/shuffle-proof  — Generate a shuffle proof
 *   GET  /api/health          — Health check
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { randomBytes } from "crypto";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const BN254 = BigInt("0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001");

// Allowed origins — add your Vercel domain here
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL,
].filter(Boolean);

const app = express();

// ── Security ────────────────────────────────────────────────────────────────

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || process.env.ALLOW_ALL_ORIGINS === "true") {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
}));

// Rate limiting: max 5 proof requests per minute per IP
const proofLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Too many proof requests. Try again in a minute." },
});

// ── Startup checks ──────────────────────────────────────────────────────────

function checkDependencies() {
  // Check bb CLI
  try {
    const version = execSync("bb --version", { encoding: "utf-8" }).trim();
    console.log(`✓ bb CLI found: ${version}`);
  } catch {
    console.error("✗ bb CLI not found. Install: https://github.com/AztecProtocol/aztec-packages/tree/master/barretenberg");
    process.exit(1);
  }

  // Check circuit artifacts
  const shuffleArtifact = resolve(__dirname, "..", "circuits", "shuffle", "target", "shuffle.json");
  if (!existsSync(shuffleArtifact)) {
    console.error(`✗ Shuffle circuit not found at ${shuffleArtifact}`);
    console.error("  Run: cd circuits/shuffle && nargo build");
    process.exit(1);
  }
  console.log("✓ Shuffle circuit artifact found");

  // Check shuffle VK
  const shuffleVK = resolve(__dirname, "..", "circuits", "shuffle", "target", "vk_keccak", "vk");
  if (!existsSync(shuffleVK)) {
    console.error(`✗ Shuffle VK not found at ${shuffleVK}`);
    console.error("  Run: cd circuits/shuffle && bb write_vk -s ultra_honk --oracle_hash keccak -b target/shuffle.json -o target/vk_keccak");
    process.exit(1);
  }
  console.log("✓ Shuffle verification key found");

  // Check generate script
  const scriptPath = resolve(__dirname, "..", "js-scripts", "generate-shuffle-proof.mjs");
  if (!existsSync(scriptPath)) {
    console.error(`✗ Script not found at ${scriptPath}`);
    process.exit(1);
  }
  console.log("✓ Shuffle proof script found");
}

// ── Routes ──────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.post("/api/shuffle-proof", proofLimiter, async (req, res) => {
  const startTime = Date.now();
  const { commitments, vrf_output, raffle_id, tree_depth } = req.body;

  // Validate input
  if (!Array.isArray(commitments) || commitments.length === 0) {
    return res.status(400).json({ error: "commitments must be a non-empty array" });
  }
  if (!vrf_output || !raffle_id || !tree_depth) {
    return res.status(400).json({ error: "Missing required fields: vrf_output, raffle_id, tree_depth" });
  }

  console.log(`[shuffle-proof] Starting: ${commitments.length} participants, depth=${tree_depth}`);

  // Generate operator secret
  const secretRaw = BigInt("0x" + randomBytes(32).toString("hex")) % BN254;
  const operatorSecret = "0x" + secretRaw.toString(16).padStart(64, "0");

  const inputData = {
    commitments,
    operator_secret: operatorSecret,
    vrf_output,
    raffle_id,
    tree_depth,
  };

  const inputFile = `/tmp/raffero_shuffle_${Date.now()}_${Math.random().toString(36).slice(2)}.json`;

  try {
    writeFileSync(inputFile, JSON.stringify(inputData));

    const scriptPath = resolve(__dirname, "..", "js-scripts", "generate-shuffle-proof.mjs");
    const result = execSync(`node "${scriptPath}" "${inputFile}"`, {
      timeout: 180000, // 3 minutes max
      maxBuffer: 10 * 1024 * 1024,
      encoding: "utf-8",
    });

    const parsed = JSON.parse(result);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[shuffle-proof] Done in ${elapsed}s. Winner: ${parsed.winner_index}`);

    res.json({
      proof: parsed.proof,
      publicInputs: parsed.publicInputs,
      operator_secret_hash: parsed.operator_secret_hash,
      winner_index: parsed.winner_index,
      operator_secret: operatorSecret,
      elapsed_seconds: parseFloat(elapsed),
    });
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[shuffle-proof] Failed after ${elapsed}s:`, message);
    res.status(500).json({ error: "Proof generation failed: " + message });
  } finally {
    try { unlinkSync(inputFile); } catch { /* ignore */ }
  }
});

// ── Start ───────────────────────────────────────────────────────────────────

checkDependencies();

app.listen(PORT, () => {
  console.log("");
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║       Raffero Proof Server — Running         ║");
  console.log(`║       http://localhost:${PORT}                  ║`);
  console.log("╚══════════════════════════════════════════════╝");
  console.log("");
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
  console.log("Set FRONTEND_URL env var to add your Vercel domain.");
  console.log("Set ALLOW_ALL_ORIGINS=true to allow any origin (dev only).");
  console.log("");
});
