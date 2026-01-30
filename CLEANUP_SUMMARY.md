# NulSet Cleanup Summary

## Files Removed

### Noir-related files (no longer used)
- ✅ `circuits/Nargo.toml` - Noir package config
- ✅ `circuits/src/main.nr` - Noir circuit (replaced by Circom)
- ✅ `scripts/src/prove_noirjs.ts` - NoirJS proving wrapper
- ✅ `scripts/src/prove.ts` - Old Noir proving script
- ✅ `scripts/src/verify.ts` - Old Noir verification script
- ✅ `scripts/src/toml_converter.ts` - TOML converter (Noir-specific)

### External dependencies (not needed)
- `acvm-backend-plonky2/` - Experimental backend (not used, added to .gitignore)

## Files Updated

### Configuration
- ✅ `makefile` - Changed `nargo compile` to `circom` compilation
- ✅ `scripts/package.json` - Removed Noir dependencies (@noir-lang/*)
- ✅ `.gitignore` - Updated for Circom artifacts, added plonky2 ignore

### Documentation
- ✅ `README.md` - Updated to reflect Circom-only setup
  - Removed Noir references
  - Updated Quick Start with Circom + snarkjs setup
  - Updated step-by-step commands
  - Added verify-demo command

## Current Clean Stack

**Circuit:**
- `circuits/verify_nonmembership.circom` - Circom circuit (depth-32)

**TypeScript Scripts:**
- `scripts/src/tree.ts` - SMT-lite implementation
- `scripts/src/build_tree.ts` - Build exclusion tree
- `scripts/src/gen_witness.ts` - Generate witnesses
- `scripts/src/sanity_check.ts` - Hash compatibility check
- `scripts/src/prove_circom.ts` - ZK proof generation + verification
- `scripts/src/demo.ts` - End-to-end demo
- `scripts/src/verify_demo.ts` - Proof integrity verification

**Dependencies:**
- `circomlibjs` - Poseidon hash for TypeScript
- `snarkjs` - Groth16 proving (installed globally or via npx)
- `circom` - Circuit compiler (installed globally)

## Verification

Run these to confirm clean state:

```bash
# Check no Noir files
find . -name "*.nr" -o -name "Nargo.toml"  # Should return empty

# Check no old scripts
ls scripts/src/prove.ts  # Should not exist
ls scripts/src/verify.ts  # Should not exist

# Verify demo works
cd scripts && pnpm run demo

# Verify proof integrity
cd scripts && pnpm run verify-demo
```

## Next Steps

1. Commit changes
2. Push to current branch
3. Merge to main (see git commands below)
