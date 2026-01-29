import { writeFileSync } from "fs";
import { SMTLite } from "./tree.js";

// Generate witness files for good and bad users
// Usage: tsx src/gen_witness.ts

async function main() {
  console.log("=== Generating Witness Files ===\n");

  const tree = await SMTLite.create();

// Rebuild tree with same banned identifiers
const bannedIdentifiers = [
  "bob@banned.com",
  "eve@malicious.org",
  "sanctioned@example.com"
];

console.log("[Setup] Rebuilding tree...");
bannedIdentifiers.forEach(id => tree.ban(id));

const root = tree.computeRoot();
console.log(`[Setup] Root: ${root}\n`);

// Generate witness for GOOD user (not banned)
console.log("[User] Generating witness for GOOD user...");
const goodIdentifier = "alice@example.com";
const witnessGood = tree.generateWitness(goodIdentifier);

const witnessGoodOutput = {
  root: root.toString(),
  ...witnessGood
};

writeFileSync("../circuits/witness_good.json", JSON.stringify(witnessGoodOutput, null, 2));
console.log("[User] ✓ Good witness saved to circuits/witness_good.json\n");

// Generate witness for BAD user (banned)
console.log("[User] Generating witness for BAD user...");
const badIdentifier = "bob@banned.com";
const witnessBad = tree.generateWitness(badIdentifier);

const witnessBadOutput = {
  root: root.toString(),
  ...witnessBad
};

  writeFileSync("../circuits/witness_bad.json", JSON.stringify(witnessBadOutput, null, 2));
  console.log("[User] ✓ Bad witness saved to circuits/witness_bad.json");

  console.log("\n=== Witness Generation Complete ===");
  console.log("Next: Generate ZK proofs with Circom (pnpm run demo)");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
