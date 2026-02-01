# ✅ On-Chain NulSet Faucet - Complete Setup

## 🎉 What's Been Built

You now have a **fully functional on-chain $NUL faucet** ready for Base Sepolia deployment!

---

## 📁 New Files Created

### Smart Contracts (`contracts/`)
```
contracts/
├── foundry.toml                    # Foundry configuration
├── .gitignore                      # Git ignore for contracts
├── src/
│   ├── NulToken.sol                # ERC-20 $NUL token ✓
│   ├── NulSetFaucet.sol            # Faucet with ZK verification ✓
│   └── Groth16Verifier.sol         # (Generated from circuit)
├── script/
│   └── Deploy.s.sol                # Deployment script ✓
└── README.md                       # Contract documentation ✓
```

### Frontend Updates (`web/src/`)
```
web/src/
├── contracts/
│   ├── abis/
│   │   ├── NulToken.json           # Token ABI ✓
│   │   └── NulSetFaucet.json       # Faucet ABI ✓
│   ├── hooks/
│   │   ├── useNulToken.ts          # Token read hooks ✓
│   │   └── useFaucet.ts            # Faucet interaction hooks ✓
│   └── config.ts                   # Contract addresses (UPDATE AFTER DEPLOY)
├── pages/platform/
│   ├── Faucet.tsx                  # Mock faucet (localhost)
│   └── FaucetOnchain.tsx           # Real on-chain faucet ✓
└── App.tsx                         # Updated routing ✓
```

### Documentation
```
├── DEPLOYMENT_GUIDE.md             # Step-by-step deployment ✓
├── WALLET_DEMO_BASE_SEPOLIA.md     # Base Sepolia integration guide ✓
├── contracts/README.md             # Contract documentation ✓
└── scripts/export-verifier.sh      # Verifier export script ✓
```

---

## 🚀 Quick Start - Deploy in 10 Minutes

### 1. Get Prerequisites (2 min)
```bash
# Install Foundry (if not installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Get Base Sepolia ETH
# Visit: https://www.coinbase.com/faucets
```

### 2. Install Dependencies (1 min)
```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

### 3. Export Verifier (1 min)
```bash
cd ..
chmod +x scripts/export-verifier.sh
./scripts/export-verifier.sh
```

### 4. Build Contracts (1 min)
```bash
cd contracts
forge build
```

### 5. Get Merkle Root (1 min)
1. Open http://localhost:5173/admin
2. Upload ban list
3. Copy Merkle root

### 6. Configure Environment (1 min)
```bash
cd contracts
cat > .env << EOF
RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key_without_0x
INITIAL_ROOT=your_merkle_root_from_admin_panel
EOF
```

### 7. Deploy! (2 min)
```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url base_sepolia \
  --broadcast \
  -vvvv
```

Save the addresses! Example output:
```
Contract Addresses:
  NulToken: 0xabcd...ef01
  Groth16Verifier: 0x2345...6789
  NulSetFaucet: 0x3456...789a
```

### 8. Update Frontend (1 min)
Edit `web/src/contracts/config.ts`:
```typescript
84532: {
  nulToken: '0xYOUR_TOKEN_ADDRESS',
  faucet: '0xYOUR_FAUCET_ADDRESS',
  verifier: '0xYOUR_VERIFIER_ADDRESS',
},
```

### 9. Test! (1 min)
```bash
cd web
pnpm install
pnpm run dev
```

Visit http://localhost:5173/faucet-onchain

---

## 🎯 What Each Component Does

### Smart Contracts

#### 1. NulToken.sol
- Standard ERC-20 token
- Name: "NulSet Token"
- Symbol: "$NUL"
- Supply: 1 billion tokens
- Ownable for emergency minting

#### 2. Groth16Verifier.sol
- Exported from your circuit
- Verifies zero-knowledge proofs
- Checks Groth16 proof validity
- No state, pure verification

#### 3. NulSetFaucet.sol
- Distributes 5 $NUL per claim
- 24-hour cooldown per address
- Requires valid ZK proof
- Verifies proof on-chain
- Checks Merkle root matches
- Emits events for tracking
- Owner can update root

### Frontend

#### 1. useNulToken Hook
- Reads user balance from blockchain
- Reads total supply
- Auto-refreshes on changes

#### 2. useFaucet Hook
- Reads faucet balance
- Reads user stats (claims, last claim)
- Checks cooldown status
- Submits claim transactions
- Waits for confirmations

#### 3. FaucetOnchain Page
- Connects to Base Sepolia
- Shows real on-chain balance
- Generates ZK proof locally
- Submits to smart contract
- Shows transaction on BaseScan
- Enforces cooldown
- Blocks banned users

---

## 🔄 User Flow (On-Chain)

```
1. User visits /faucet-onchain
   ↓
2. Connects wallet & switches to Base Sepolia
   ↓
3. Sees balance: 0 $NUL (from blockchain)
   ↓
4. Sees status: "✅ Ready to claim 5 $NUL"
   ↓
5. Clicks "Claim 5 $NUL"
   ↓
6. Frontend checks ban list (client-side)
   ↓
7. Generates ZK proof (~30s)
   ↓
8. Verifies proof locally
   ↓
9. Submits to smart contract
   ↓
10. Smart contract verifies proof
    ↓
11. Smart contract checks cooldown
    ↓
12. Smart contract transfers 5 $NUL
    ↓
13. Transaction confirms (~2s)
    ↓
14. Balance updates: 0 → 5 $NUL
    ↓
15. Confetti! 🎉
    ↓
16. Cooldown starts: 24 hours
    ↓
17. View TX on BaseScan
```

---

## 📊 Comparison: Mock vs On-Chain

| Feature | Mock Faucet | On-Chain Faucet |
|---------|-------------|-----------------|
| **Tokens** | localStorage | Real ERC-20 |
| **Balance** | Client-side | Blockchain |
| **Verification** | Client-side | Smart contract |
| **Cooldown** | localStorage | Smart contract |
| **Persistence** | Browser only | Blockchain forever |
| **Cost** | Free | ~$0.03 per claim |
| **Speed** | Instant | ~2s |
| **Proof of claim** | None | On-chain TX |
| **Transferable** | No | Yes |
| **Trustless** | No | Yes ✓ |

---

## 🎯 Testing Scenarios

### Scenario 1: Fresh User (Happy Path)
1. Connect wallet
2. Should see: 0 $NUL balance
3. Should see: "✅ Ready to claim 5 $NUL"
4. Click "Claim 5 $NUL"
5. Wait ~30s for proof
6. Approve transaction in wallet
7. Wait ~2s for confirmation
8. See: "🎉 Claim Successful!"
9. Balance updates: 0 → 5 $NUL
10. TX visible on BaseScan
11. Cooldown timer: "23h 59m remaining"

### Scenario 2: Banned User
1. Add address to ban list (Admin panel)
2. Update Merkle root on-chain
3. Connect wallet
4. Should see: "❌ Your address is on the ban list"
5. Button disabled
6. Cannot claim

### Scenario 3: Cooldown Active
1. User already claimed recently
2. Connect wallet
3. Should see: "⏰ Next claim in 23h 45m"
4. Button disabled
5. Timer counts down
6. Can claim after 24h

### Scenario 4: Wrong Network
1. Connect on Ethereum mainnet
2. Should see: "🌐 Wrong Network"
3. Button: "Switch to Base Sepolia"
4. Click to switch
5. Wallet prompts network change

---

## 💰 Economics

### Initial Distribution
- Total supply: 1,000,000,000 $NUL
- Faucet receives: 100,000,000 $NUL (10%)
- Claims available: 20,000,000 claims (100M / 5)
- Per user: 5 $NUL per 24 hours

### Gas Costs (Base Sepolia)
- Deploy all contracts: ~$0.50
- Claim tokens: ~$0.03
- Update root: ~$0.005
- Very affordable! 🎉

---

## 🔧 Admin Operations

### Update Ban List
1. Upload new list in Admin panel
2. Get new Merkle root
3. Update on-chain:
```bash
cast send $FAUCET_ADDRESS \
  "updateRoot(uint256)" \
  $NEW_ROOT \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY
```

### Check Faucet Balance
```bash
cast call $FAUCET_ADDRESS \
  "getFaucetBalance()(uint256)" \
  --rpc-url https://sepolia.base.org
```

### Refill Faucet
```bash
cast send $TOKEN_ADDRESS \
  "transfer(address,uint256)" \
  $FAUCET_ADDRESS \
  $AMOUNT \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY
```

---

## 📈 Monitoring

### On BaseScan
- Token transfers: https://sepolia.basescan.org/token/$TOKEN_ADDRESS
- Faucet activity: https://sepolia.basescan.org/address/$FAUCET_ADDRESS
- User claims: Filter by "Claimed" event

### Frontend Analytics
- Total claims: Check `totalClaimCount` on contract
- Total distributed: Check `totalDistributed` on contract
- Faucet balance: Check `getFaucetBalance()`

---

## 🔐 Security Features

### Smart Contract
- ✅ ReentrancyGuard on claim function
- ✅ Ownable (only owner can update root)
- ✅ ZK proof verification on-chain
- ✅ Cooldown enforcement
- ✅ Balance checks before transfer
- ✅ Events for all actions

### Frontend
- ✅ Ban check before proof generation (saves gas)
- ✅ Local proof verification (catches errors early)
- ✅ Root verification (client vs on-chain)
- ✅ Network check (must be Base Sepolia)
- ✅ Error handling with user-friendly messages

### Privacy
- ✅ Ban list never sent to contract
- ✅ Only proof + root submitted
- ✅ ZK proof reveals nothing about ban list
- ✅ User privacy preserved

---

## ✅ Definition of Done

Your faucet is complete when:

- [x] Smart contracts written ✓
- [x] Deployment script ready ✓
- [x] Frontend hooks created ✓
- [x] On-chain faucet page built ✓
- [x] Documentation complete ✓
- [ ] Contracts deployed to Base Sepolia (DO THIS)
- [ ] Frontend config updated with addresses (DO THIS)
- [ ] End-to-end testing passed (DO THIS)
- [ ] Verified on BaseScan (DO THIS)

---

## 🎉 You're Ready!

Everything is set up. Just follow `DEPLOYMENT_GUIDE.md` to deploy!

### Quick Deploy Command:
```bash
# From project root:
./scripts/export-verifier.sh
cd contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge build
# Set up .env file
forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --broadcast -vvvv
# Update web/src/contracts/config.ts with addresses
cd ../web
pnpm run dev
# Test at http://localhost:5173/faucet-onchain
```

---

## 📚 Documentation

- **DEPLOYMENT_GUIDE.md** - Step-by-step deployment
- **contracts/README.md** - Contract documentation
- **WALLET_DEMO_BASE_SEPOLIA.md** - Integration guide
- **ONCHAIN_ROADMAP.md** - Future plans

---

**🚀 Ready to deploy? Start with `DEPLOYMENT_GUIDE.md`!**

**Good luck! 🎉**
