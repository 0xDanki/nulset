# NulSet Project Structure

## 📁 Clean Repository Layout

```
nulset/
├── circuits/                    # Zero-knowledge circuits
│   ├── verify_nonmembership.circom
│   └── compiled/
│       ├── verification_key.json
│       ├── verify_nonmembership_0000.zkey
│       └── verify_nonmembership_js/
│           └── verify_nonmembership.wasm
│
├── scripts/                     # Backend CLI tools
│   └── src/
│       ├── tree.ts              # Sparse Merkle tree implementation
│       ├── build_tree.ts        # Build exclusion tree
│       ├── gen_witness.ts       # Generate Merkle witnesses
│       ├── prove_circom.ts      # Generate & verify proofs
│       ├── demo.ts              # End-to-end demo
│       └── sanity_check.ts      # Hash compatibility test
│
├── web/                         # Frontend application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   └── Upload.tsx   # Admin panel (upload ban lists)
│   │   │   └── platform/
│   │   │       └── Demo.tsx     # Faucet demo (ZK verification)
│   │   ├── lib/
│   │   │   └── nulset/          # Browser ZK proof wrapper
│   │   │       ├── types.ts
│   │   │       ├── wrapper.ts   # Groth16 proof generation
│   │   │       └── tree-browser.ts
│   │   ├── App.tsx              # Main app & routing
│   │   ├── main.tsx             # Entry point
│   │   └── polyfills.ts         # Node.js compatibility
│   ├── public/
│   │   └── circuits/            # Circuit files for browser
│   └── test-data/
│       ├── demo-banned-list.json
│       ├── banned-list.json
│       └── banned-list.csv
│
├── README.md                    # Main documentation
├── QUICKSTART.md                # 5-minute setup guide
└── ONCHAIN_ROADMAP.md          # Future blockchain integration

```

## 🎯 Core Components

### **Circuits**
- **File**: `circuits/verify_nonmembership.circom`
- **Purpose**: Groth16 ZK circuit for non-membership proof
- **Depth**: 32 (4.3 billion identifiers)
- **Hash**: Poseidon

### **Backend Scripts**
- **Purpose**: CLI tools for tree building, proof generation
- **Language**: TypeScript
- **Run**: `cd scripts && pnpm run demo`

### **Frontend Web App**
- **Purpose**: User-friendly interface for admins and users
- **Framework**: Vite + React + TypeScript
- **Run**: `cd web && pnpm run dev`

## 🧪 Testing

### Quick Test
```bash
# Backend (CLI)
cd scripts && pnpm run demo

# Frontend (Browser)
cd web && pnpm run dev
# Open: http://localhost:3000
```

### Full Flow
1. **Admin**: Upload `demo-banned-list.json` → Build tree
2. **User**: Enter ID `8888888888888888888` → Claim faucet
3. **Result**: Access granted (not banned)
4. **Test Banned**: Enter `1234567890123456789` → Access denied

## 📚 Documentation

- **README.md** - Project overview, architecture, usage
- **QUICKSTART.md** - 5-minute walkthrough
- **ONCHAIN_ROADMAP.md** - Future smart contract integration
- **web/test-data/README.md** - Test data guide

## 🚀 Ready for Demo

The repo is clean and runnable:
- ✅ No broken imports
- ✅ No stale documentation
- ✅ Backend works (`pnpm run demo`)
- ✅ Frontend works (`pnpm run dev`)
- ✅ Ready for git commit
