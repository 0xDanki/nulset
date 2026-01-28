import { poseidon2 } from "@zk-kit/poseidon";

// Sanity check: Verify TypeScript Poseidon matches expected behavior
// This helps catch hash compatibility issues early

console.log("=== Poseidon Hash Sanity Check ===\n");

// Test basic hash
const input1 = [BigInt(1), BigInt(2)];
const hash1 = poseidon2(input1);
console.log(`poseidon2([1, 2]) = ${hash1}`);

// Test with zeros (common in sparse Merkle trees)
const input2 = [BigInt(0), BigInt(0)];
const hash2 = poseidon2(input2);
console.log(`poseidon2([0, 0]) = ${hash2}`);

// Test asymmetry (order matters)
const input3 = [BigInt(2), BigInt(1)];
const hash3 = poseidon2(input3);
console.log(`poseidon2([2, 1]) = ${hash3}`);

if (hash1 === hash3) {
  console.error("\n❌ ERROR: Hash should be order-dependent!");
  process.exit(1);
}

console.log("\n✓ TypeScript Poseidon working correctly");
console.log("\nNext: Verify these hashes match in Noir circuit by running:");
console.log("  1. Create Prover.toml with test inputs");
console.log("  2. Run: cd circuits && nargo execute");
console.log("  3. Compare outputs");
