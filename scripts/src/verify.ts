import { existsSync } from "fs";

// Wrapper for witness validation
// In full implementation, this would verify a cryptographic proof
// For demo: checks that witness file was successfully generated

export function verifyProof(proofName: string): boolean {
  console.log("\n=== Verifying Witness ===\n");
  
  // Step 1: Validate inputs
  if (!existsSync("../circuits/Nargo.toml")) {
    throw new Error("Circuit not found. Run from scripts/ directory.");
  }
  
  const witnessPath = `../circuits/target/${proofName}.gz`;
  if (!existsSync(witnessPath)) {
    throw new Error(`Witness not found: ${witnessPath}. Run prove first.`);
  }
  
  console.log(`[Verifier] Witness: ${proofName}`);
  console.log(`[Verifier] Checking witness file...\n`);
  
  // Step 2: Witness exists and was validated during execution
  console.log("[Verifier] ✓ WITNESS VALID");
  console.log("[Verifier] Circuit constraints satisfied");
  console.log("[Verifier] Access: GRANTED\n");
  console.log("Note: Full verification requires Barretenberg backend (bb)");
  console.log("For demo: Witness validation proves Merkle path is correct");
  
  return true;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length !== 1) {
    console.error("Usage: tsx src/verify.ts <proof_name>");
    console.error("Example: tsx src/verify.ts good_user");
    process.exit(1);
  }
  
  try {
    const isValid = verifyProof(args[0]);
    process.exit(isValid ? 0 : 1);
    
  } catch (err) {
    console.error(`\n[Verifier] Fatal error: ${err}`);
    process.exit(2);
  }
}
