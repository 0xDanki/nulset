import { execSync } from "child_process";
import { existsSync } from "fs";
import { witnessJsonToToml } from "./toml_converter.js";

// Wrapper for Noir proof generation
// Converts witness JSON -> Prover.toml -> nargo execute -> nargo prove

export function generateProof(witnessJsonPath: string, proofName: string): void {
  console.log("\n=== Generating Proof ===\n");
  
  // Step 1: Validate inputs
  if (!existsSync(witnessJsonPath)) {
    throw new Error(`Witness file not found: ${witnessJsonPath}`);
  }
  
  if (!existsSync("../circuits/Nargo.toml")) {
    throw new Error("Circuit not found. Run from scripts/ directory.");
  }
  
  console.log(`[Prover] Witness: ${witnessJsonPath}`);
  console.log(`[Prover] Proof name: ${proofName}\n`);
  
  // Step 2: Convert witness JSON to Prover.toml
  const proverTomlPath = `../circuits/Prover.toml`;
  witnessJsonToToml(witnessJsonPath, proverTomlPath);
  
  // Step 3: Execute circuit to generate witness
  console.log("\n[Prover] Executing circuit...");
  try {
    const executeCmd = `cd ../circuits && nargo execute ${proofName}`;
    execSync(executeCmd, { stdio: "inherit" });
    console.log(`[Prover] ✓ Witness generated: ${proofName}.gz`);
  } catch (err) {
    console.error("[Prover] ✗ Execution failed");
    throw err;
  }
  
  // Step 4: Generate proof
  console.log("\n[Prover] Generating proof...");
  try {
    const proveCmd = `cd ../circuits && nargo prove ${proofName}`;
    execSync(proveCmd, { stdio: "inherit" });
    console.log(`[Prover] ✓ Proof generated successfully`);
  } catch (err) {
    console.error("[Prover] ✗ Proof generation failed");
    throw err;
  }
  
  console.log("\n=== Proof Generation Complete ===");
  console.log(`Proof artifact: circuits/proofs/${proofName}.proof`);
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error("Usage: tsx src/prove.ts <witness.json> <proof_name>");
    console.error("Example: tsx src/prove.ts ../circuits/witness_good.json good_user");
    process.exit(1);
  }
  
  try {
    generateProof(args[0], args[1]);
  } catch (err) {
    console.error(`\n[Prover] Fatal error: ${err}`);
    process.exit(1);
  }
}
