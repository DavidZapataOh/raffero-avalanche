// ─────────────────────────────────────────────────────────────────────────────
// Client-side incremental Merkle tree
// ─────────────────────────────────────────────────────────────────────────────
//
// Mirrors the on-chain IncrementalMerkleTree used by PrivateRaffle.sol so that
// the frontend can reconstruct roots and generate sibling paths for ZK proofs.
// ─────────────────────────────────────────────────────────────────────────────

import { poseidon2 } from "./poseidon";
import { ZERO_VALUE } from "./constants";

export class MerkleTree {
  /** Number of levels (tree capacity = 2^levels). */
  readonly levels: number;

  /** Current leaves (padded to capacity with zero values). */
  private leaves: bigint[];

  /** Number of leaves inserted so far. */
  private leafCount: number;

  /** Cached layer arrays: layers[0] = leaves, layers[levels] = [root]. */
  private layers: bigint[][] = [];

  /** Pre-computed zero hashes for each level. zeroHashes[0] = ZERO_VALUE. */
  private zeroHashes: bigint[] = [];

  /** Whether the internal layer cache is stale. */
  private dirty = true;

  constructor(levels: number, leaves: bigint[] = []) {
    this.levels = levels;
    const capacity = 1 << levels;

    if (leaves.length > capacity) {
      throw new Error(
        `Too many leaves: got ${leaves.length}, capacity is ${capacity}`,
      );
    }

    this.leaves = new Array<bigint>(capacity).fill(ZERO_VALUE);
    for (let i = 0; i < leaves.length; i++) {
      this.leaves[i] = leaves[i];
    }
    this.leafCount = leaves.length;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  /** Insert a new leaf at the next available position. */
  insert(leaf: bigint): void {
    const capacity = 1 << this.levels;
    if (this.leafCount >= capacity) {
      throw new Error("Merkle tree is full");
    }
    this.leaves[this.leafCount] = leaf;
    this.leafCount++;
    this.dirty = true;
  }

  /** Return the current Merkle root. */
  async getRoot(): Promise<bigint> {
    await this.ensureBuilt();
    return this.layers[this.levels][0];
  }

  /**
   * Return the sibling path and direction bits for the leaf at `index`.
   *
   * @returns siblings     — sibling hashes from leaf level to just below root.
   * @returns pathIndices  — 0 if the node is a left child, 1 if right.
   */
  async getProof(index: number): Promise<{
    siblings: bigint[];
    pathIndices: number[];
  }> {
    if (index < 0 || index >= this.leafCount) {
      throw new Error(`Leaf index ${index} out of range [0, ${this.leafCount})`);
    }

    await this.ensureBuilt();

    const siblings: bigint[] = [];
    const pathIndices: number[] = [];

    let idx = index;
    for (let level = 0; level < this.levels; level++) {
      const isRight = idx & 1;
      const siblingIdx = isRight ? idx - 1 : idx + 1;

      pathIndices.push(isRight);
      siblings.push(this.layers[level][siblingIdx]);

      idx >>= 1;
    }

    return { siblings, pathIndices };
  }

  /** Number of leaves that have been inserted. */
  get size(): number {
    return this.leafCount;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internals
  // ─────────────────────────────────────────────────────────────────────────

  private async ensureBuilt(): Promise<void> {
    if (!this.dirty && this.layers.length > 0) return;
    await this.computeZeroHashes();
    await this.buildTree();
    this.dirty = false;
  }

  /** Pre-compute the zero hash at each level. */
  private async computeZeroHashes(): Promise<void> {
    if (this.zeroHashes.length === this.levels + 1) return;

    this.zeroHashes = [ZERO_VALUE];
    for (let i = 1; i <= this.levels; i++) {
      this.zeroHashes.push(await poseidon2(this.zeroHashes[i - 1], this.zeroHashes[i - 1]));
    }
  }

  /** Rebuild every layer from the current leaves. */
  private async buildTree(): Promise<void> {
    const capacity = 1 << this.levels;

    // Level 0: leaves (padded)
    this.layers = [this.leaves.slice(0, capacity)];

    for (let level = 0; level < this.levels; level++) {
      const currentLayer = this.layers[level];
      const nextLayer: bigint[] = [];
      const pairCount = currentLayer.length >> 1;

      for (let i = 0; i < pairCount; i++) {
        const left = currentLayer[2 * i];
        const right = currentLayer[2 * i + 1];
        nextLayer.push(await poseidon2(left, right));
      }

      this.layers.push(nextLayer);
    }
  }
}
