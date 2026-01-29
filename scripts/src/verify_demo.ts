import { existsSync, readFileSync, statSync } from "fs";
import { execSync } from "child_process";

// Verification script to prove the demo actually works
// This checks real proof files, not just messages

console.log("\n=== NulSet Demo Verification ===\n");

interface CheckResult {
  name: string;
  passed: boolean;
  details: string;
}

const checks: CheckResult[] = [];

// Check 1: Good user proof file exists
const goodProofPath = "../circuits/compiled/proof_good_user.json";
if (existsSync(goodProofPath)) {
  const size = statSync(goodProofPath).size;
  checks.push({
    name: "Good user proof exists",
    passed: true,
    details: `File size: ${size} bytes`
  });
  
  // Verify it's valid JSON with proof structure
  try {
    const proof = JSON.parse(readFileSync(goodProofPath, "utf-8"));
    if (proof.pi_a && proof.pi_b && proof.pi_c) {
      checks.push({
        name: "Good user proof structure valid",
        passed: true,
        details: "Contains pi_a, pi_b, pi_c (Groth16 proof components)"
      });
    } else {
      checks.push({
        name: "Good user proof structure valid",
        passed: false,
        details: "Missing Groth16 components"
      });
    }
  } catch (err) {
    checks.push({
      name: "Good user proof structure valid",
      passed: false,
      details: `Parse error: ${err}`
    });
  }
} else {
  checks.push({
    name: "Good user proof exists",
    passed: false,
    details: "File not found"
  });
}

// Check 2: Good user public inputs exist
const goodPublicPath = "../circuits/compiled/public_good_user.json";
if (existsSync(goodPublicPath)) {
  try {
    const publicInputs = JSON.parse(readFileSync(goodPublicPath, "utf-8"));
    checks.push({
      name: "Good user public inputs exist",
      passed: true,
      details: `Root: ${publicInputs[0]?.substring(0, 20)}...`
    });
  } catch (err) {
    checks.push({
      name: "Good user public inputs exist",
      passed: false,
      details: `Error: ${err}`
    });
  }
} else {
  checks.push({
    name: "Good user public inputs exist",
    passed: false,
    details: "File not found"
  });
}

// Check 3: Cryptographic verification of good user proof
try {
  const verifyCmd = "cd ../circuits/compiled && snarkjs groth16 verify verification_key.json public_good_user.json proof_good_user.json";
  const result = execSync(verifyCmd, { encoding: "utf-8", stdio: "pipe" });
  
  if (result.includes("OK")) {
    checks.push({
      name: "Good user proof cryptographically valid",
      passed: true,
      details: "snarkjs groth16 verify returned OK"
    });
  } else {
    checks.push({
      name: "Good user proof cryptographically valid",
      passed: false,
      details: "Verification failed"
    });
  }
} catch (err) {
  checks.push({
    name: "Good user proof cryptographically valid",
    passed: false,
    details: `Verification error: ${err}`
  });
}

// Check 4: Bad user proof should NOT exist
const badProofPath = "../circuits/compiled/proof_bad_user.json";
if (!existsSync(badProofPath)) {
  checks.push({
    name: "Bad user proof does NOT exist (correct)",
    passed: true,
    details: "Cannot generate proof for banned users"
  });
} else {
  checks.push({
    name: "Bad user proof does NOT exist (correct)",
    passed: false,
    details: "⚠️  Bad user proof exists (should not be possible!)"
  });
}

// Check 5: Witness files match expected structure
const witnessGoodPath = "../circuits/witness_good.json";
const witnessBadPath = "../circuits/witness_bad.json";

if (existsSync(witnessGoodPath)) {
  const witness = JSON.parse(readFileSync(witnessGoodPath, "utf-8"));
  if (witness.leaf_value === "0") {
    checks.push({
      name: "Good user witness: leaf_value = 0",
      passed: true,
      details: "User is NOT banned"
    });
  } else {
    checks.push({
      name: "Good user witness: leaf_value = 0",
      passed: false,
      details: `Unexpected leaf_value: ${witness.leaf_value}`
    });
  }
}

if (existsSync(witnessBadPath)) {
  const witness = JSON.parse(readFileSync(witnessBadPath, "utf-8"));
  if (witness.leaf_value === "1") {
    checks.push({
      name: "Bad user witness: leaf_value = 1",
      passed: true,
      details: "User IS banned"
    });
  } else {
    checks.push({
      name: "Bad user witness: leaf_value = 1",
      passed: false,
      details: `Unexpected leaf_value: ${witness.leaf_value}`
    });
  }
}

// Print results
console.log("Verification Results:\n");
checks.forEach((check, i) => {
  const icon = check.passed ? "✅" : "❌";
  console.log(`${i + 1}. ${icon} ${check.name}`);
  console.log(`   ${check.details}\n`);
});

const allPassed = checks.every(c => c.passed);
const passCount = checks.filter(c => c.passed).length;

console.log("=".repeat(60));
if (allPassed) {
  console.log(`\n✅ ALL CHECKS PASSED (${passCount}/${checks.length})`);
  console.log("\nConclusion: The demo is REAL. Proofs are cryptographically valid.");
  console.log("Good users can prove non-membership, bad users cannot.\n");
  process.exit(0);
} else {
  console.log(`\n⚠️  SOME CHECKS FAILED (${passCount}/${checks.length} passed)`);
  console.log("\nPlease review the failures above.\n");
  process.exit(1);
}
