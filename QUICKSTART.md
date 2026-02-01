# NulSet Quickstart (5 Minutes)

## What is NulSet?

Privacy-preserving exclusion verification using zero-knowledge proofs. Prove you're NOT on a banned list without revealing the list or your identity details.

## Use Case: Anti-Sybil Faucet Gate

Crypto faucets can prevent banned addresses from claiming tokens while preserving privacy.

---

## Setup & Run

```bash
# 1. Install dependencies
cd ~/nulset/web
pnpm install

# 2. Start dev server
pnpm run dev

# Should see: ➜ Local: http://localhost:3000/
```

---

## Test the Demo (3 Steps)

### **Step 1: Admin Panel** - Upload Ban List
```
1. Go to: http://localhost:3000/admin
2. Upload: test-data/demo-banned-list.json
3. Click: "Build Exclusion Tree"
4. ✅ See Merkle root displayed
```

### **Step 2: Faucet Demo** - Test Good User
```
1. Go to: http://localhost:3000/platform
2. Enter ID: 8888888888888888888
3. Click: "Claim Faucet Tokens"
4. Wait: 30-60 seconds (ZK proof generation)
5. ✅ See: "Access Granted" 
```

### **Step 3: Test Banned User**
```
1. Enter ID: 1234567890123456789
2. Click: "Claim Faucet Tokens"
3. ✅ See: "Access Denied" (in ban list)
```

---

## What Just Happened?

1. **Admin** uploaded banned IDs → built sparse Merkle tree (depth 32)
2. **User** entered their ID → system generated Merkle witness
3. **System** created Groth16 ZK proof (10-30s) proving non-membership
4. **Verifier** checked proof cryptographically → granted/denied access

**Privacy:** Verifier only sees proof + root. They don't see:
- The full ban list
- User's Merkle path
- Other users' status

---

## Architecture

```
Admin: Upload IDs → Build SMT → Publish Root
  ↓
User: Enter ID → Generate Witness → Create ZK Proof
  ↓
Platform: Verify Proof → Grant/Deny Access
```

**Tech Stack:**
- **Circuit**: Circom (depth-32 SMT)
- **Proof System**: Groth16 (snarkjs)
- **Hash**: Poseidon (SNARK-friendly)
- **Frontend**: React + Vite + TypeScript

---

## Backend Demo (Optional)

Test proof generation via CLI:

```bash
cd ~/nulset/scripts
pnpm run demo

# Shows full flow:
# 1. Build tree
# 2. Generate witnesses  
# 3. Create proofs
# 4. Verify proofs
```

---

## Next Steps

- **Deployment**: See `ONCHAIN_ROADMAP.md` for smart contract integration
- **Production**: Add backend persistence for roots
- **Multi-platform**: Support multiple ban lists

---

**Documentation:**
- `README.md` - Full project overview
- `circuits/` - Circom circuit source
- `scripts/` - Backend CLI demos

**Ready for hackathon presentation!** 🚀
