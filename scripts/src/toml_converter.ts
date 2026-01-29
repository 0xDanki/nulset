import { readFileSync, writeFileSync } from "fs";

// Convert witness JSON to Noir Prover.toml format
// Witness JSON structure must match circuit inputs exactly

export interface WitnessJSON {
  root: string;
  idx: string;
  leaf_value: string;
  siblings: string[];
  direction_bits: string[];
}

export function witnessJsonToToml(witnessPath: string, outputPath: string): void {
  console.log(`[Converter] Reading witness: ${witnessPath}`);
  
  const json = JSON.parse(readFileSync(witnessPath, "utf-8")) as WitnessJSON;
  
  // Validate structure
  if (!json.root || !json.idx || json.leaf_value === undefined) {
    throw new Error("Invalid witness JSON: missing required fields");
  }
  
  if (!Array.isArray(json.siblings) || json.siblings.length !== 8) {
    throw new Error(`Invalid witness JSON: siblings must be array of length 8, got ${json.siblings?.length}`);
  }
  
  if (!Array.isArray(json.direction_bits) || json.direction_bits.length !== 8) {
    throw new Error(`Invalid witness JSON: direction_bits must be array of length 8, got ${json.direction_bits?.length}`);
  }
  
  // Build TOML content
  // Format: key = "value" for single values, key = ["v1", "v2", ...] for arrays
  const tomlLines: string[] = [];
  
  tomlLines.push(`# Noir Prover inputs for verify_nonmembership circuit`);
  tomlLines.push(`# Auto-generated from witness JSON\n`);
  
  tomlLines.push(`root = "${json.root}"`);
  tomlLines.push(`_idx = "${json.idx}"`);  // Note: circuit param is _idx
  tomlLines.push(`leaf_value = "${json.leaf_value}"`);
  
  // Format arrays with proper TOML syntax
  const siblingsStr = json.siblings.map(s => `"${s}"`).join(", ");
  tomlLines.push(`siblings = [${siblingsStr}]`);
  
  const directionsStr = json.direction_bits.map(d => `"${d}"`).join(", ");
  tomlLines.push(`direction_bits = [${directionsStr}]`);
  
  const tomlContent = tomlLines.join("\n");
  
  writeFileSync(outputPath, tomlContent);
  console.log(`[Converter] ✓ Prover.toml written to: ${outputPath}`);
  console.log(`[Converter] Root: ${json.root.slice(0, 20)}...`);
  console.log(`[Converter] Leaf value: ${json.leaf_value} (0=allowed, 1=banned)`);
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error("Usage: tsx src/toml_converter.ts <witness.json> <output.toml>");
    process.exit(1);
  }
  
  try {
    witnessJsonToToml(args[0], args[1]);
  } catch (err) {
    console.error(`[Converter] Error: ${err}`);
    process.exit(1);
  }
}
