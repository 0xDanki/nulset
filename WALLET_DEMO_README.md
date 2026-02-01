# Wallet Demo - $NUL Token Faucet

## 🎯 Overview

This branch (`wallet-demo`) implements a **wallet-connected faucet** that distributes mock **$NUL tokens** using zero-knowledge exclusion proofs. Users connect their Web3 wallet, prove they're not banned (without revealing the ban list), and claim 5 $NUL tokens.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd web
pnpm install
```

### 2. Run Development Server

```bash
pnpm run dev
```

### 3. Open in Browser

Navigate to `http://localhost:5173/faucet`

---

## 💰 $NUL Token Specs

| Property | Value |
|----------|-------|
| **Name** | NulSet Token |
| **Symbol** | $NUL |
| **Supply** | 1,000,000,000 (1 billion) |
| **Claim Amount** | 5 $NUL per claim |
| **Cooldown** | 24 hours between claims |
| **Type** | Mock token (demo only) |

---

## 🔗 Features

### ✅ Implemented

- [x] **Wallet Connection** - RainbowKit integration (MetaMask, WalletConnect, etc.)
- [x] **Balance Tracking** - localStorage-based balance per address
- [x] **Ban Check** - Client-side check before proof generation
- [x] **ZK Proof Generation** - Groth16 proof using wallet address
- [x] **Proof Verification** - Client-side verification
- [x] **Token Distribution** - Mock 5 $NUL tokens per claim
- [x] **Cooldown Timer** - 24-hour cooldown with live countdown
- [x] **Success Animation** - Confetti on successful claim
- [x] **Claim History** - Track all claims in localStorage
- [x] **Mobile Responsive** - Works on mobile wallets
- [x] **Error Handling** - Graceful error messages

### 🎨 User Flow

```
1. User visits /faucet
   ↓
2. Connects wallet (RainbowKit)
   ↓
3. System checks if address is banned
   ↓
4. If NOT banned:
   - Click "Claim 5 $NUL"
   - Generate ZK proof (10-30s)
   - Verify proof
   - Receive 5 $NUL tokens (mock)
   - See confetti animation 🎉
   - 24-hour cooldown starts
   ↓
5. If BANNED:
   - See "Address is banned" message
   - Cannot claim tokens
```

---

## 📁 New Files

### Core Files

- **`web/src/pages/platform/Faucet.tsx`** - Main faucet page with wallet connection
- **`web/src/lib/nulset/balance-manager.ts`** - Balance & claim management
- **`web/src/wagmi.config.ts`** - Wagmi/RainbowKit configuration
- **`WALLET_DEMO_CONTEXT.md`** - Technical context & architecture
- **`WALLET_DEMO_RULES.md`** - Development rules & standards

### Modified Files

- **`web/package.json`** - Added RainbowKit, wagmi, viem, confetti
- **`web/src/main.tsx`** - Added RainbowKit providers
- **`web/src/App.tsx`** - Added `/faucet` route

---

## 🧪 Testing

### Manual Test Scenarios

#### Scenario 1: Fresh User (Happy Path)
1. Connect wallet with a **non-banned** address
2. Should see "✅ Ready to claim 5 $NUL"
3. Click "Claim 5 $NUL"
4. Wait for proof generation (10-30s)
5. See success message + confetti
6. Balance updates: 0 → 5 $NUL
7. Cooldown starts (24h)

#### Scenario 2: Banned User
1. Add your address to ban list in Admin panel
2. Connect wallet
3. Should see "❌ Your address is on the ban list"
4. "Claim" button disabled
5. Cannot generate proof

#### Scenario 3: Cooldown Active
1. Claim tokens successfully
2. Try to claim again immediately
3. Should see "⏰ Next claim in 23h 59m"
4. Button disabled
5. Timer counts down

#### Scenario 4: Multiple Claims
1. First claim: 0 → 5 $NUL
2. Clear localStorage or wait 24h
3. Second claim: 5 → 10 $NUL
4. Balance accumulates correctly

### Mobile Wallet Testing

Test on these mobile wallets:
- ✅ MetaMask Mobile
- ✅ Trust Wallet
- ✅ Coinbase Wallet
- ✅ Rainbow Wallet

---

## 💾 Data Storage

All data is stored in **localStorage** (client-side only):

### `nulset_balances`
```json
{
  "0x123...abc": {
    "balance": 10,
    "lastClaim": 1706832000000,
    "totalClaims": 2
  }
}
```

### `nulset_claims`
```json
{
  "claims": [
    {
      "address": "0x123...abc",
      "amount": 5,
      "timestamp": 1706832000000,
      "txHash": "0xabc...def",
      "proofGenTime": 15234
    }
  ]
}
```

### `nulset_admin_state` (from Admin panel)
```json
{
  "bannedList": ["0xbad...000", "0xbad...001"],
  "root": "12345...",
  "timestamp": "2026-02-01T..."
}
```

---

## 🔐 Privacy & Security

### ✅ Privacy Preserved
- Ban list stays private (never leaves client)
- ZK proof reveals nothing about ban list
- No external API calls for ban checks
- All verification happens client-side

### ⚠️ Demo Limitations
- **No real tokens** - $NUL is simulated (localStorage)
- **No blockchain TX** - Mock transaction hashes
- **Client-side only** - Can be reset by clearing localStorage
- **No backend** - Everything runs in browser

---

## 🛠️ Development

### Build for Production

```bash
cd web
pnpm run build
```

### Lint Code

```bash
pnpm run lint
```

### Clear All Data (Testing)

Open browser console and run:
```javascript
localStorage.clear()
location.reload()
```

---

## 📊 Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Wallet**: RainbowKit + wagmi + viem
- **Network**: Base Sepolia (testnet) ⭐
- **ZK Proofs**: Groth16 (snarkjs)
- **Merkle Tree**: Poseidon hash (circomlibjs)
- **Styling**: Tailwind CSS
- **Animation**: canvas-confetti

### Component Structure
```
Faucet.tsx (main page)
  ├── WalletStatus (RainbowKit ConnectButton)
  ├── BalanceCard (show $NUL balance)
  ├── ClaimStatusCard (eligibility status)
  ├── ClaimButton (main CTA)
  ├── LoadingStates (proof generation progress)
  └── ResultCard (success/error message)
```

---

## 🚀 Next Steps (Future)

### Phase 2: Real ERC-20 Token (Base Sepolia)
- Deploy actual $NUL token contract on Base Sepolia
- Real blockchain transactions
- Backend API for rate limiting
- Database for claim tracking

### Phase 3: Onchain Verification (Base Sepolia)
- Deploy Groth16 verifier contract on Base Sepolia
- Onchain proof verification
- Smart contract faucet
- Gas optimization
- Bridge to Base mainnet

### Phase 4: Advanced Features
- Referral system (bonus tokens)
- Daily quests
- Leaderboard
- Social sharing

---

## 📚 Documentation

- **Context**: See `WALLET_DEMO_CONTEXT.md`
- **Rules**: See `WALLET_DEMO_RULES.md`
- **Main README**: See `../README.md`
- **Onchain Roadmap**: See `../ONCHAIN_ROADMAP.md`

---

## 🐛 Troubleshooting

### Issue: Wallet won't connect
- **Solution**: Check browser console for errors. Try different wallet.

### Issue: Proof generation fails
- **Solution**: Ensure ban list is uploaded in Admin panel. Check if address is banned.

### Issue: "No ban list configured"
- **Solution**: Go to `/admin` and upload a ban list (CSV or JSON).

### Issue: Cooldown not working
- **Solution**: Clear localStorage and try again. Check browser time is correct.

### Issue: Balance not updating
- **Solution**: Refresh page. Check localStorage for `nulset_balances`.

---

## 📝 Notes

- This is a **demo/hackathon** implementation
- **No real tokens** are distributed
- All data is **client-side** (localStorage)
- Can be reset by clearing browser data
- Not production-ready (no backend, no security)

---

**Built with ❤️ for NulSet - Privacy-Preserving Exclusion Verification**
