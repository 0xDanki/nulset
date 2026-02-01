# Base Sepolia Integration Guide

## 🌐 Network Details

### Base Sepolia Testnet

| Property | Value |
|----------|-------|
| **Network Name** | Base Sepolia |
| **Chain ID** | 84532 |
| **RPC URL** | https://sepolia.base.org |
| **Block Explorer** | https://sepolia.basescan.org |
| **Currency Symbol** | ETH |
| **Faucet** | https://www.coinbase.com/faucets/base-ethereum-goerli-faucet |

---

## 🔧 Current Implementation (Demo)

### Client-Side Only
- ✅ Wallet connection via RainbowKit
- ✅ Base Sepolia network supported
- ✅ Mock $NUL tokens (localStorage)
- ✅ No blockchain transactions yet

### How It Works Now
```
1. User connects wallet (any network)
   ↓
2. System checks ban list (client-side)
   ↓
3. Generate ZK proof (client-side)
   ↓
4. Verify proof (client-side)
   ↓
5. Distribute mock tokens (localStorage)
```

---

## 🚀 Future: Real Token on Base Sepolia

### Phase 1: ERC-20 Token Contract

Deploy `NulToken.sol` on Base Sepolia:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NulToken is ERC20, Ownable {
    uint256 public constant CLAIM_AMOUNT = 5 * 10**18; // 5 $NUL
    uint256 public constant COOLDOWN = 24 hours;
    
    mapping(address => uint256) public lastClaim;
    
    constructor() ERC20("NulSet Token", "NUL") {
        _mint(msg.sender, 1_000_000_000 * 10**18); // 1 billion
    }
    
    function claim(address recipient) external onlyOwner {
        require(
            block.timestamp >= lastClaim[recipient] + COOLDOWN,
            "Cooldown not expired"
        );
        
        lastClaim[recipient] = block.timestamp;
        _transfer(owner(), recipient, CLAIM_AMOUNT);
    }
}
```

### Phase 2: Faucet Contract with ZK Verification

Deploy `NulSetFaucet.sol` on Base Sepolia:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NulToken.sol";
import "./Groth16Verifier.sol";

contract NulSetFaucet is Ownable {
    NulToken public token;
    Groth16Verifier public verifier;
    
    uint256 public merkleRoot;
    mapping(address => uint256) public lastClaim;
    
    uint256 public constant CLAIM_AMOUNT = 5 * 10**18;
    uint256 public constant COOLDOWN = 24 hours;
    
    event Claimed(address indexed user, uint256 amount);
    event RootUpdated(uint256 newRoot);
    
    constructor(address _token, address _verifier, uint256 _root) {
        token = NulToken(_token);
        verifier = Groth16Verifier(_verifier);
        merkleRoot = _root;
    }
    
    function claim(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[1] memory input
    ) external {
        // Check cooldown
        require(
            block.timestamp >= lastClaim[msg.sender] + COOLDOWN,
            "Cooldown not expired"
        );
        
        // Verify proof
        require(
            verifier.verifyProof(a, b, c, input),
            "Invalid proof"
        );
        
        // Verify root matches
        require(input[0] == merkleRoot, "Root mismatch");
        
        // Record claim
        lastClaim[msg.sender] = block.timestamp;
        
        // Transfer tokens
        require(
            token.transfer(msg.sender, CLAIM_AMOUNT),
            "Transfer failed"
        );
        
        emit Claimed(msg.sender, CLAIM_AMOUNT);
    }
    
    function updateRoot(uint256 _newRoot) external onlyOwner {
        merkleRoot = _newRoot;
        emit RootUpdated(_newRoot);
    }
}
```

---

## 📋 Deployment Checklist

### Step 1: Get Base Sepolia ETH
- [ ] Visit https://www.coinbase.com/faucets
- [ ] Request Base Sepolia ETH (for gas)
- [ ] Verify balance in wallet

### Step 2: Deploy Contracts
- [ ] Deploy `NulToken.sol` on Base Sepolia
- [ ] Deploy `Groth16Verifier.sol` (from circuit)
- [ ] Deploy `NulSetFaucet.sol`
- [ ] Fund faucet with $NUL tokens

### Step 3: Update Frontend
- [ ] Update `balance-manager.ts` to use real contract
- [ ] Add contract addresses to config
- [ ] Add ABI imports
- [ ] Replace localStorage with blockchain reads
- [ ] Replace mock TX with real transactions

### Step 4: Testing
- [ ] Test token claim on Base Sepolia
- [ ] Verify proof on-chain
- [ ] Check cooldown enforcement
- [ ] Test with multiple wallets
- [ ] Verify on BaseScan

---

## 🔗 Integration Code Snippets

### 1. Contract Addresses Config

```typescript
// web/src/config/contracts.ts
export const CONTRACTS = {
  baseSepolia: {
    chainId: 84532,
    nulToken: '0x...', // Deploy first
    verifier: '0x...', // From circuit
    faucet: '0x...',   // Deploy last
  }
}
```

### 2. Token Contract Hook

```typescript
// web/src/hooks/useNulToken.ts
import { useContractRead, useContractWrite } from 'wagmi'
import { CONTRACTS } from '../config/contracts'
import NulTokenABI from '../abis/NulToken.json'

export function useNulToken() {
  const { data: balance } = useContractRead({
    address: CONTRACTS.baseSepolia.nulToken,
    abi: NulTokenABI,
    functionName: 'balanceOf',
    args: [address],
  })
  
  return { balance }
}
```

### 3. Faucet Claim Hook

```typescript
// web/src/hooks/useFaucetClaim.ts
import { useContractWrite, useWaitForTransaction } from 'wagmi'
import { CONTRACTS } from '../config/contracts'
import FaucetABI from '../abis/NulSetFaucet.json'

export function useFaucetClaim() {
  const { write: claimTokens, data } = useContractWrite({
    address: CONTRACTS.baseSepolia.faucet,
    abi: FaucetABI,
    functionName: 'claim',
  })
  
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })
  
  return { claimTokens, isLoading, isSuccess }
}
```

### 4. Update Faucet Page

```typescript
// web/src/pages/platform/Faucet.tsx
import { useNulToken } from '../../hooks/useNulToken'
import { useFaucetClaim } from '../../hooks/useFaucetClaim'

export default function Faucet() {
  const { balance } = useNulToken()
  const { claimTokens, isLoading } = useFaucetClaim()
  
  const handleClaim = async () => {
    // Generate proof (same as before)
    const proof = await generateNulSetProof(...)
    
    // Call contract with proof
    await claimTokens({
      args: [
        proof.pi_a.slice(0, 2),
        [proof.pi_b[0].slice(0, 2), proof.pi_b[1].slice(0, 2)],
        proof.pi_c.slice(0, 2),
        proof.publicSignals,
      ]
    })
  }
  
  return (
    // Real balance from blockchain
    <div>Balance: {balance} $NUL</div>
  )
}
```

---

## 🧪 Testing on Base Sepolia

### Local Testing
1. Start local dev server: `pnpm run dev`
2. Connect wallet to Base Sepolia
3. Test claim flow
4. Verify transaction on BaseScan

### Contract Verification
```bash
# Verify on BaseScan
forge verify-contract \
  --chain-id 84532 \
  --constructor-args $(cast abi-encode "constructor(address,address,uint256)" $TOKEN $VERIFIER $ROOT) \
  $FAUCET_ADDRESS \
  src/NulSetFaucet.sol:NulSetFaucet \
  --etherscan-api-key $BASESCAN_API_KEY
```

---

## 📊 Comparison: Mock vs Real

| Feature | Current (Mock) | Future (Base Sepolia) |
|---------|----------------|----------------------|
| **Tokens** | localStorage | ERC-20 contract |
| **Balance** | Client-side | On-chain |
| **Claims** | Instant | ~2s (tx time) |
| **Verification** | Client-side | On-chain |
| **Cooldown** | localStorage | Smart contract |
| **History** | localStorage | Blockchain events |
| **Persistence** | Browser only | Blockchain |
| **Cost** | Free | Gas fees |

---

## 💰 Gas Estimates (Base Sepolia)

| Operation | Gas | Cost (@ 0.1 gwei) |
|-----------|-----|-------------------|
| Deploy Token | ~1M | ~$0.10 |
| Deploy Verifier | ~3M | ~$0.30 |
| Deploy Faucet | ~500k | ~$0.05 |
| Claim (with proof) | ~300k | ~$0.03 |

**Note**: Base has very low gas fees, making it ideal for testing!

---

## 🎯 Migration Path

### Week 1: Current State (Demo)
- ✅ Client-side wallet connection
- ✅ Mock tokens in localStorage
- ✅ ZK proof generation
- ✅ Client-side verification

### Week 2: Smart Contracts
- [ ] Deploy NulToken on Base Sepolia
- [ ] Deploy Groth16Verifier
- [ ] Deploy NulSetFaucet
- [ ] Fund faucet with tokens

### Week 3: Frontend Integration
- [ ] Add contract hooks
- [ ] Replace localStorage with blockchain reads
- [ ] Add transaction handling
- [ ] Update UI for gas fees

### Week 4: Testing & Launch
- [ ] Test all flows on Base Sepolia
- [ ] Verify contracts on BaseScan
- [ ] Deploy to production
- [ ] Monitor usage

---

## 🔐 Security Considerations

### Smart Contract Security
- [ ] Audit by OpenZeppelin
- [ ] Reentrancy guards
- [ ] Access control (Ownable)
- [ ] Pausable mechanism
- [ ] Rate limiting

### Frontend Security
- [ ] Validate all user inputs
- [ ] Check chain ID before TX
- [ ] Handle TX reverts gracefully
- [ ] Display clear error messages
- [ ] Warn about gas costs

---

## 📚 Resources

- **Base Docs**: https://docs.base.org
- **Base Sepolia Faucet**: https://www.coinbase.com/faucets
- **BaseScan**: https://sepolia.basescan.org
- **wagmi Docs**: https://wagmi.sh
- **RainbowKit**: https://www.rainbowkit.com

---

## ✅ Current Status

- ✅ Base Sepolia added to wagmi config
- ✅ Wallet can connect to Base Sepolia
- ✅ Mock faucet works on any network
- ⏳ Smart contracts (next phase)
- ⏳ Real token distribution (next phase)

---

**Ready for Base Sepolia deployment when you are! 🚀**
