#!/usr/bin/env node
/**
 * build-merkle-proof.mjs
 *
 * Given a list of leaves and a target leaf index, computes the Merkle proof
 * (siblings + path_indices) needed for the claim circuit.
 *
 * Usage:
 *   node build-merkle-proof.mjs <inputs.json>
 *
 * Input JSON:
 *   {
 *     "leaves": ["0x...", ...],
 *     "leaf_index": 0,
 *     "tree_depth": 4,
 *     "n_participants": 3
 *   }
 *
 * Output (stdout JSON):
 *   {"siblings":["0x...",...], "path_indices":[0,1,...], "root":"0x..."}
 */

import { BarretenbergSync, Fr } from "@aztec/bb.js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Must match the circuit's zero_at(0) and IncrementalMerkleTree.sol zeros(0)
const ZERO_LEAF = 0x1d028cb78671d570e29d04748982b4d86bf5d94d10b081fc71ab63f5f319a144n;

let api;

function hash2(a, b) {
  return BigInt(api.poseidon2Hash([new Fr(BigInt(a)), new Fr(BigInt(b))]).toString());
}

function toHex32(val) {
  return "0x" + BigInt(val).toString(16).padStart(64, "0");
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    process.stderr.write("Usage: node build-merkle-proof.mjs <inputs.json>\n");
    process.exit(1);
  }

  api = await BarretenbergSync.initSingleton();

  const input = JSON.parse(readFileSync(resolve(inputPath), "utf8"));
  const { leaf_index, tree_depth, n_participants } = input;
  const leaves = input.leaves.map(l => BigInt(l));

  const maxSize = 1 << tree_depth;

  // Compute zeros: zeros[0] = ZERO_LEAF, zeros[i] = H(zeros[i-1], zeros[i-1])
  const zeros = [ZERO_LEAF];
  for (let i = 1; i <= tree_depth; i++) {
    zeros.push(hash2(zeros[i - 1], zeros[i - 1]));
  }

  // Pad leaves to full tree size with zero_at(0)
  const paddedLeaves = new Array(maxSize);
  for (let i = 0; i < maxSize; i++) {
    paddedLeaves[i] = i < n_participants ? leaves[i] : ZERO_LEAF;
  }

  // Build full tree level by level
  const layers = [paddedLeaves];
  for (let level = 0; level < tree_depth; level++) {
    const prev = layers[level];
    const next = [];
    for (let i = 0; i < prev.length; i += 2) {
      next.push(hash2(prev[i], prev[i + 1]));
    }
    layers.push(next);
  }

  const root = layers[tree_depth][0];

  // Extract siblings and path indices
  const siblings = [];
  const pathIndices = [];
  let nodeIdx = leaf_index;
  for (let level = 0; level < tree_depth; level++) {
    const sibIdx = nodeIdx ^ 1;
    siblings.push(layers[level][sibIdx]);
    pathIndices.push(nodeIdx % 2);
    nodeIdx >>= 1;
  }

  // Pad to MAX_DEPTH=32
  while (siblings.length < 32) siblings.push(0n);
  while (pathIndices.length < 32) pathIndices.push(0);

  const result = {
    siblings: siblings.map(s => toHex32(s)),
    path_indices: pathIndices,
    root: toHex32(root),
  };

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main().catch((e) => {
  process.stderr.write("Error: " + e.message + "\n" + e.stack + "\n");
  process.exit(1);
});
