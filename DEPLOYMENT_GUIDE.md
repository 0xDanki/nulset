# NulSet Faucet - Base Sepolia Deployment Guide

This guide will walk you through deploying the NulSet faucet with real $NUL tokens on Base Sepolia.

---

## 📋 Prerequisites

- [x] Foundry installed (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- [x] Node.js & pnpm installed
- [x] Base Sepolia ETH in your wallet (get from [faucet](https://www.coinbase.com/faucets))
- [x] Private key ready (NEVER commit this!)
- [x] Ban list uploaded in Admin panel (for Merkle root)

---

## 🚀 Step-by-Step Deployment

### Step 1: Install Foundry Dependencies

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

### Step 2: Export Groth16 Verifier from Circuit

```bash
cd ..
chmod +x scripts/export-verifier.sh
./scripts/export-verifier.sh
```

This will:
- Export the verifier from your circuit
- Save it to `contracts/src/Groth16Verifier.sol`
- Update the contract name and pragma

### Step 3: Build Contracts

```bash
cd contracts
forge build
```

You should see:
```
[⠢] Compiling...
[⠆] Compiling 3 files with 0.8.24
[⠰] Solc 0.8.24 finished in 2.5s
Compiler run successful!
```

### Step 4: Get Merkle Root from Admin Panel

1. Go to `/admin` in your web app
2. Upload your ban list (CSV or JSON)
3. Click "Build Merkle Root"
4. **Copy the Merkle Root** (you'll need this)

Example: `12345678901234567890123456789012345678901234567890123456789012`

### Step 5: Set Up Environment Variables

Create `.env` file in `contracts/` directory:

```bash
cd contracts
cat > .env << 'EOF'
RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key_here_without_0x
BASESCAN_API_KEY=optional_for_verification
INITIAL_ROOT=paste_merkle_root_from_admin_panel_here
EOF
```

**IMPORTANT:**
- Replace `your_private_key_here` with your actual private key (without `0x` prefix)
- Replace `paste_merkle_root_from_admin_panel_here` with the Merkle root from Step 4
- Get Base Sepolia ETH from https://www.coinbase.com/faucets

### Step 6: Deploy Contracts to Base Sepolia

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  -vvvv
```

**What this does:**
1. Deploys `NulToken` (ERC-20)
2. Deploys `Groth16Verifier` (ZK proof verifier)
3. Deploys `NulSetFaucet` (faucet with verification)
4. Funds faucet with 100M $NUL tokens
5. Saves addresses to `deployments/base-sepolia.json`
6. Verifies contracts on BaseScan (if API key provided)

**Expected output:**
```
========================================
DEPLOYMENT SUMMARY
========================================
Network: Base Sepolia (Chain ID: 84532)
Deployer: 0x1234...5678

Contract Addresses:
  NulToken: 0xabcd...ef01
  Groth16Verifier: 0x2345...6789
  NulSetFaucet: 0x3456...789a

Faucet Details:
  Balance: 100,000,000 NUL
  Claim Amount: 5 NUL
  Cooldown: 24 hours
  Merkle Root: 12345...67890
========================================
```

**⚠️ SAVE THESE ADDRESSES!** You'll need them in the next step.

### Step 7: Update Frontend Configuration

Open `web/src/contracts/config.ts` and update the contract addresses:

```typescript
export const CONTRACTS: Record<number, ContractAddresses> = {
  // Base Sepolia (Chain ID: 84532)
  84532: {
    nulToken: '0xYOUR_TOKEN_ADDRESS_HERE',
    faucet: '0xYOUR_FAUCET_ADDRESS_HERE',
    verifier: '0xYOUR_VERIFIER_ADDRESS_HERE',
  },
};
```

Replace with the addresses from Step 6.

### Step 8: Test Locally

```bash
cd web
pnpm install
pnpm run dev
```

Open http://localhost:5173/faucet-onchain

1. Connect wallet
2. Switch to Base Sepolia
3. Try claiming tokens!

### Step 9: Verify on BaseScan

Go to https://sepolia.basescan.org and search for your contract addresses.

You should see:
- ✓ Contract verified
- ✓ Transactions
- ✓ Token info

### Step 10: Deploy Frontend (Optional)

```bash
cd web
pnpm run build
```

Deploy `web/dist/` to Vercel or your hosting provider.

---

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Connect wallet on Base Sepolia
- [ ] See correct balance (0 $NUL initially)
- [ ] See faucet balance (100M $NUL)
- [ ] See claim status ("Ready to claim 5 $NUL")

### Claim Flow (Non-Banned User)
- [ ] Click "Claim 5 $NUL"
- [ ] Proof generates (~30s)
- [ ] Transaction submits
- [ ] Transaction confirms (~2s)
- [ ] Balance updates (0 → 5 $NUL)
- [ ] Confetti animation plays
- [ ] Cooldown timer starts (24h)
- [ ] View transaction on BaseScan

### Cooldown
- [ ] Try claiming immediately (should fail)
- [ ] See cooldown timer ("23h 59m remaining")
- [ ] Button disabled during cooldown

### Banned User
- [ ] Add address to ban list in Admin panel
- [ ] Update Merkle root in smart contract
- [ ] Try claiming (should show "Address is banned")

---

## 🔧 Common Issues & Solutions

### Issue 1: "Insufficient funds for gas"
**Solution:** Get more Base Sepolia ETH from https://www.coinbase.com/faucets

### Issue 2: "Root mismatch"
**Solution:** 
1. Get current root from Admin panel
2. Update it on-chain:
```bash
cast send $FAUCET_ADDRESS \
  "updateRoot(uint256)" \
  $NEW_ROOT \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY
```

### Issue 3: "Verifier contract not found"
**Solution:** Make sure you ran `./scripts/export-verifier.sh` successfully

### Issue 4: "Transaction reverted: Invalid proof"
**Possible causes:**
- Merkle root mismatch (client vs on-chain)
- Address is actually banned
- Proof generation failed

**Solution:** Check logs in browser console for details

### Issue 5: "Contracts not deployed on this network"
**Solution:** Update `web/src/contracts/config.ts` with deployed addresses

---

## 📊 Admin Functions

### Update Merkle Root (When Ban List Changes)

1. Upload new ban list in Admin panel
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

### Fund Faucet with More Tokens

```bash
# Amount in wei (1 NUL = 10^18 wei)
AMOUNT="1000000000000000000000"  # 1000 NUL

cast send $TOKEN_ADDRESS \
  "transfer(address,uint256)" \
  $FAUCET_ADDRESS \
  $AMOUNT \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY
```

### Emergency Withdraw (Owner Only)

```bash
cast send $FAUCET_ADDRESS \
  "emergencyWithdraw()" \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY
```

---

## 💰 Gas Costs (Estimated)

| Operation | Gas | Cost (@0.1 gwei) |
|-----------|-----|------------------|
| Deploy NulToken | ~1.2M | ~$0.12 |
| Deploy Verifier | ~3.5M | ~$0.35 |
| Deploy Faucet | ~600k | ~$0.06 |
| **Total Deployment** | **~5.3M** | **~$0.53** |
| Claim (with proof) | ~350k | ~$0.035 |
| Update root | ~50k | ~$0.005 |

**Note:** Base has very low gas fees! ~$0.03 per claim is extremely cheap.

---

## 📚 Useful Commands

### Check User Stats

```bash
cast call $FAUCET_ADDRESS \
  "getUserStats(address)(uint256,uint256,bool)" \
  $USER_ADDRESS \
  --rpc-url https://sepolia.base.org
```

Returns: `(totalClaims, lastClaimTime, canClaimNow)`

### Check if User Can Claim

```bash
cast call $FAUCET_ADDRESS \
  "canUserClaim(address)(bool,uint256)" \
  $USER_ADDRESS \
  --rpc-url https://sepolia.base.org
```

Returns: `(canClaim, cooldownRemaining)`

### Get Current Merkle Root

```bash
cast call $FAUCET_ADDRESS \
  "merkleRoot()(uint256)" \
  --rpc-url https://sepolia.base.org
```

### Get Token Balance

```bash
cast call $TOKEN_ADDRESS \
  "balanceOf(address)(uint256)" \
  $USER_ADDRESS \
  --rpc-url https://sepolia.base.org
```

---

## 🎯 Next Steps

After successful deployment:

1. **Test thoroughly** - Test all scenarios (claim, cooldown, banned users)
2. **Update documentation** - Document your specific addresses
3. **Monitor usage** - Watch transactions on BaseScan
4. **Refill faucet** - When balance gets low, send more tokens
5. **Update root** - When ban list changes, update the on-chain root
6. **Deploy to mainnet** (optional) - Follow same steps for Base mainnet

---

## 🔐 Security Reminders

- ✅ Never commit `.env` file
- ✅ Never share your private key
- ✅ Use a dedicated wallet for deployment (not your main wallet)
- ✅ Test on testnet before mainnet
- ✅ Verify contracts on BaseScan
- ✅ Keep private keys secure (use hardware wallet for production)

---

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Check BaseScan for transaction details
3. Verify contract addresses are correct
4. Ensure Merkle root matches between client and contract
5. Check that you have Base Sepolia ETH

---

## ✅ Success Criteria

Your deployment is successful when:

- [x] All contracts deployed and verified on BaseScan
- [x] Faucet funded with tokens
- [x] Frontend shows correct balances
- [x] Users can claim tokens
- [x] Proof verification works on-chain
- [x] Cooldown enforced correctly
- [x] Banned users cannot claim
- [x] Transactions visible on BaseScan

---

**Congratulations! You now have a fully functioning on-chain NulSet faucet! 🎉**

Visit https://sepolia.basescan.org to see your contracts live on Base Sepolia!
