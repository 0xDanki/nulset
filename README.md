# NulSet - Privacy-Preserving Exclusion Check

> Prove "I'm NOT on the banned list" without revealing your identity.

A zero-knowledge proof system for non-membership verification using sparse Merkle trees (SMT) with Poseidon hashing.

## 🎯 What This Demo Proves

✅ **Core Cryptography Works**
- SMT-lite tree with depth-32 capacity (4B+ identifiers)
- Poseidon (BN254) hash compatibility between TypeScript and Noir
- Merkle proof verification in zero-knowledge circuit
- Non-membership constraint enforcement (leaf = 0)

✅ **Working End-to-End Flow**
- Admin builds exclusion tree → computes root
- User generates witness with Merkle path
- Circuit validates: hash(leaf=0, siblings) = root
- Good user passes ✓, Banned user fails ✗

📝 **Production Roadmap**
- Full ZK proof generation (requires compatible Barretenberg version)
- Proof recursion for depth-32 (4× depth-8 sub-proofs)  
- Root distribution mechanism (IPFS/on-chain)
- Multi-party admin governance

## Quick Start

```bash
# Install dependencies
pnpm install

# Compile Noir circuit
cd circuits && nargo compile && cd ..

# Build TypeScript scripts
pnpm -r build

# Run demo
cd scripts && pnpm run demo
```

## Demo Status

✅ **Working**: Witness validation (Option 1)
- Tree building with Poseidon hash
- Witness generation for good/bad users  
- Circuit validation of Merkle proofs
- Hash compatibility verified (circomlibjs ↔ Noir)

🚧 **Future**: Full ZK proof generation (Option 2)
- Requires Barretenberg backend (`bb`)
- Would enable cryptographic proof artifacts
- Would enable separate prover/verifier parties

## What It Does

Proves "I am NOT in the banned set" without revealing identity:
1. **Admin** creates exclusion set commitment (Merkle root)
2. **User** generates ZK proof of non-membership
3. **Platform** verifies proof → grants/denies access

## Architecture

### Circuits (`circuits/`)
- `verify_nonmembership.nr` - Noir circuit for SMT non-membership proof
- Uses Poseidon hash (BN254) for JS/Noir compatibility
- Depth: 32, proves leaf value = 0

### Scripts (`scripts/src/`)
- `tree.ts` - SMT-lite implementation
- `build_tree.ts` - Create exclusion set + compute root
- `gen_witness.ts` - Generate witness files for sample users
- `sanity_check.ts` - Verify hash compatibility
- `toml_converter.ts` - Convert witness JSON → Prover.toml
- `prove.ts` - Wrap nargo execute + prove
- `verify.ts` - Wrap nargo verify, return pass/fail
- `demo.ts` - Full end-to-end demo

## Commands

### Full Demo (Automated)
```bash
cd scripts && pnpm run demo
```

### Step-by-Step

```bash
# 1. Compile circuit
make check

# 2. Sanity check hash compatibility
cd scripts && pnpm run sanity-check

# 3. Admin: Build exclusion tree
cd scripts && pnpm run build-tree

# 4. User: Generate witnesses
cd scripts && pnpm run gen-witness

# 5. Platform: Generate proof for good user
cd scripts && tsx src/prove.ts ../circuits/witness_good.json good_user

# 6. Platform: Verify proof
cd scripts && tsx src/verify.ts good_user
# Expected: ✓ PROOF VALID, Access GRANTED

# 7. Platform: Try to prove bad user (will fail)
cd scripts && tsx src/prove.ts ../circuits/witness_bad.json bad_user
# Expected: ✗ Circuit constraint fails (leaf_value must be 0)
```

## Demo Data

**Banned identifiers:**
- bob@banned.com
- eve@malicious.org
- sanctioned@example.com

**Test cases:**
- `alice@example.com` → leaf=0 → ✓ ALLOWED
- `bob@banned.com` → leaf=1 → ✗ BANNED

## Hash Function

**Poseidon (BN254)** used in both Noir and TypeScript:
- Noir: `dep::poseidon::poseidon::bn254::hash_2`
- TypeScript: `circomlibjs` (Circom-compatible implementation)

## Current Workflow (Option 1 - Witness Validation)

1. **Build tree**: TypeScript with circomlibjs Poseidon
2. **Generate witnesses**: For good/bad users with Merkle paths
3. **Validate**: Noir circuit checks Merkle path → root
4. **Result**: Good user passes (leaf=0), bad user fails (leaf=1)

## Future Workflow (Option 2 - Full Proving)

1. Witness JSON → TOML → `nargo execute` → witness file
2. Barretenberg `bb prove` → cryptographic proof artifact
3. Barretenberg `bb verify` → proof validation
4. Separate prover/verifier parties

## TODO (Production)

- [ ] Larger tree depth / better identifier binding
- [ ] Root distribution mechanism (IPFS/chain)
- [ ] Witness refresh on root update
- [ ] Multi-party admin (governance)
- [ ] Production proving backend (parallelization, caching)
