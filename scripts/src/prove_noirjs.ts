import { readFileSync } from "fs";
import { Noir } from "@noir-lang/noir_js";
import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";

// Prove using NoirJS (WASM backend)
// This uses a different backend than bb CLI

async function proveWithNoirJS(witnessJsonPath: string) {
  console.log("\n=== Generating Proof with NoirJS ===\n");
  
  try {
    // Step 1: Load compiled circuit
    console.log("[NoirJS] Loading compiled circuit...");
    const circuitJson = JSON.parse(
      readFileSync("../circuits/target/verify_nonmembership.json", "utf-8")
    );
    
    // Step 2: Load witness inputs
    console.log("[NoirJS] Loading witness inputs...");
    const witnessJson = JSON.parse(readFileSync(witnessJsonPath, "utf-8"));
    
    // Convert witness to NoirJS format
    const inputs = {
      root: witnessJson.root,
      _idx: witnessJson.idx,
      leaf_value: witnessJson.leaf_value,
      siblings: witnessJson.siblings,
      direction_bits: witnessJson.direction_bits
    };
    
    console.log("[NoirJS] Inputs prepared:");
    console.log(`  - Root: ${inputs.root.slice(0, 20)}...`);
    console.log(`  - Leaf value: ${inputs.leaf_value} (0=allowed, 1=banned)`);
    
    // Step 3: Initialize Noir with backend
    console.log("\n[NoirJS] Initializing Noir backend...");
    const backend = new BarretenbergBackend(circuitJson);
    const noir = new Noir(circuitJson, backend);
    
    // Step 4: Generate proof
    console.log("[NoirJS] Generating proof (this may take a minute)...");
    const { witness } = await noir.execute(inputs);
    const proof = await backend.generateProof(witness);
    
    console.log("\n[NoirJS] ✓ Proof generated successfully!");
    console.log(`[NoirJS] Proof size: ${proof.proof.length} bytes`);
    
    // Step 5: Verify proof (sanity check)
    console.log("\n[NoirJS] Verifying proof...");
    const verified = await backend.verifyProof(proof);
    
    if (verified) {
      console.log("[NoirJS] ✓ Proof verified successfully!");
      console.log("[NoirJS] Access: GRANTED\n");
      return true;
    } else {
      console.log("[NoirJS] ✗ Proof verification failed!");
      console.log("[NoirJS] Access: DENIED\n");
      return false;
    }
    
  } catch (err) {
    console.error("\n[NoirJS] Error:", err);
    throw err;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length !== 1) {
    console.error("Usage: tsx src/prove_noirjs.ts <witness.json>");
    console.error("Example: tsx src/prove_noirjs.ts ../circuits/witness_good.json");
    process.exit(1);
  }
  
  proveWithNoirJS(args[0])
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(2);
    });
}
