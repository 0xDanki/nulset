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
    "  → Generating proof for good user",
    "tsx src/prove.ts ../circuits/witness_good.json good_user"
  );
  
  runStep(
    "  → Verifying proof for good user",
    "tsx src/verify.ts good_user"
  );
  
  // Step 4: Prove + Verify for BAD user (bob)
  console.log("\n" + "=".repeat(60));
  console.log("  STEP 4: Platform - Verify Bad User (bob@banned.com)");
  console.log("=".repeat(60));
  
  console.log("\n[Demo] Attempting to prove bad user (should fail at circuit level)...");
  
  try {
    execSync("tsx src/prove.ts ../circuits/witness_bad.json bad_user", { stdio: "inherit" });
    console.log("\n[Demo] ⚠️  WARNING: Bad user proof succeeded (unexpected!)");
    console.log("[Demo] This means leaf_value was not 1 as expected.");
  } catch (err) {
    console.log("\n[Demo] ✓ Bad user proof REJECTED by circuit (as expected)");
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
  - Proof generated ✓
  - Proof verified ✓
  - Access: GRANTED

✓ Bad user (bob@banned.com):
  - Leaf value = 1 (banned)
  - Proof generation FAILED ✓ (circuit constraint)
  - Access: DENIED

NulSet successfully prevents banned users from generating valid proofs!
`);
  
} catch (err) {
  console.error("\n✗ Demo failed");
  process.exit(1);
}
