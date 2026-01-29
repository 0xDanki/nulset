# NulSet Commands Reference

Complete command reference with expected outputs for the demo.

## Initial Setup

```bash
# 1. Install dependencies
pnpm install

# Expected output:
# Lockfile is up to date, resolution step is skipped
# Packages: +XX
# Done in Xs

# 2. Compile Noir circuit
cd circuits && nargo compile && cd ..

# Expected output:
# [verify_nonmembership] Constraint system successfully built!
# [verify_nonmembership] Circuit witness successfully solved

# 3. Build TypeScript
pnpm -r build

# Expected output:
# @nulset/scripts: tsc
# Done
```

## Full Demo (Recommended)

```bash
cd scripts && pnpm run demo
```

**Expected output:**
```
╔═══════════════════════════════════════════════════════════╗
║                  NulSet Demo Flow                         ║
║  Privacy-Preserving Exclusion Check with ZK Proofs        ║
╚═══════════════════════════════════════════════════════════╝

============================================================
  STEP 1: Admin - Build Exclusion Tree
============================================================
=== Building SMT-lite Exclusion Tree ===

[SMT] Initialized empty tree with depth=32, leaves=4294967296
[Admin] Adding banned identifiers...
[SMT] Banned: "bob@banned.com" -> index XXXX
[SMT] Banned: "eve@malicious.org" -> index XXXX
[SMT] Banned: "sanctioned@example.com" -> index XXXX

[Admin] Computing Merkle root...
[SMT] Computed root: <root_hash>

[Admin] ✓ Root saved to circuits/root.json
[Admin] Root: <root_hash>
[Admin] Banned count: 3

============================================================
  STEP 2: User - Generate Witnesses
============================================================
=== Generating Witness Files ===

[Setup] Rebuilding tree...
[SMT] Computed root: <root_hash>

[User] Generating witness for GOOD user...
[SMT] Generated witness for "alice@example.com": index=XXXX, leaf=0 ✓ ALLOWED
[User] ✓ Good witness saved to circuits/witness_good.json

[User] Generating witness for BAD user...
[SMT] Generated witness for "bob@banned.com": index=XXXX, leaf=1 ✗ BANNED
[User] ✓ Bad witness saved to circuits/witness_bad.json

============================================================
  STEP 3: Platform - Verify Good User (alice@example.com)
============================================================

=== Generating Proof ===

[Converter] Reading witness: ../circuits/witness_good.json
[Converter] ✓ Prover.toml written to: ../circuits/Prover.toml
[Converter] Root: <root_hash>...
[Converter] Leaf value: 0 (0=allowed, 1=banned)

[Prover] Executing circuit...
[verify_nonmembership] Circuit witness successfully solved
[Prover] ✓ Witness generated: good_user.gz

[Prover] Generating proof...
[verify_nonmembership] Generating proof...
[Prover] ✓ Proof generated successfully

=== Proof Generation Complete ===

=== Verifying Proof ===

[Verifier] Proof: good_user
[Verifier] Verifying...

[verify_nonmembership] Verifying proof...
[Verifier] ✓ PROOF VALID
[Verifier] Access: GRANTED

============================================================
  STEP 4: Platform - Verify Bad User (bob@banned.com)
============================================================

[Demo] Attempting to prove bad user (should fail at circuit level)...

=== Generating Proof ===

[Converter] Reading witness: ../circuits/witness_bad.json
[Converter] ✓ Prover.toml written to: ../circuits/Prover.toml
[Converter] Leaf value: 1 (0=allowed, 1=banned)

[Prover] Executing circuit...
Error: Circuit constraint failed: "Leaf value must be 0 for non-membership"

[Demo] ✓ Bad user proof REJECTED by circuit (as expected)
[Demo] Circuit correctly enforced leaf_value == 0 constraint
[Demo] Access: DENIED

============================================================
  Demo Complete
============================================================

✓ Good user (alice@example.com):
  - Leaf value = 0 (not banned)
  - Proof generated ✓
  - Proof verified ✓
  - Access: GRANTED

✓ Bad user (bob@banned.com):
  - Leaf value = 1 (banned)
  - Proof generation FAILED ✓ (circuit constraint)
  - Access: DENIED

NulSet successfully prevents banned users from generating valid proofs!
```

## Individual Commands

### 1. Sanity Check (Optional)

```bash
cd scripts && pnpm run sanity-check
```

**Expected:**
```
=== Poseidon Hash Sanity Check ===

poseidon2([1, 2]) = <hash>
poseidon2([0, 0]) = <hash>
poseidon2([2, 1]) = <hash>

✓ TypeScript Poseidon working correctly
```

### 2. Build Exclusion Tree

```bash
cd scripts && pnpm run build-tree
```

**Expected:**
```
=== Building SMT-lite Exclusion Tree ===

[SMT] Initialized empty tree with depth=32, leaves=4294967296
[Admin] Adding banned identifiers...
[SMT] Banned: "bob@banned.com" -> index XXXX
[SMT] Banned: "eve@malicious.org" -> index XXXX
[SMT] Banned: "sanctioned@example.com" -> index XXXX

[Admin] Computing Merkle root...
[SMT] Computed root: <root_hash>
[Admin] ✓ Root saved to circuits/root.json
[Admin] Root: <root_hash>
[Admin] Banned count: 3
```

### 3. Generate Witnesses

```bash
cd scripts && pnpm run gen-witness
```

**Expected:** (see demo output above)

### 4. Generate Proof

```bash
cd scripts && tsx src/prove.ts <witness_json> <proof_name>

# Example:
cd scripts && tsx src/prove.ts ../circuits/witness_good.json good_user
```

**Expected:**
```
=== Generating Proof ===

[Prover] Witness: ../circuits/witness_good.json
[Prover] Proof name: good_user

[Converter] Reading witness: ../circuits/witness_good.json
[Converter] ✓ Prover.toml written to: ../circuits/Prover.toml
[Converter] Root: <hash>...
[Converter] Leaf value: 0 (0=allowed, 1=banned)

[Prover] Executing circuit...
[verify_nonmembership] Circuit witness successfully solved
[Prover] ✓ Witness generated: good_user.gz

[Prover] Generating proof...
[verify_nonmembership] Generating proof...
[Prover] ✓ Proof generated successfully

=== Proof Generation Complete ===
Proof artifact: circuits/proofs/good_user.proof
```

### 5. Verify Proof

```bash
cd scripts && tsx src/verify.ts <proof_name>

# Example:
cd scripts && tsx src/verify.ts good_user
```

**Expected (valid proof):**
```
=== Verifying Proof ===

[Verifier] Proof: good_user
[Verifier] Verifying...

[verify_nonmembership] Verifying proof...
[Verifier] ✓ PROOF VALID
[Verifier] Access: GRANTED
```

**Expected (invalid proof - if attempted with bad witness):**
```
=== Verifying Proof ===

[Verifier] Proof: bad_user
[Verifier] Verifying...

Error: Proof verification failed

[Verifier] ✗ PROOF INVALID
[Verifier] Access: DENIED
```

## Exit Codes

- `0` - Success
- `1` - Verification failed (proof invalid)
- `2` - Fatal error (file not found, circuit error, etc.)

## Files Generated

After running the demo:

```
circuits/
  ├── root.json              # Merkle root + banned indices
  ├── witness_good.json      # Witness for alice (leaf=0)
  ├── witness_bad.json       # Witness for bob (leaf=1)
  ├── Prover.toml           # TOML input (generated from witness)
  ├── good_user.gz          # Executed witness
  └── proofs/
      └── good_user.proof   # Generated proof
```

## Troubleshooting

### "Circuit not found"
- Ensure you're running from `scripts/` directory
- Check `../circuits/Nargo.toml` exists

### "Proof not found"
- Run `prove.ts` before `verify.ts`
- Check proof name matches

### "Constraint failed: Leaf value must be 0"
- Expected for banned users
- This is the security mechanism working correctly
