#!/usr/bin/env node
/**
 * generate-shuffle-proof.mjs
 *
 * Generates the shuffle proof for finalizeRaffle.
 * Uses @noir-lang/noir_js for witness generation and `bb` CLI for proving
 * (the WASM backend can't handle the CHUNK=256 circuit).
 *
 * Usage:
 *   node generate-shuffle-proof.mjs <inputs.json>
 *
 * Input JSON:
 *   {
 *     "commitments": ["0x...", ...],
 *     "operator_secret": "0x...",
 *     "vrf_output": "0x...",
 *     "raffle_id": "0x...",
 *     "tree_depth": 4
 *   }
 *
 * Output (stdout JSON):
 *   {
 *     "proof": "0x...",
 *     "publicInputs": ["0x...", ...],
 *     "final_commitments": ["0x...", ...],
 *     "winner_index": <number>,
 *     "operator_secret_hash": "0x..."
 *   }
 */

import { Noir } from "@noir-lang/noir_js";
import { BarretenbergSync, Fr } from "@aztec/bb.js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CHUNK = 256;
const DOMAIN_ENTRY = 0x454e5452595f5631n;
const DOMAIN_SHUFFLE = 0x53485546464c455f5631n;
const DOMAIN_SECRET = 0x5345435245545f5631n;
const ZERO_LEAF = 0x1d028cb78671d570e29d04748982b4d86bf5d94d10b081fc71ab63f5f319a144n;

let api;

function poseidon2(inputs) {
  return BigInt(api.poseidon2Hash(inputs.map(v => new Fr(BigInt(v)))).toString());
}
function hash2(a, b) { return poseidon2([a, b]); }
function toHex32(val) { return "0x" + BigInt(val).toString(16).padStart(64, "0"); }

function computeMerkleRoot(leaves, n, depth) {
  const width = 1 << depth;
  const padded = new Array(width);
  for (let i = 0; i < width; i++) padded[i] = i < n ? leaves[i] : ZERO_LEAF;
  let layer = padded;
  for (let level = 0; level < depth; level++) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) next.push(hash2(layer[i], layer[i + 1]));
    layer = next;
  }
  return layer[0];
}

function fisherYatesShuffle(input, n, seed) {
  const arr = [...input];
  for (let iter = 0; iter < n - 1; iter++) {
    const i = n - 1 - iter;
    const hashVal = poseidon2([seed, BigInt(iter)]);
    const hashAsU64 = hashVal & ((1n << 64n) - 1n);
    const j = Number(hashAsU64 % BigInt(i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    process.stderr.write("Usage: node generate-shuffle-proof.mjs <inputs.json>\n");
    process.exit(1);
  }

  api = await BarretenbergSync.initSingleton();

  const input = JSON.parse(readFileSync(resolve(inputPath), "utf8"));
  const commitmentsBig = input.commitments.map(c => BigInt(c));
  const operatorSecret = BigInt(input.operator_secret);
  const vrfOutput = BigInt(input.vrf_output);
  const raffleId = BigInt(input.raffle_id);
  const treeDepth = input.tree_depth;
  const n = commitmentsBig.length;

  process.stderr.write(`Shuffle: ${n} participants, depth=${treeDepth}\n`);

  // 1. Compute entry_hashes
  const entryHashes = commitmentsBig.map((c, i) => poseidon2([DOMAIN_ENTRY, c, BigInt(i)]));

  const pendingLeaves = new Array(CHUNK);
  for (let i = 0; i < CHUNK; i++) pendingLeaves[i] = i < n ? entryHashes[i] : ZERO_LEAF;

  // 2. Compute roots and shuffle
  const pendingRoot = computeMerkleRoot(pendingLeaves, n, treeDepth);
  const operatorSecretHash = poseidon2([DOMAIN_SECRET, operatorSecret]);
  const seed = poseidon2([DOMAIN_SHUFFLE, vrfOutput, operatorSecret, raffleId]);
  const shuffledLeaves = fisherYatesShuffle(pendingLeaves, n, seed);

  const entryHashMap = new Map();
  for (let i = 0; i < n; i++) entryHashMap.set(entryHashes[i], { commitment: commitmentsBig[i], alias: BigInt(i) });

  const finalCommitments = new Array(CHUNK).fill(ZERO_LEAF);
  const finalAliases = new Array(CHUNK).fill(ZERO_LEAF);
  for (let i = 0; i < n; i++) {
    const entry = entryHashMap.get(shuffledLeaves[i]);
    if (!entry) { process.stderr.write(`ERROR: decompose failed at index ${i}\n`); process.exit(1); }
    finalCommitments[i] = entry.commitment;
    finalAliases[i] = entry.alias;
  }

  const finalRoot = computeMerkleRoot(finalCommitments, n, treeDepth);
  const aliasRoot = computeMerkleRoot(finalAliases, n, treeDepth);

  process.stderr.write(`Pending root: ${toHex32(pendingRoot)}\n`);
  process.stderr.write(`Final root:   ${toHex32(finalRoot)}\n`);
  process.stderr.write(`Alias root:   ${toHex32(aliasRoot)}\n`);

  // 3. Generate witness with Noir.js
  const artifactPath = resolve(__dirname, "../circuits/shuffle/target/shuffle.json");
  const circuit = JSON.parse(readFileSync(artifactPath, "utf8"));
  const noir = new Noir(circuit);

  const circuitInputs = {
    pending_leaves: pendingLeaves.map(l => toHex32(l)),
    final_commitments: finalCommitments.map(c => toHex32(c)),
    final_aliases: finalAliases.map(a => toHex32(a)),
    operator_secret: toHex32(operatorSecret),
    pending_root: toHex32(pendingRoot),
    final_root: toHex32(finalRoot),
    alias_root: toHex32(aliasRoot),
    raffle_id: toHex32(raffleId),
    n_participants: toHex32(n),
    tree_depth: toHex32(treeDepth),
    operator_secret_hash: toHex32(operatorSecretHash),
    vrf_output: toHex32(vrfOutput),
  };

  process.stderr.write("Generating witness...\n");
  const { witness } = await noir.execute(circuitInputs);

  // 4. Write witness to temp file and use bb CLI for proof generation
  //    (bb.js WASM can't handle CHUNK=256 circuits)
  const tmpDir = resolve(__dirname, "../circuits/shuffle/target/tmp_prove");
  mkdirSync(tmpDir, { recursive: true });
  const witnessPath = resolve(tmpDir, "witness.gz");

  // The witness from Noir.js is a Uint8Array in gzipped format
  writeFileSync(witnessPath, Buffer.from(witness));

  process.stderr.write("Generating proof with bb CLI (keccak mode)...\n");
  const proofDir = resolve(tmpDir, "proof_out");

  try {
    execSync(
      `bb prove -s ultra_honk --oracle_hash keccak -b "${artifactPath}" -w "${witnessPath}" -o "${proofDir}"`,
      { stdio: ["pipe", "pipe", "pipe"], timeout: 120000 }
    );
  } catch (err) {
    process.stderr.write(`bb prove failed: ${err.stderr?.toString() || err.message}\n`);
    process.exit(1);
  }

  // 5. Read proof and public inputs
  const proofBytes = readFileSync(resolve(proofDir, "proof"));
  const publicInputsBytes = readFileSync(resolve(proofDir, "public_inputs"));

  // Public inputs are 32-byte field elements concatenated
  const publicInputs = [];
  for (let i = 0; i < publicInputsBytes.length; i += 32) {
    const chunk = publicInputsBytes.slice(i, i + 32);
    publicInputs.push("0x" + chunk.toString("hex"));
  }

  process.stderr.write(`Proof generated. Size: ${proofBytes.length} bytes, ${publicInputs.length} public inputs\n`);

  const winnerIndex = Number(vrfOutput % BigInt(n));

  const result = {
    proof: "0x" + proofBytes.toString("hex"),
    publicInputs,
    final_commitments: finalCommitments.slice(0, n).map(c => toHex32(c)),
    winner_index: winnerIndex,
    operator_secret_hash: toHex32(operatorSecretHash),
  };

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main().catch((e) => {
  process.stderr.write("Shuffle proof failed: " + e.message + "\n" + e.stack + "\n");
  process.exit(1);
});
