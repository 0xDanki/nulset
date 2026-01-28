import { writeFileSync } from "fs";
import { SMTLite } from "./tree.js";

// Build SMT-lite exclusion tree and export root
// Usage: tsx src/build_tree.ts

console.log("=== Building SMT-lite Exclusion Tree ===\n");

const tree = new SMTLite(32);

// Add banned identifiers (hardcoded for demo)
const bannedIdentifiers = [
  "bob@banned.com",
  "eve@malicious.org",
  "sanctioned@example.com"
];

console.log("[Admin] Adding banned identifiers...");
bannedIdentifiers.forEach(id => tree.ban(id));

console.log("\n[Admin] Computing Merkle root...");
const treeData = tree.export();

// Save root to file
const rootOutput = {
  root: treeData.root,
  depth: treeData.depth,
  bannedCount: treeData.bannedIndices.length,
  bannedIndices: treeData.bannedIndices
};

writeFileSync("../circuits/root.json", JSON.stringify(rootOutput, null, 2));
console.log("\n[Admin] ✓ Root saved to circuits/root.json");
console.log(`[Admin] Root: ${treeData.root}`);
console.log(`[Admin] Banned count: ${treeData.bannedIndices.length}`);
