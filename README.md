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

## Commands

```bash
# Compile circuit
make check

# Run tree builder
cd scripts && tsx src/build_tree.ts

# Generate witnesses
cd scripts && tsx src/gen_witness.ts

# Sanity check
cd scripts && tsx src/sanity_check.ts
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

## TODO (Production)

- [ ] Larger tree depth / better identifier binding
- [ ] Root distribution mechanism (IPFS/chain)
- [ ] Witness refresh on root update
- [ ] Multi-party admin (governance)
- [ ] Real prove/verify integration (nargo/bb)
