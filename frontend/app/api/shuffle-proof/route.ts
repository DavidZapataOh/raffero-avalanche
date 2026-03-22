import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/shuffle-proof
 *
 * Generates a shuffle proof using the bb CLI via js-scripts/generate-shuffle-proof.mjs.
 * Only works when self-hosted (bb CLI must be available on the server).
 */
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  // Dynamic imports to avoid Turbopack static analysis
  const { execSync } = await import("child_process");
  const { writeFileSync, unlinkSync } = await import("fs");
  const { randomBytes } = await import("crypto");

  try {
    const body = await request.json();

    const BN254 = BigInt("0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001");
    const secretRaw = BigInt("0x" + randomBytes(32).toString("hex")) % BN254;
    const operatorSecret = "0x" + secretRaw.toString(16).padStart(64, "0");

    const inputData = {
      commitments: body.commitments,
      operator_secret: operatorSecret,
      vrf_output: body.vrf_output,
      raffle_id: body.raffle_id,
      tree_depth: body.tree_depth,
    };

    const inputFile = `/tmp/shuffle_input_${Date.now()}.json`;
    writeFileSync(inputFile, JSON.stringify(inputData));

    // Build the script path dynamically to avoid Turbopack resolution
    const cwd = process.cwd();
    const scriptDir = [cwd, "..", "js-scripts"].join("/");
    const scriptName = "generate-shuffle-proof.mjs";

    const result = execSync(
      `node "${scriptDir}/${scriptName}" "${inputFile}"`,
      { timeout: 120000, maxBuffer: 10 * 1024 * 1024, encoding: "utf-8" }
    );

    try { unlinkSync(inputFile); } catch { /* ignore */ }

    const parsed = JSON.parse(result);

    return NextResponse.json({
      proof: parsed.proof,
      publicInputs: parsed.publicInputs,
      operator_secret_hash: parsed.operator_secret_hash,
      winner_index: parsed.winner_index,
      operator_secret: operatorSecret,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Shuffle proof generation failed";
    console.error("Shuffle proof API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
