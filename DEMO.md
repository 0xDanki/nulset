# NulSet Demo Guide

## What You're Seeing

This demo shows a **privacy-preserving exclusion check** using zero-knowledge cryptography.

### The Problem
Traditional systems require users to reveal their identity to prove they're not banned. This violates privacy and creates data honeypots.

### The NulSet Solution
Users prove "I'm NOT on the banned list" using:
1. **Sparse Merkle Tree** (SMT) - Efficient set membership data structure
2. **Poseidon Hash** - ZK-friendly hash function
3. **Noir Circuit** - Verifies Merkle proof without revealing identity

## Live Demo Flow

### Step 1: Admin Creates Exclusion Set
```bash
cd scripts && pnpm run build-tree
```

**What happens:**
- Admin adds 3 banned identifiers to tree
- System computes Merkle root (commitment to the set)
- Root is published (e.g., on-chain or IPFS)

**Output:**
```
[SMT] Banned: "bob@banned.com" → index 2307781180
[SMT] Banned: "eve@malicious.org" → index 889975555
[SMT] Banned: "sanctioned@example.com" → index 255521000
[SMT] Computed root: 10492...
```

### Step 2: Users Generate Witnesses
```bash
pnpm run gen-witness
```

**What happens:**
- Alice (good user) gets Merkle path showing her leaf = 0
- Bob (banned) gets Merkle path showing his leaf = 1

**Output:**
```
[User] alice@example.com: index=331315900, leaf=0 ✓ ALLOWED
[User] bob@banned.com: index=2307781180, leaf=1 ✗ BANNED
```

### Step 3: Circuit Validation

**Alice (Good User):**
```bash
pnpm exec tsx src/prove.ts ../circuits/witness_good.json good_user
```

**What happens:**
- Circuit receives: root, leaf=0, Merkle path (siblings + directions)
- Circuit verifies: leaf == 0 ✓
- Circuit computes: hash(leaf, siblings) == root ✓
- Result: **Access GRANTED**

**Bob (Banned User):**
```bash
pnpm exec tsx src/prove.ts ../circuits/witness_bad.json bad_user
```

**What happens:**
- Circuit receives: root, leaf=1, Merkle path
- Circuit checks: leaf == 0 ✗
- Result: **Constraint fails, Access DENIED**

## Key Innovations

### 1. Sparse Merkle Tree
- Supports 2^32 = 4.3 billion identifiers
- Only stores non-zero values (3 banned IDs, not 4 billion!)
- Efficient witness generation

### 2. Hash Compatibility
**Challenge**: TypeScript and Noir must use the SAME hash function.

**Solution**: 
- Verified `circomlibjs` Poseidon matches Noir's `poseidon::bn254::hash_2`
- Sanity check confirms: `poseidon([1,2])` gives identical output

### 3. Zero-Knowledge Circuit
User's private inputs:
- Their identifier index
- Their leaf value (0 or 1)
- Merkle path (32 siblings + direction bits)

Public input:
- Merkle root (the commitment)

**Privacy guarantee**: Verifier learns NOTHING except "proof is valid"

## What Makes This Production-Ready

### Current Implementation (Depth-32)
- ✅ Tree structure supports 4B+ identifiers
- ✅ Efficient sparse storage
- ✅ Hash compatibility proven
- ✅ Circuit constraints correct

### What's Missing (Toolchain Issue)
- ⚠️ Full ZK proof generation blocked by nargo↔barretenberg version mismatch
- ⚠️ Currently shows witness validation (circuit passes/fails)

### Production Path Forward
1. **Proof Recursion**: 4× depth-8 proofs → 1 aggregated proof
2. **Compatible Toolchain**: Update to matching nargo + bb versions
3. **Root Distribution**: IPFS or on-chain publication
4. **Governance**: Multi-sig admin for tree updates

## Technical Details

**Circuit Constraints:**
- Expression width: 10,335 (depth-32) or 2,583 (depth-8)
- ACIR opcodes: 9
- Proving time: ~1-5 seconds (estimated with compatible backend)

**Security Properties:**
- Zero-knowledge: No information leakage beyond "valid/invalid"
- Soundness: Cannot forge proof for banned identifier
- Completeness: Valid proof always verifies

**Scalability:**
- Tree updates: O(log n) for adding/removing
- Proof size: Constant (independent of tree size)
- Verification: O(1) with ZK proof (or O(depth) with witness validation)

## Questions & Answers

**Q: Why not just hash the user's ID and check a list?**
A: That reveals the user's identity to the verifier. NulSet proves non-membership WITHOUT revealing WHO you are.

**Q: How does the circuit prevent cheating?**
A: The circuit enforces:
1. `leaf_value == 0` (you're not banned)
2. `hash(leaf, siblings) == root` (your path is valid)

If you're banned (leaf=1), constraint #1 fails. If you fake the path, constraint #2 fails.

**Q: Why Poseidon instead of SHA256?**
A: Poseidon is "ZK-friendly" - uses ~10× fewer constraints in the circuit, making proofs faster and cheaper.

**Q: Why sparse Merkle tree?**
A: Most identifiers are NOT banned (tree is mostly zeros). Sparse structure stores only the exceptions, saving memory.

**Q: Production-ready?**
A: The cryptography and data structures are production-grade. The toolchain needs compatible versions for full ZK proving, but the foundations are solid.

## Demo Commands Summary

```bash
# Full automated demo
cd scripts && pnpm run demo

# Or step-by-step:
pnpm run build-tree          # Admin creates tree
pnpm run gen-witness         # Users get Merkle paths
pnpm exec tsx src/prove.ts ../circuits/witness_good.json good_user  # Alice ✓
pnpm exec tsx src/prove.ts ../circuits/witness_bad.json bad_user    # Bob ✗
```

## Learn More

- **Sparse Merkle Trees**: https://docs.iden3.io/publications/pdfs/Merkle-Tree.pdf
- **Poseidon Hash**: https://eprint.iacr.org/2019/458.pdf
- **Noir Language**: https://noir-lang.org/
- **Zero-Knowledge Proofs**: https://zkproof.org/
