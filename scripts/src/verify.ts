import { execSync } from "child_process";
import { existsSync } from "fs";

// Wrapper for proof verification using Barretenberg
// Returns: true (proof valid) or false (proof invalid)

export function verifyProof(proofName: string): boolean {
  console.log("\n=== Verifying Proof ===\n");
  
  // Step 1: Validate inputs
  if (!existsSync("../circuits/Nargo.toml")) {
    throw new Error("Circuit not found. Run from scripts/ directory.");
  }
  
  const proofPath = `../circuits/target/proof`;
  const vkPath = `../circuits/target/vk`;
  
  if (!existsSync(proofPath)) {
    throw new Error(`Proof not found: ${proofPath}. Run prove first.`);
  }
  
  if (!existsSync(vkPath)) {
    throw new Error(`Verification key not found: ${vkPath}. Run prove first.`);
  }
  
  console.log(`[Verifier] Proof: target/proof`);
  console.log(`[Verifier] Verifying with Barretenberg...\n`);
  
  // Step 2: Verify proof using bb
  try {
    const verifyCmd = `cd ../circuits && bb verify -p ./target/proof -k ./target/vk`;
    execSync(verifyCmd, { stdio: "inherit" });
    
    console.log("\n[Verifier] ✓ PROOF VALID");
    console.log("[Verifier] Access: GRANTED\n");
    return true;
    
  } catch (err) {
    console.log("\n[Verifier] ✗ PROOF INVALID");
    console.log("[Verifier] Access: DENIED\n");
    return false;
  }
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
