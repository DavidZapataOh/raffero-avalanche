#!/usr/bin/env node
/**
 * compute-commitment.mjs
 *
 * Generates a ticket commitment for purchasing a raffle ticket.
 * If secret/nullifier are not provided, generates cryptographically random ones.
 *
 * Usage:
 *   node compute-commitment.mjs [--secret 0x...] [--nullifier 0x...]
 *
 * Output (stdout JSON):
 *   {"secret":"0x...","nullifier":"0x...","commitment":"0x..."}
 */

import { BarretenbergSync, Fr } from "@aztec/bb.js";
import crypto from "crypto";

const DOMAIN_COMMIT = 0x434f4d4d49545f5631n; // "COMMIT_V1"
const BN254_PRIME = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001n;

function parseArgs() {
  const args = process.argv.slice(2);
  let secret, nullifier;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--secret" && args[i + 1]) secret = BigInt(args[++i]);
    if (args[i] === "--nullifier" && args[i + 1]) nullifier = BigInt(args[++i]);
  }
  if (!secret) {
    secret = BigInt("0x" + crypto.randomBytes(32).toString("hex")) % BN254_PRIME;
  }
  if (!nullifier) {
    nullifier = BigInt("0x" + crypto.randomBytes(32).toString("hex")) % BN254_PRIME;
  }
  return { secret, nullifier };
}

function toHex32(val) {
  return "0x" + BigInt(val).toString(16).padStart(64, "0");
}

async function main() {
  const { secret, nullifier } = parseArgs();
  const api = await BarretenbergSync.initSingleton();

  const commitment = BigInt(
    api.poseidon2Hash([new Fr(DOMAIN_COMMIT), new Fr(secret), new Fr(nullifier)]).toString()
  );

  const result = {
    secret: toHex32(secret),
    nullifier: toHex32(nullifier),
    commitment: toHex32(commitment),
  };

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main().catch((e) => {
  process.stderr.write("Error: " + e.message + "\n");
  process.exit(1);
});
