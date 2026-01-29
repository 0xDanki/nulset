import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { WitnessJSON } from "./toml_converter.js";

// Prove using Circom + snarkjs
// This is the real ZK proof!

export async function proveWithCircom(witnessJsonPath: string, proofName: string) {
  console.log("\n=== Generating ZK Proof with Circom + snarkjs ===\n");
  
  try {
    // Step 1: Load witness
    console.log("[Circom] Loading witness...");
    const witnessJson = JSON.parse(readFileSync(witnessJsonPath, "utf-8")) as WitnessJSON;
    
    // Step 2: Convert to Circom input format
    console.log("[Circom] Converting to Circom input format...");
    const circomInput = {
      root: witnessJson.root,
      idx: witnessJson.idx,
      leaf_value: witnessJson.leaf_value,
      siblings: witnessJson.siblings,
      direction_bits: witnessJson.direction_bits
    };
    
    const inputPath = `../circuits/compiled/input_${proofName}.json`;
    writeFileSync(inputPath, JSON.stringify(circomInput, null, 2));
    console.log(`[Circom] Input saved: ${inputPath}`);
    console.log(`[Circom] Leaf value: ${circomInput.leaf_value} (0=allowed, 1=banned)`);
    
    // Step 3: Generate witness using WASM
    console.log("\n[Circom] Generating witness with WASM...");
    const witnessCmd = `cd ../circuits/compiled/verify_nonmembership_js && node generate_witness.js verify_nonmembership.wasm ../input_${proofName}.json ../witness_${proofName}.wtns`;
    execSync(witnessCmd, { stdio: "inherit" });
    console.log(`[Circom] ✓ Witness generated`);
    
    // Step 4: Generate proof with Groth16
    console.log("\n[Circom] Generating Groth16 proof...");
    console.log("[Circom] This may take 10-30 seconds...");
    const proveCmd = `cd ../circuits/compiled && snarkjs groth16 prove verify_nonmembership_0000.zkey witness_${proofName}.wtns proof_${proofName}.json public_${proofName}.json`;
    execSync(proveCmd, { stdio: "inherit" });
    console.log(`[Circom] ✓ Proof generated!`);
    
    // Step 5: Verify proof
    console.log("\n[Circom] Verifying proof...");
    const verifyCmd = `cd ../circuits/compiled && snarkjs groth16 verify verification_key.json public_${proofName}.json proof_${proofName}.json`;
    const result = execSync(verifyCmd, { encoding: "utf-8" });
    
    if (result.includes("OK")) {
      console.log("\n[Circom] ✓ PROOF VALID!");
      console.log("[Circom] Access: GRANTED\n");
      console.log("🎉 REAL ZERO-KNOWLEDGE PROOF WORKING!");
      return true;
    } else {
      console.log("\n[Circom] ✗ Proof invalid");
      console.log("[Circom] Access: DENIED\n");
      return false;
    }
    
  } catch (err) {
    console.error("\n[Circom] Error:", err);
    return false;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error("Usage: tsx src/prove_circom.ts <witness.json> <proof_name>");
    console.error("Example: tsx src/prove_circom.ts ../circuits/witness_good.json good_user");
    process.exit(1);
  }
  
  proveWithCircom(args[0], args[1])
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(2);
    });
}
