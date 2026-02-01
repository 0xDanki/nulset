# Wallet Demo - Technical Context

## 🎯 Mission

Transform NulSet demo into a wallet-connected faucet that distributes **$NUL tokens** using zero-knowledge exclusion proofs. Users prove they're not banned without revealing the ban list.

---

## 💰 $NUL Token Specification

### Token Details
- **Name**: NulSet Token
- **Symbol**: $NUL
- **Supply**: 1,000,000,000 $NUL (1 billion tokens)
- **Decimals**: 18 (standard ERC-20)
- **Purpose**: Demo token for testing NulSet exclusion proofs

### Faucet Rules
- ✅ **Non-banned users**: Receive **5 $NUL** per claim
- ❌ **Banned users**: Receive **0 $NUL** (rejected before claim)
- ⏰ **Cooldown**: 24 hours between claims per address
- 🎯 **Verification**: ZK proof required (proves non-membership)

### Mock Token Behavior
```
User connects wallet
  ↓
Checks against ban list (via ZK proof)
  ↓
If NOT banned → Generate proof → Claim 5 $NUL
If BANNED → Reject before proof generation
  ↓
Update UI with new balance (simulated)
```

---

## 🏗️ Architecture

### Current State (main branch)
```
Manual Input → Any string → Generate Proof → Verify → Show Result
```

### Target State (wallet-demo branch)
```
Connect Wallet → Get Address → Check Ban Status
    ↓                              ↓
    │                         If Banned: Reject
    │                              ↓
    │                         If Not Banned:
    │                              ↓
    └─→ Derive idx from address → Generate ZK Proof
                                      ↓
                                 Verify Proof
                                      ↓
                                 Claim 5 $NUL
                                      ↓
                            Update Balance (mock)
                                      ↓
                            Record Claim (localStorage)
                                      ↓
                            Show Success + TX Hash (mock)
```

---

## 🔗 Wallet Integration

### Supported Wallets (via RainbowKit)
- MetaMask
- WalletConnect
- Coinbase Wallet
- Rainbow
- Trust Wallet
- Any injected wallet

### Network Support
**Primary**: Any EVM-compatible chain (wallet-agnostic)
- Ethereum Mainnet
- Base
- Arbitrum
- Optimism
- Polygon
- Local/Testnet

**Note**: This is a pure client-side demo. No real blockchain transactions occur.

---

## 📊 Data Flow

### Step 1: Wallet Connection
```typescript
User clicks "Connect Wallet"
  ↓
RainbowKit modal opens
  ↓
User selects wallet & approves
  ↓
Frontend receives: address, chainId
  ↓
Display: "Connected: 0x123...abc"
```

### Step 2: Ban Check (Client-Side)
```typescript
Load admin-uploaded ban list (localStorage)
  ↓
Check if address in ban list
  ↓
If banned:
  - Show: "Address is banned"
  - Disable: "Claim Faucet" button
  - Stop: No proof generation
  ↓
If not banned:
  - Enable: "Claim Faucet" button
  - Continue to Step 3
```

### Step 3: Proof Generation
```typescript
Derive idx = Poseidon(address, "NULSET")
  ↓
Build Merkle tree from ban list
  ↓
Generate witness for address
  ↓
Create Groth16 proof (10-30s)
  ↓
Verify proof client-side
  ↓
Continue to Step 4
```

### Step 4: Mock Faucet Claim
```typescript
Proof valid?
  ↓ YES
Check claim history (localStorage)
  ↓
Already claimed in last 24h?
  ↓ NO
Record claim:
  - Address: 0x123...
  - Amount: 5 $NUL
  - Timestamp: Date.now()
  - TxHash: mock-0x[random]
  ↓
Update mock balance:
  - Previous: 0 $NUL
  - New: 5 $NUL
  ↓
Display success:
  - "Claimed 5 $NUL!"
  - Show mock transaction hash
  - Show new balance
  - Confetti animation 🎉
```

---

## 💾 State Management

### localStorage Schema

#### Ban List State (from Admin)
```typescript
interface NulSetState {
  root: string;
  bannedList: string[];  // Array of banned addresses
  timestamp: number;
  depth: number;
}

Key: 'nulset_state'
```

#### Claim Records (from Faucet)
```typescript
interface ClaimRecord {
  address: string;
  amount: number;        // Always 5 for demo
  timestamp: number;
  txHash: string;        // Mock hash
  proofGenTime: number;  // Time taken to generate proof
}

interface ClaimHistory {
  claims: ClaimRecord[];
}

Key: 'nulset_claims'
```

#### Mock Balance (per address)
```typescript
interface BalanceState {
  [address: string]: {
    balance: number;      // Total $NUL balance
    lastClaim: number;    // Timestamp of last claim
    totalClaims: number;  // Number of successful claims
  }
}

Key: 'nulset_balances'
```

---

## 🎨 User Interface

### Faucet Page Layout
```
┌─────────────────────────────────────────┐
│  NulSet Faucet                          │
│  Zero-Knowledge Token Distribution       │
├─────────────────────────────────────────┤
│                                         │
│  [Connect Wallet Button]                │
│   or                                    │
│  Connected: 0x123...abc [Disconnect]    │
│                                         │
│  Your Balance: 5.00 $NUL                │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Claim 5 $NUL] (disabled if banned)   │
│                                         │
│  Cooldown: 23h 45m remaining            │
│   or                                    │
│  ✅ Ready to claim                      │
│                                         │
├─────────────────────────────────────────┤
│  Status: Generating proof...            │
│  Progress: [=====>    ] 50%             │
├─────────────────────────────────────────┤
│  ✅ Success!                            │
│  Claimed: 5 $NUL                        │
│  TX: 0xabc...def (mock)                 │
│  New Balance: 10.00 $NUL                │
└─────────────────────────────────────────┘
```

### Wallet Connection States

**State 1: Disconnected**
```
┌─────────────────────────┐
│  Connect Wallet to      │
│  Claim $NUL Tokens      │
│                         │
│  [🔌 Connect Wallet]    │
└─────────────────────────┘
```

**State 2: Connected (Not Banned)**
```
┌─────────────────────────────┐
│  Connected: 0x123...abc     │
│  Balance: 0 $NUL            │
│  Status: ✅ Eligible        │
│                             │
│  [💧 Claim 5 $NUL]          │
│  [Disconnect]               │
└─────────────────────────────┘
```

**State 3: Connected (Banned)**
```
┌─────────────────────────────┐
│  Connected: 0xbad...000     │
│  Status: ❌ Address Banned  │
│                             │
│  You cannot claim tokens    │
│  [Disconnect]               │
└─────────────────────────────┘
```

**State 4: Generating Proof**
```
┌─────────────────────────────┐
│  Generating ZK Proof...     │
│  [=====>      ] 50%         │
│                             │
│  Step 2/3: Creating proof   │
│  Est. time: 15 seconds      │
└─────────────────────────────┘
```

**State 5: Claim Success**
```
┌─────────────────────────────┐
│  ✅ Claim Successful!       │
│                             │
│  + 5 $NUL                   │
│  New Balance: 5.00 $NUL     │
│                             │
│  TX: 0xabc...def            │
│  Next claim: 23h 59m        │
│                             │
│  [Close]                    │
└─────────────────────────────┘
```

---

## 🔐 Security & Privacy

### Client-Side Only
- ✅ **No backend**: Everything runs in browser
- ✅ **No real tokens**: $NUL is simulated (localStorage)
- ✅ **No blockchain TX**: Mock transaction hashes
- ✅ **Privacy preserved**: Ban list never leaves client
- ✅ **ZK properties maintained**: Proofs reveal nothing

### Ban List Privacy
```
Admin uploads ban list
  ↓
Stored in localStorage (client-side)
  ↓
User generates proof locally
  ↓
Proof reveals:
  - ✅ "Valid" or "Invalid"
  - ❌ NOT: Which addresses are banned
  - ❌ NOT: User's position in tree
  - ❌ NOT: Tree size
```

### Mock Security (Demo Safety)
- Can't lose real money (no real tokens)
- Can't compromise real wallets (read-only)
- Can't spam blockchain (no TX)
- Can reset state (clear localStorage)

---

## 🎯 Success Criteria

### Functional Requirements
- [x] User can connect wallet
- [x] System detects if address is banned
- [x] Non-banned users can generate proof
- [x] Proof generation works with wallet address
- [x] Successful claim gives 5 $NUL (simulated)
- [x] Balance updates correctly
- [x] 24-hour cooldown enforced
- [x] Banned users cannot claim
- [x] Mock transaction hash shown

### User Experience Requirements
- [x] Wallet connection < 3 seconds
- [x] Clear loading states during proof generation
- [x] Intuitive error messages
- [x] Mobile responsive
- [x] Works with popular wallets
- [x] Smooth animations
- [x] Confetti on success 🎉

### Privacy Requirements
- [x] Ban list stays private
- [x] ZK proof properties maintained
- [x] No external API calls for ban checks
- [x] Client-side verification only

---

## 🧪 Test Scenarios

### Scenario 1: Fresh User (Happy Path)
1. Connect wallet (good address)
2. See "Eligible" status
3. Click "Claim 5 $NUL"
4. Wait for proof (10-30s)
5. See success message
6. Balance updates: 0 → 5 $NUL
7. Cooldown starts (24h)

### Scenario 2: Banned User
1. Connect wallet (banned address)
2. See "Address Banned" status
3. "Claim" button disabled
4. Cannot generate proof
5. Balance stays 0 $NUL

### Scenario 3: Repeated Claim (Cooldown)
1. Connect wallet (already claimed)
2. See "Next claim: 23h 45m"
3. "Claim" button disabled
4. Can check balance
5. Must wait for cooldown

### Scenario 4: Multiple Claims (After Cooldown)
1. First claim: 0 → 5 $NUL
2. Wait 24 hours (or clear localStorage for demo)
3. Second claim: 5 → 10 $NUL
4. Third claim: 10 → 15 $NUL
5. Balance accumulates

---

## 📊 Metrics to Track

### Usage Metrics (localStorage)
- Total claims across all addresses
- Total $NUL distributed
- Average proof generation time
- Failed attempts (banned users)
- Unique addresses claiming

### Performance Metrics
- Wallet connection time
- Proof generation time (target: <30s)
- UI responsiveness
- Mobile performance

---

## 🔄 Integration with Existing System

### Reuse from Current Demo
- ✅ `tree-browser.ts` - Tree building logic
- ✅ `wrapper.ts` - Proof generation
- ✅ `state-manager.ts` - Ban list management
- ✅ Admin panel - Ban list upload
- ✅ Circuit files - Groth16 verification

### New Components
- 🆕 Wallet connection (RainbowKit)
- 🆕 $NUL balance display
- 🆕 Claim button + logic
- 🆕 Cooldown timer
- 🆕 Transaction mock
- 🆕 Success animations

### Modified Components
- 🔄 Demo.tsx → Faucet.tsx (wallet-based)
- 🔄 Address input → Wallet connect button
- 🔄 Manual ID → Automatic address

---

## 💡 Future Enhancements (Out of Scope)

### Phase 2: Real ERC-20 Token
- Deploy actual $NUL token contract
- Real blockchain transactions
- Gas fee handling
- Faucet contract with ZK verifier

### Phase 3: Multi-Chain Support
- Deploy on multiple chains
- Cross-chain claiming
- Bridge support

### Phase 4: Advanced Features
- Referral system (5 $NUL bonus)
- Daily quests (bonus tokens)
- Leaderboard (top claimers)
- Social sharing

---

## 🚀 Deployment

### Current: Client-Side Demo
- Deployed at: `nulset.vercel.app/platform`
- No backend required
- Works offline (after first load)
- Shareable link

### Future: With Real Tokens
- Smart contract deployment
- Backend API for rate limiting
- Database for claim tracking
- Monitoring & analytics

---

## 📚 References

### Tools & Libraries
- **RainbowKit**: https://www.rainbowkit.com/
- **wagmi**: https://wagmi.sh/
- **viem**: https://viem.sh/
- **React**: https://react.dev/

### Design Inspiration
- Uniswap faucets
- ENS faucets
- Polygon faucets
- Base faucets

---

**This context establishes the wallet demo foundation. See WALLET_DEMO_RULES.md for implementation standards.**
