# NulSet

Privacy-preserving exclusion verification using zero-knowledge proofs. Users can prove non-membership in an exclusion set without revealing their identity or any information about the set itself.

## Overview

NulSet implements a zero-knowledge non-membership proof system based on sparse Merkle trees. The system allows users to cryptographically prove they are not in a banned/sanctioned set while maintaining complete privacy.

**Key Features:**
- Groth16 zero-knowledge proof system
- Depth-32 sparse Merkle tree (4.3 billion identifier capacity)
- Poseidon hash function (SNARK-friendly)
- Privacy-preserving: verifier learns only proof validity, nothing else
- Efficient: sparse tree representation, constant-size proofs

**Technical Stack:**
- Circuit: Circom 2.1.8 (7,744 constraints)
- Proving: snarkjs Groth16
- Hash: Poseidon (circomlibjs + circomlib)
- Tree: TypeScript SMT implementation

## Quick Start

**Web Frontend (Faucet Demo):**
```bash
cd web
pnpm install
pnpm run dev
# Open: http://localhost:3000
```

**Backend CLI Test:**
```bash
# Install dependencies
pnpm install

# Run end-to-end test
cd scripts && pnpm run demo
```

**First-time setup (if trusted setup files missing):**
```bash
# Install dependencies
pnpm install

# Compile Circom circuit
cd circuits
circom verify_nonmembership.circom --r1cs --wasm -o compiled
cd ..

# Generate trusted setup (one-time)
cd circuits/compiled
snarkjs powersoftau new bn128 13 pot13_0000.ptau -v
snarkjs powersoftau contribute pot13_0000.ptau pot13_0001.ptau --name="Contributor" -v
snarkjs powersoftau prepare phase2 pot13_0001.ptau pot13_final.ptau -v
snarkjs groth16 setup verify_nonmembership.r1cs pot13_final.ptau verify_nonmembership_0000.zkey
snarkjs zkey export verificationkey verify_nonmembership_0000.zkey verification_key.json
cd ../..

# Run test
cd scripts && pnpm run demo
```

Note: Trusted setup files are committed. Regenerate only if circuit constraints change.

## System Architecture

**Workflow:**
1. **Administrator** builds sparse Merkle tree from exclusion set, publishes root
2. **User** generates witness (Merkle path) for their identifier
3. **User** generates Groth16 zero-knowledge proof locally
4. **Verifier** validates proof cryptographically, grants or denies access

**Privacy Properties:**
- User's identifier remains private
- Verifier learns only: "proof is valid" or "proof is invalid"
- No information about tree size, banned identities, or user's position leaks
- Proof is unlinkable (same user, different proofs are indistinguishable)

## Architecture

### Circuits (`circuits/`)

**`verify_nonmembership.circom`** - Zero-knowledge circuit for non-membership proof
- Public inputs: Merkle root
- Private inputs: identifier index, leaf value, siblings (path), direction bits
- Constraints: 7,744 (Groth16-compatible)
- Enforces: `leaf_value === 0` and `recompute_root(leaf, path) === public_root`
- Hash: Poseidon(2) from circomlib

### Scripts (`scripts/src/`)

**Core Implementation:**
- `tree.ts` - Sparse Merkle tree implementation with Poseidon hash
- `build_tree.ts` - Build exclusion tree, compute root commitment
- `gen_witness.ts` - Generate Merkle witnesses for identifiers

**Testing & Verification:**
- `sanity_check.ts` - Verify hash function compatibility across implementations
- `prove_circom.ts` - Proof generation and cryptographic verification
- `verify_demo.ts` - Validate proof artifacts and integrity
- `demo.ts` - End-to-end system test

## Usage

### Automated Test
```bash
cd scripts && pnpm run demo
```

### Manual Steps

```bash
# 1. Sanity check hash compatibility
cd scripts && pnpm run sanity-check

# 2. Admin: Build exclusion tree
cd scripts && pnpm run build-tree

# 3. User: Generate witnesses
cd scripts && pnpm run gen-witness

# 4. Generate proof for non-banned user
cd scripts && pnpm run prove ../circuits/witness_good.json good_user

# 5. Attempt proof for banned user (will fail at circuit level)
cd scripts && pnpm run prove ../circuits/witness_bad.json bad_user

# 6. Verify proof artifacts
cd scripts && pnpm run verify-demo
```

## Test Data

The system includes test identifiers to demonstrate both success and failure cases:

**Exclusion set:**
- `bob@banned.com`
- `eve@malicious.org`
- `sanctioned@example.com`

**Test cases:**
- `alice@example.com` - Not in exclusion set, proof generation succeeds
- `bob@banned.com` - In exclusion set, cannot generate valid proof (circuit constraint violation)

## Cryptographic Primitives

**Hash Function: Poseidon**
- Implementation: `circomlib/circuits/poseidon.circom` (circuit), `circomlibjs` (off-circuit)
- Configuration: Poseidon(2) with BN254 field
- Compatibility verified via `sanity_check.ts`

**Proof System: Groth16**
- Proving key size: ~1.1 MB
- Proof size: ~192 bytes (constant)
- Verification: ~2ms on-chain (estimated), <1ms off-chain
- Security: 128-bit security level (BN254 curve)

## Roadmap

**Current Implementation:**
- Off-chain proof generation and verification
- Local root storage (JSON file)
- Manual witness distribution

**Planned:**
- Smart contract for root publication and on-chain verification
- IPFS-based witness distribution
- Multi-party computation for tree updates
- Governance mechanism for exclusion set management
- Identity provider integration
- Automated witness refresh on root updates
- Proof recursion for larger trees (depth > 32)
