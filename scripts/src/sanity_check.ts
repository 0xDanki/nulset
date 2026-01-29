import { buildPoseidon } from "circomlibjs";

// Sanity check: Verify TypeScript Poseidon matches expected behavior
// This helps catch hash compatibility issues early

async function main() {
  console.log("=== Poseidon Hash Sanity Check ===\n");

  const poseidon = await buildPoseidon();

  // Test basic hash
  const input1 = [BigInt(1), BigInt(2)];
  const hash1Raw = poseidon(input1);
  const hash1 = BigInt(poseidon.F.toObject(hash1Raw));
  console.log(`poseidon([1, 2]) = ${hash1}`);

  // Test with zeros (common in sparse Merkle trees)
  const input2 = [BigInt(0), BigInt(0)];
  const hash2Raw = poseidon(input2);
  const hash2 = BigInt(poseidon.F.toObject(hash2Raw));
  console.log(`poseidon([0, 0]) = ${hash2}`);

  // Test asymmetry (order matters)
  const input3 = [BigInt(2), BigInt(1)];
  const hash3Raw = poseidon(input3);
  const hash3 = BigInt(poseidon.F.toObject(hash3Raw));
  console.log(`poseidon([2, 1]) = ${hash3}`);

  if (hash1 === hash3) {
    console.error("\n❌ ERROR: Hash should be order-dependent!");
    process.exit(1);
  }

  console.log("\n✓ TypeScript Poseidon working correctly");
  console.log("\nNext: Verify these hashes match in Noir circuit by running:");
  console.log("  1. Create Prover.toml with test inputs");
  console.log("  2. Run: cd circuits && nargo execute");
  console.log("  3. Compare outputs");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
