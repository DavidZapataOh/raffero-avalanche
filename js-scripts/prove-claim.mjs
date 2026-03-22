#!/usr/bin/env node
/**
 * prove-claim.mjs
 *
 * End-to-end proof generation for the raffle claim circuit.
 * Called via Foundry FFI.
 *
 * Usage:
 *   node prove-claim.mjs <inputs-json-path>
 *
 * Input JSON format:
 *   {
 *     "secret": "0x...",
 *     "nullifier": "0x...",
 *     "siblings": ["0x...", ...],      // 32 elements
 *     "path_indices": ["0", "1", ...], // 32 elements (strings)
 *     "recipient": "0x...",
 *     "root": "0x...",
 *     "nullifier_hash": "0x...",
 *     "recipient_binding": "0x...",
 *     "raffle_id": "0x...",
 *     "winner_index": "0",
 *     "tree_depth": "4"
 *   }
 *
 * Output (stdout, single line):
 *   ABI-encoded bytes: abi.encode(bytes proof, bytes32[] publicInputs)
 *   The Foundry test decodes this with abi.decode(result, (bytes, bytes32[]))
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function toHex32(val) {
  if (typeof val === "string" && val.startsWith("0x")) return val;
  return "0x" + BigInt(val).toString(16).padStart(64, "0");
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    process.stderr.write("Usage: node prove-claim.mjs <inputs.json>\n");
    process.exit(1);
  }

  const inputs = JSON.parse(readFileSync(resolve(inputPath), "utf8"));

  // Load compiled circuit
  const artifactPath = resolve(__dirname, "../circuits/raffle/target/raffle.json");
  let circuit;
  try {
    circuit = JSON.parse(readFileSync(artifactPath, "utf8"));
  } catch {
    process.stderr.write("Circuit artifact not found. Run: cd circuits/raffle && nargo build\n");
    process.exit(1);
  }

  const { Noir } = await import("@noir-lang/noir_js");
  const { UltraHonkBackend } = await import("@aztec/bb.js");

  const backend = new UltraHonkBackend(circuit.bytecode, { threads: 1 });
  const noir = new Noir(circuit);

  // Execute witness generation
  const { witness } = await noir.execute(inputs);

  // Generate proof (keccak mode for EVM verification)
  const { proof, publicInputs } = await backend.generateProof(witness, { keccak: true });

  // ABI-encode the output so Foundry can decode it
  // Format: concatenate proof length (32 bytes) + proof + publicInputs count (32 bytes) + publicInputs
  // But simpler: just output hex proof and public inputs as separate lines
  // Foundry FFI returns the raw stdout as bytes

  // Output format for easy FFI parsing:
  // Line 1: proof as hex
  // Line 2: each public input as 0x-padded hex, comma separated
  const proofHex = "0x" + Buffer.from(proof).toString("hex");
  const pubHex = publicInputs.map(p => toHex32(p)).join(",");

  process.stdout.write(proofHex + "\n" + pubHex + "\n");

  await backend.destroy();
}

main().catch((e) => {
  process.stderr.write("Proof generation failed: " + e.message + "\n");
  process.exit(1);
});
