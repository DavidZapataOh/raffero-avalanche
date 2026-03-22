#!/usr/bin/env node
/**
 * setup-claim-test.mjs
 *
 * Generates all data needed for the Forge integration test (simple path).
 * Simulates: create raffle → deposit tickets → close+finalize simple → claim
 *
 * The on-chain tree stores entry_hashes, but the claim circuit verifies
 * against raw commitments. This script computes both roots.
 */

import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend, BarretenbergSync, Fr } from "@aztec/bb.js";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Domain separation constants (must match Raffle.sol & circuits)
const DOMAIN_COMMIT = 0x434f4d4d49545f5631n;
const DOMAIN_NULL = 0x4e554c4c5f5631n;
const DOMAIN_BIND = 0x42494e445f5631n;
const DOMAIN_ENTRY = 0x454e5452595f5631n;

// Zero leaf: keccak256("raffero") % BN254_PRIME
const ZERO_LEAF = 0x1d028cb78671d570e29d04748982b4d86bf5d94d10b081fc71ab63f5f319a144n;

let api;

function poseidon2(inputs) {
  return BigInt(api.poseidon2Hash(inputs.map(v => new Fr(BigInt(v)))).toString());
}
function hash2(a, b) { return poseidon2([a, b]); }
function hash3(a, b, c) { return poseidon2([a, b, c]); }
function toHex32(val) { return "0x" + BigInt(val).toString(16).padStart(64, "0"); }

/**
 * Incremental Merkle tree matching IncrementalMerkleTree.sol exactly.
 * zeros(0) = ZERO_LEAF, zeros(i) = H(zeros(i-1), zeros(i-1))
 */
class IncrementalMerkleTree {
  constructor(depth) {
    this.depth = depth;
    this.maxSize = 1 << depth;
    this.nextIndex = 0;

    this.zeros = [ZERO_LEAF];
    for (let i = 1; i <= depth; i++) {
      this.zeros.push(hash2(this.zeros[i - 1], this.zeros[i - 1]));
    }

    this.cachedSubtrees = new Array(depth);
    for (let i = 0; i < depth; i++) this.cachedSubtrees[i] = this.zeros[i];

    this.root = this.zeros[depth];
    this.nodes = [];
    for (let l = 0; l <= depth; l++) this.nodes.push(new Map());
  }

  insert(leaf) {
    const idx = this.nextIndex;
    this.nodes[0].set(idx, leaf);

    let currentIndex = idx;
    let currentHash = leaf;

    for (let i = 0; i < this.depth; i++) {
      let left, right;
      if (currentIndex % 2 === 0) {
        left = currentHash;
        right = this.zeros[i];
        this.cachedSubtrees[i] = currentHash;
      } else {
        left = this.cachedSubtrees[i];
        right = currentHash;
      }
      currentHash = hash2(left, right);
      currentIndex = Math.floor(currentIndex / 2);
      this.nodes[i + 1].set(currentIndex, currentHash);
    }

    this.root = currentHash;
    this.nextIndex++;
    return idx;
  }

  getSiblings(leafIndex) {
    const siblings = [];
    const pathIndices = [];
    let nodeIdx = leafIndex;
    for (let level = 0; level < this.depth; level++) {
      const sibIdx = nodeIdx ^ 1;
      const sibValue = this.nodes[level].has(sibIdx)
        ? this.nodes[level].get(sibIdx)
        : this.zeros[level];
      siblings.push(sibValue);
      pathIndices.push(nodeIdx % 2);
      nodeIdx >>= 1;
    }
    return { siblings, pathIndices };
  }
}

/**
 * Build a full Merkle tree from leaves (for commitment-only root).
 * Pads with ZERO_LEAF. Uses hash2 for all nodes.
 */
function computeFullMerkleRoot(leaves, n, depth) {
  const maxSize = 1 << depth;
  const padded = new Array(maxSize);
  for (let i = 0; i < maxSize; i++) {
    padded[i] = i < n ? leaves[i] : ZERO_LEAF;
  }
  let layer = padded;
  for (let level = 0; level < depth; level++) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      next.push(hash2(layer[i], layer[i + 1]));
    }
    layer = next;
  }
  return layer[0];
}

async function main() {
  api = await BarretenbergSync.initSingleton();

  // ── Test Parameters ──────────────────────────────────────────────────
  const TREE_DEPTH = 4;
  const RAFFLE_ID = 1n;
  const TICKET_PRICE = 100000000000000000n; // 0.1 ether

  const participants = [
    { secret: 111n, nullifier: 222n },
    { secret: 333n, nullifier: 444n },
    { secret: 555n, nullifier: 666n },
  ];

  const winnerIdx = 0;
  const recipient = 0xBEEFn;

  // ── Compute commitments ──────────────────────────────────────────────
  const commitments = participants.map(p => hash3(DOMAIN_COMMIT, p.secret, p.nullifier));

  // ── Compute entry_hashes (what the contract inserts into the tree) ───
  const entryHashes = commitments.map((c, i) => hash3(DOMAIN_ENTRY, c, BigInt(i)));

  // ── Build incremental Merkle tree from entry_hashes ──────────────────
  const tree = new IncrementalMerkleTree(TREE_DEPTH);
  for (const eh of entryHashes) {
    tree.insert(eh);
  }
  const entryHashRoot = tree.root;
  process.stderr.write(`Entry-hash root: ${toHex32(entryHashRoot)}\n`);

  // ── Compute commitment-only root (for closeAndFinalizeSimple) ────────
  // This is what the claim circuit verifies against.
  // For the simple path (no shuffle), commitments stay in original order.
  const commitmentRoot = computeFullMerkleRoot(commitments, commitments.length, TREE_DEPTH);
  process.stderr.write(`Commitment root: ${toHex32(commitmentRoot)}\n`);

  // ── Build Merkle proof for winner in commitment tree ─────────────────
  // The claim circuit verifies against commitmentRoot (root of raw commitments)
  const commitTree = new IncrementalMerkleTree(TREE_DEPTH);
  for (const c of commitments) {
    commitTree.insert(c);
  }
  const { siblings, pathIndices } = commitTree.getSiblings(winnerIdx);

  // Pad to MAX_DEPTH=32
  while (siblings.length < 32) siblings.push(0n);
  while (pathIndices.length < 32) pathIndices.push(0);

  // Verify locally
  const winner = participants[winnerIdx];
  const nullifierHash = hash3(DOMAIN_NULL, winner.nullifier, RAFFLE_ID);
  const recipientBinding = hash3(DOMAIN_BIND, nullifierHash, recipient);

  // The claim circuit expects `root` = root of the commitment tree (incremental)
  const claimRoot = commitTree.root;
  process.stderr.write(`Claim root (incremental commit tree): ${toHex32(claimRoot)}\n`);

  // Local Merkle proof verification
  let currentHash = commitments[winnerIdx];
  for (let i = 0; i < TREE_DEPTH; i++) {
    const sib = siblings[i];
    const isRight = pathIndices[i];
    const left = isRight === 0 ? currentHash : sib;
    const right = isRight === 0 ? sib : currentHash;
    currentHash = poseidon2([left, right]);
  }
  if (currentHash !== claimRoot) {
    process.stderr.write(`Merkle proof FAILED: ${toHex32(currentHash)} != ${toHex32(claimRoot)}\n`);
    process.exit(1);
  }
  process.stderr.write("Local Merkle proof verified.\n");

  // ── Generate ZK proof ────────────────────────────────────────────────
  const artifactPath = resolve(__dirname, "../circuits/raffle/target/raffle.json");
  const circuit = JSON.parse(readFileSync(artifactPath, "utf8"));
  const noir = new Noir(circuit);

  const circuitInputs = {
    secret: toHex32(winner.secret),
    nullifier: toHex32(winner.nullifier),
    siblings: siblings.map(s => toHex32(s)),
    path_indices: pathIndices.map(p => toHex32(p)),
    recipient: toHex32(recipient),
    root: toHex32(claimRoot),
    nullifier_hash: toHex32(nullifierHash),
    recipient_binding: toHex32(recipientBinding),
    raffle_id: toHex32(RAFFLE_ID),
    winner_index: toHex32(winnerIdx),
    tree_depth: toHex32(TREE_DEPTH),
  };

  process.stderr.write("Generating witness...\n");
  const { witness } = await noir.execute(circuitInputs);

  process.stderr.write("Generating proof (keccak mode for EVM)...\n");
  const backend = new UltraHonkBackend(circuit.bytecode, { threads: 1 });
  const proofData = await backend.generateProof(witness, { keccak: true });
  process.stderr.write(`Proof generated. Size: ${proofData.proof.length} bytes\n`);

  // ── Write fixture JSON ────────────────────────────────────────────────
  const fixture = {
    treeDepth: TREE_DEPTH,
    raffleId: toHex32(RAFFLE_ID),
    ticketPrice: toHex32(TICKET_PRICE),
    recipient: toHex32(recipient),
    winnerIndex: winnerIdx,
    commitments: commitments.map(c => toHex32(c)),
    entryHashRoot: toHex32(entryHashRoot),
    commitmentRoot: toHex32(claimRoot),
    proof: "0x" + Buffer.from(proofData.proof).toString("hex"),
    publicInputs: proofData.publicInputs,
  };

  const fixturePath = resolve(__dirname, "../test/fixtures/claim-test-data.json");
  writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));
  process.stderr.write(`Fixture written to ${fixturePath}\n`);
  process.stdout.write("ok\n");

  await backend.destroy();
}

main().catch((e) => {
  process.stderr.write("Setup failed: " + e.message + "\n" + e.stack + "\n");
  process.exit(1);
});
