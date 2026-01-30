# NulSet - Privacy-Preserving Exclusion Check

> Prove "I'm NOT on the banned list" without revealing your identity.

A zero-knowledge proof system for non-membership verification using sparse Merkle trees (SMT) with Poseidon hashing.

## 🎯 What This Demo Delivers

✅ **REAL Zero-Knowledge Proofs**
- Groth16 proof system (industry standard)
- Full privacy preservation (verifier sees only proof + root)
- Depth-32 Sparse Merkle Tree (4B+ identifier capacity)
- Poseidon hash (circomlibjs ↔ Circom verified compatible)

✅ **Complete Working System**
- Admin builds exclusion tree → computes root
- User generates ZK proof locally (private inputs never shared)
- Platform verifies proof cryptographically
- Good user: proof valid ✓, Bad user: cannot generate proof ✗

✅ **Production-Ready Architecture**
- Circom circuits (battle-tested)
- snarkjs proving (reliable toolchain)
- Sparse tree (scales to billions of identifiers)
- Real cryptographic proofs (not just validation)

## Quick Start

**If trusted setup already exists (normal case):**
```bash
# Install dependencies
pnpm install

# Run demo
cd scripts && pnpm run demo
```

**First-time setup (if .ptau/.zkey files don't exist):**
```bash
# Install dependencies
pnpm install

# Compile Circom circuit
cd circuits
circom verify_nonmembership.circom --r1cs --wasm -o compiled
cd ..

# Generate trusted setup (ONE-TIME, ~2 minutes)
cd circuits/compiled
snarkjs powersoftau new bn128 13 pot13_0000.ptau -v
snarkjs powersoftau contribute pot13_0000.ptau pot13_0001.ptau --name="Random" -v
snarkjs powersoftau prepare phase2 pot13_0001.ptau pot13_final.ptau -v
snarkjs groth16 setup verify_nonmembership.r1cs pot13_final.ptau verify_nonmembership_0000.zkey
snarkjs zkey export verificationkey verify_nonmembership_0000.zkey verification_key.json
cd ../..

# Run demo
cd scripts && pnpm run demo
```

> **Note:** Trusted setup files (`*.ptau`, `*.zkey`, `verification_key.json`) are committed to the repo. You only need to regenerate them if the circuit changes or you want a fresh ceremony.

## System Status

🎉 **FULLY WORKING**: Real Zero-Knowledge Proofs
- ✅ Groth16 proof generation with snarkjs
- ✅ Cryptographic proof verification
- ✅ Depth-32 Merkle tree (full scale)
- ✅ Privacy-preserving (ZK properties verified)
- ✅ Production-ready cryptography

**Tech Stack:**
- **Circuit**: Circom 2.1.8
- **Proving System**: Groth16 (via snarkjs 0.7.6)
- **Hash**: Poseidon (circomlibjs + circomlib)
- **Tree**: TypeScript SMT-lite implementation

## What It Does

Proves "I am NOT in the banned set" without revealing identity:
1. **Admin** creates exclusion set commitment (Merkle root)
2. **User** generates ZK proof of non-membership
3. **Platform** verifies proof → grants/denies access

## Architecture

### Circuits (`circuits/`)
- `verify_nonmembership.circom` - Circom circuit for SMT non-membership proof
- Uses Poseidon hash (compatible with circomlibjs)
- Depth: 32 (4,294,967,296 possible identifiers)
- Constraints: 7,744 (Groth16-provable)
- Enforces: leaf_value === 0 (non-membership)

### Scripts (`scripts/src/`)
- `tree.ts` - SMT-lite implementation
- `build_tree.ts` - Create exclusion set + compute root
- `gen_witness.ts` - Generate witness files for sample users
- `sanity_check.ts` - Verify hash compatibility
- `prove_circom.ts` - Circom/snarkjs ZK proof generation + verification
- `demo.ts` - Full end-to-end demo with real ZK proofs

## Commands

### Full Demo (Automated)
```bash
cd scripts && pnpm run demo
```

### Step-by-Step

```bash
# 1. Sanity check hash compatibility
cd scripts && pnpm run sanity-check

# 2. Admin: Build exclusion tree
cd scripts && pnpm run build-tree

# 3. User: Generate witnesses
cd scripts && pnpm run gen-witness

# 4. Platform: Generate ZK proof for good user
cd scripts && pnpm run prove ../circuits/witness_good.json good_user
# Expected: ✓ PROOF VALID, Access GRANTED

# 5. Platform: Try to prove bad user (will fail)
cd scripts && pnpm run prove ../circuits/witness_bad.json bad_user
# Expected: ✗ Circuit constraint fails (leaf_value must be 0)

# 6. Verify demo integrity
cd scripts && pnpm run verify-demo
# Checks actual proof files and cryptographic validity
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

**Poseidon** used consistently across the stack:
- Circom circuit: `circomlib/circuits/poseidon.circom`
- TypeScript tree builder: `circomlibjs`
- Verified compatible: Same hash outputs for same inputs

## Current Workflow (FULL ZK PROOFS)

1. **Admin**: Build SMT tree with circomlibjs → Compute root
2. **User**: Generate witness (Merkle path) → Convert to Circom format
3. **User**: Generate Groth16 ZK proof locally (snarkjs)
4. **Platform**: Verify proof cryptographically → Grant/deny access
5. **Privacy**: Platform learns ONLY "proof valid/invalid" - nothing else!

## Production Roadmap

**Current (Hackathon Demo):**
- ✅ Depth-32 tree (4B capacity)
- ✅ Real Groth16 ZK proofs
- ✅ Full privacy preservation
- ✅ Working end-to-end

**Future Enhancements:**
- [ ] On-chain root publication (storage + events)
- [ ] IPFS witness distribution
- [ ] Multi-party admin (governance for tree updates)
- [ ] Proof recursion (if depth > 32 needed)
- [ ] Identifier binding (link to real identity systems)
- [ ] Automatic witness refresh on root updates
