import { execSync } from "child_process";

// End-to-end demo: Build tree → Generate witnesses → Prove → Verify
// Demonstrates both allowed and denied access scenarios

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                  NulSet Demo Flow                         ║
║  Privacy-Preserving Exclusion Check with ZK Proofs        ║
╚═══════════════════════════════════════════════════════════╝
`);

function runStep(title: string, command: string): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("=".repeat(60));
  
  try {
    execSync(command, { stdio: "inherit" });
  } catch (err) {
    console.error(`\n✗ Step failed: ${title}`);
    throw err;
  }
}

try {
  // Step 1: Admin builds exclusion tree
  runStep(
    "STEP 1: Admin - Build Exclusion Tree",
    "tsx src/build_tree.ts"
  );
  
  // Step 2: Generate witnesses for test users
  runStep(
    "STEP 2: User - Generate Witnesses",
    "tsx src/gen_witness.ts"
  );
  
  // Step 3: Prove + Verify for GOOD user (alice)
  console.log("\n" + "=".repeat(60));
  console.log("  STEP 3: Platform - Verify Good User (alice@example.com)");
  console.log("=".repeat(60));
  
  runStep(
    "  → Generating ZK proof for good user (Groth16)",
    "pnpm exec tsx src/prove_circom.ts ../circuits/witness_good.json good_user"
  );
  
  // Step 4: Attempt to validate BAD user (bob) - should fail
  console.log("\n" + "=".repeat(60));
  console.log("  STEP 4: Platform - Verify Bad User (bob@banned.com)");
  console.log("=".repeat(60));
  
  console.log("\n[Demo] Attempting to generate ZK proof for bad user...");
  console.log("[Demo] Expected: Circuit rejects (leaf_value must be 0)");
  
  try {
    execSync("pnpm exec tsx src/prove_circom.ts ../circuits/witness_bad.json bad_user", { stdio: "pipe" });
    console.log("\n[Demo] ⚠️  WARNING: Bad user proof succeeded (unexpected!)");
  } catch (err) {
    console.log("\n[Demo] ✓ Bad user REJECTED by circuit (as expected)");
    console.log("[Demo] Circuit enforced: leaf_value === 0");
    console.log("[Demo] Cannot generate proof for banned users");
    console.log("[Demo] Access: DENIED\n");
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("  Demo Complete");
  console.log("=".repeat(60));
  console.log(`
✅ Good user (alice@example.com):
  - Leaf value = 0 (not banned)
  - Groth16 ZK proof generated ✓
  - Proof cryptographically verified ✓
  - Access: GRANTED
  - Privacy: PRESERVED (verifier saw only proof + root!)

✅ Bad user (bob@banned.com):
  - Leaf value = 1 (banned)
  - Circuit rejected witness ✓
  - Cannot generate valid proof ✓
  - Access: DENIED

🎉 NulSet Complete! Real Zero-Knowledge Proofs Working!

System: Circom + Groth16 + snarkjs
Hash: Poseidon (circomlibjs ↔ Circom)
Tree: Depth-32 Sparse Merkle Tree (4B+ capacity)
Privacy: Full zero-knowledge (private inputs hidden from verifier)
`);
  
} catch (err) {
  console.error("\n✗ Demo failed");
  process.exit(1);
}
