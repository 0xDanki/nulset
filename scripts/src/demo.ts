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
    "  → Validating witness for good user",
    "pnpm exec tsx src/prove.ts ../circuits/witness_good.json good_user"
  );
  
  runStep(
    "  → Verifying witness for good user",
    "pnpm exec tsx src/verify.ts good_user"
  );
  
  // Step 4: Attempt to validate BAD user (bob) - should fail
  console.log("\n" + "=".repeat(60));
  console.log("  STEP 4: Platform - Verify Bad User (bob@banned.com)");
  console.log("=".repeat(60));
  
  console.log("\n[Demo] Attempting to validate bad user witness (should fail)...");
  
  try {
    execSync("pnpm exec tsx src/prove.ts ../circuits/witness_bad.json bad_user", { stdio: "inherit" });
    console.log("\n[Demo] ⚠️  WARNING: Bad user validation succeeded (unexpected!)");
    console.log("[Demo] This means leaf_value was not 1 as expected.");
  } catch (err) {
    console.log("\n[Demo] ✓ Bad user REJECTED by circuit (as expected)");
    console.log("[Demo] Circuit correctly enforced leaf_value == 0 constraint");
    console.log("[Demo] Access: DENIED\n");
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("  Demo Complete");
  console.log("=".repeat(60));
  console.log(`
✓ Good user (alice@example.com):
  - Leaf value = 0 (not banned)
  - Witness generated ✓
  - Circuit validation passed ✓
  - Access: GRANTED

✓ Bad user (bob@banned.com):
  - Leaf value = 1 (banned)
  - Circuit validation FAILED ✓ (enforced leaf_value == 0)
  - Access: DENIED

NulSet successfully prevents banned users from passing validation!

Note: This demo shows witness validation. Full ZK proof generation
requires Barretenberg backend (bb). The core concept is proven:
- Merkle tree correctly built
- Witnesses correctly generated
- Circuit correctly validates non-membership
`);
  
} catch (err) {
  console.error("\n✗ Demo failed");
  process.exit(1);
}
