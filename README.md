# NulSet - Privacy-Preserving Exclusion Check

A ZK proof system for non-membership verification using SMT-lite.

## Quick Start

```bash
# Install dependencies
pnpm install

# Compile Noir circuit
cd circuits && nargo compile && cd ..

# Build TypeScript scripts
pnpm -r build

# Run demo
cd scripts && pnpm run sanity-check && pnpm run demo
```

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
- Noir: `dep::poseidon::bn254::hash_2`
- TypeScript: `@zk-kit/poseidon`

## Proof Workflow

1. **Witness JSON** → TOML converter → **Prover.toml**
2. `nargo execute` → generates witness file (`.gz`)
3. `nargo prove` → generates proof artifact
4. `nargo verify` → validates proof, returns pass/fail

All steps are wrapped in `prove.ts` and `verify.ts` with clear logging.

## TODO (Production)

- [ ] Larger tree depth / better identifier binding
- [ ] Root distribution mechanism (IPFS/chain)
- [ ] Witness refresh on root update
- [ ] Multi-party admin (governance)
- [ ] Production proving backend (parallelization, caching)
