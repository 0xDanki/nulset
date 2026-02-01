# Wallet Demo - Development Rules

## 🎯 Core Principles

1. **User Experience First**: Wallet connection must be seamless
2. **Privacy Preserved**: All ZK properties maintained
3. **Mobile Friendly**: Works on mobile wallets
4. **Clear Feedback**: Users always know what's happening
5. **Error Resilience**: Handle all wallet errors gracefully
6. **Demo Clarity**: Obvious it's a mock token (no confusion with real tokens)
7. **Fast Performance**: Wallet operations <3s, proof generation <30s
8. **Clean Code**: Reuse existing components, don't duplicate logic

---

## 📝 TypeScript Coding Standards

### File Structure
```typescript
// Component file structure
// 1. Imports
import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

// 2. Types/Interfaces
interface ClaimRecord {
  address: string;
  amount: number;
  timestamp: number;
}

// 3. Constants
const CLAIM_AMOUNT = 5; // $NUL tokens
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

// 4. Component
export default function Faucet() {
  // 4a. Hooks
  // 4b. State
  // 4c. Effects
  // 4d. Handlers
  // 4e. Render
}
```

### Naming Conventions
```typescript
// ✅ GOOD
const CLAIM_AMOUNT = 5;
const TOKEN_SYMBOL = '$NUL';
function handleClaimTokens() {}
interface ClaimRecord {}
type WalletStatus = 'connected' | 'disconnected';

// ❌ BAD
const claimamount = 5;
const tokensymbol = '$NUL';
function ClaimTokens() {}  // Should be handle* or use*
```

---

## 🔗 Wallet Integration Rules

### Use RainbowKit + wagmi
```typescript
// ✅ ALWAYS use these hooks
import { 
  useAccount,      // Get connected address
  useConnect,      // Connect wallet
  useDisconnect,   // Disconnect wallet
  useNetwork,      // Get current network
} from 'wagmi';

// ✅ ALWAYS check connection status
const { address, isConnected } = useAccount();

if (!isConnected) {
  return <ConnectButton />;
}
```

### Wallet Connection Patterns
```typescript
// ✅ Use RainbowKit's ConnectButton (easiest)
import { ConnectButton } from '@rainbow-me/rainbowkit';

<ConnectButton />

// ✅ Or custom button with connection logic
const { connect, connectors } = useConnect();

<button onClick={() => connect({ connector: connectors[0] })}>
  Connect Wallet
</button>
```

### Handle Connection Errors
```typescript
// ✅ ALWAYS handle wallet errors
const { connect, error, isLoading } = useConnect();

if (error) {
  if (error.message.includes('rejected')) {
    showNotification('Connection cancelled by user');
  } else if (error.message.includes('chain')) {
    showNotification('Unsupported network');
  } else {
    showNotification('Failed to connect wallet', error.message);
  }
}
```

---

## 💰 $NUL Token Rules

### Constants (Never Change)
```typescript
// ✅ Define once, use everywhere
export const TOKEN_CONFIG = {
  name: 'NulSet Token',
  symbol: '$NUL',
  decimals: 18,
  supply: 1_000_000_000, // 1 billion
  claimAmount: 5,
  cooldownHours: 24,
} as const;
```

### Balance Management
```typescript
// ✅ Use helper functions
function getBalance(address: string): number {
  const balances = JSON.parse(localStorage.getItem('nulset_balances') || '{}');
  return balances[address.toLowerCase()]?.balance || 0;
}

function addBalance(address: string, amount: number): void {
  const balances = JSON.parse(localStorage.getItem('nulset_balances') || '{}');
  const addr = address.toLowerCase();
  
  balances[addr] = {
    balance: (balances[addr]?.balance || 0) + amount,
    lastClaim: Date.now(),
    totalClaims: (balances[addr]?.totalClaims || 0) + 1,
  };
  
  localStorage.setItem('nulset_balances', JSON.stringify(balances));
}

// ✅ Format for display
function formatBalance(balance: number): string {
  return `${balance.toFixed(2)} $NUL`;
}
```

### Mock Transaction Hashing
```typescript
// ✅ Generate realistic mock TX hashes
function generateMockTxHash(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const hex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return '0x' + hex;
}

// ✅ Make it look real but clearly marked as mock
function createMockTx(address: string, amount: number) {
  return {
    hash: generateMockTxHash(),
    from: '0x0000000000000000000000000000000000000000', // Faucet address
    to: address,
    value: amount,
    timestamp: Date.now(),
    status: 'success',
    isMock: true, // ⚠️ IMPORTANT: Mark as mock
  };
}
```

---

## 🚫 Ban Check Rules

### Check Ban Status BEFORE Proof Generation
```typescript
// ✅ ALWAYS check ban status first (saves computation)
function canClaim(address: string, bannedList: string[]): boolean {
  // 1. Check if banned
  const isBanned = bannedList.some(
    banned => banned.toLowerCase() === address.toLowerCase()
  );
  
  if (isBanned) {
    return false;
  }
  
  // 2. Check cooldown
  const lastClaim = getLastClaimTime(address);
  const cooldownExpired = Date.now() - lastClaim > COOLDOWN_MS;
  
  return cooldownExpired;
}

// ✅ Show clear status
function getClaimStatus(address: string): ClaimStatus {
  if (isBanned(address)) {
    return {
      canClaim: false,
      reason: 'Address is on the ban list',
      icon: '❌',
    };
  }
  
  const cooldownRemaining = getCooldownRemaining(address);
  if (cooldownRemaining > 0) {
    return {
      canClaim: false,
      reason: `Next claim in ${formatDuration(cooldownRemaining)}`,
      icon: '⏰',
    };
  }
  
  return {
    canClaim: true,
    reason: 'Ready to claim 5 $NUL',
    icon: '✅',
  };
}
```

---

## ⏱️ Cooldown Management

### Calculate Cooldown
```typescript
// ✅ Precise cooldown calculation
function getCooldownRemaining(address: string): number {
  const balances = JSON.parse(localStorage.getItem('nulset_balances') || '{}');
  const lastClaim = balances[address.toLowerCase()]?.lastClaim || 0;
  
  if (!lastClaim) return 0; // Never claimed
  
  const elapsed = Date.now() - lastClaim;
  const remaining = COOLDOWN_MS - elapsed;
  
  return Math.max(0, remaining);
}

// ✅ Format cooldown for display
function formatCooldown(ms: number): string {
  if (ms === 0) return 'Ready to claim';
  
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}
```

### Cooldown Timer Component
```typescript
// ✅ Live countdown timer
function CooldownTimer({ address }: { address: string }) {
  const [remaining, setRemaining] = useState(getCooldownRemaining(address));
  
  useEffect(() => {
    const interval = setInterval(() => {
      const newRemaining = getCooldownRemaining(address);
      setRemaining(newRemaining);
      
      if (newRemaining === 0) {
        clearInterval(interval);
      }
    }, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, [address]);
  
  if (remaining === 0) return <span className="text-green-600">✅ Ready</span>;
  
  return (
    <span className="text-yellow-600">
      ⏰ {formatCooldown(remaining)}
    </span>
  );
}
```

---

## 🎨 UI/UX Rules

### Loading States
```typescript
// ✅ ALWAYS show clear loading states
type ClaimState = 
  | 'idle'
  | 'checking'      // Checking ban status
  | 'generating'    // Generating proof
  | 'verifying'     // Verifying proof
  | 'claiming'      // Processing claim
  | 'success'       // Claim successful
  | 'error';        // Error occurred

function LoadingIndicator({ state }: { state: ClaimState }) {
  const messages = {
    checking: 'Checking eligibility...',
    generating: 'Generating zero-knowledge proof...',
    verifying: 'Verifying proof...',
    claiming: 'Claiming tokens...',
  };
  
  return (
    <div className="flex items-center gap-2">
      <Spinner />
      <span>{messages[state]}</span>
    </div>
  );
}
```

### Progress Bar for Proof Generation
```typescript
// ✅ Show progress during long operations
function ProofProgress({ progress }: { progress: number }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span>Generating proof...</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary-600 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        This may take 10-30 seconds
      </p>
    </div>
  );
}
```

### Success Animation
```typescript
// ✅ Celebrate success with animation
import confetti from 'canvas-confetti';

function showSuccessAnimation() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
}

function ClaimSuccess({ amount, txHash }: ClaimSuccessProps) {
  useEffect(() => {
    showSuccessAnimation();
  }, []);
  
  return (
    <div className="text-center p-6 bg-green-50 rounded-lg">
      <div className="text-6xl mb-4">🎉</div>
      <h3 className="text-2xl font-bold text-green-900 mb-2">
        Claim Successful!
      </h3>
      <p className="text-3xl font-bold text-green-600 mb-4">
        + {amount} $NUL
      </p>
      <div className="text-xs text-gray-600">
        <p>Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}</p>
        <p className="text-yellow-600 mt-1">⚠️ Mock transaction (demo only)</p>
      </div>
    </div>
  );
}
```

### Error Messages
```typescript
// ✅ User-friendly error messages
function getErrorMessage(error: any): string {
  // Wallet errors
  if (error.code === 4001) {
    return 'You cancelled the wallet connection';
  }
  
  // Proof generation errors
  if (error.message?.includes('Assert Failed')) {
    return 'Failed to generate proof. Your address may be banned.';
  }
  
  // Generic errors
  return 'Something went wrong. Please try again.';
}
```

---

## 🔐 Security & Privacy Rules

### localStorage Security
```typescript
// ✅ ALWAYS sanitize localStorage data
function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Failed to parse ${key}:`, error);
    return defaultValue;
  }
}

function safeSetItem(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set ${key}:`, error);
  }
}
```

### Address Normalization
```typescript
// ✅ ALWAYS normalize addresses (lowercase)
function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function compareAddresses(addr1: string, addr2: string): boolean {
  return normalizeAddress(addr1) === normalizeAddress(addr2);
}
```

### Privacy Preservation
```typescript
// ✅ NEVER expose ban list publicly
// ✅ NEVER log sensitive data
// ✅ NEVER send ban list to external APIs

// ❌ BAD
console.log('Ban list:', bannedList);
fetch('https://analytics.com', { body: JSON.stringify(bannedList) });

// ✅ GOOD
console.log('Checked ban status for address');
// No external API calls for ban checks
```

---

## 🧪 Testing Requirements

### Test Scenarios (Manual)
```typescript
// ✅ MUST test all scenarios before PR

// Scenario 1: Fresh User
// - Connect new wallet
// - Should see 0 $NUL balance
// - Should be able to claim
// - Should receive 5 $NUL
// - Should show cooldown timer

// Scenario 2: Banned User
// - Connect banned wallet
// - Should see "Banned" status
// - Should NOT be able to claim
// - Button should be disabled

// Scenario 3: Cooldown Active
// - Connect wallet that recently claimed
// - Should show remaining cooldown
// - Button should be disabled
// - Timer should count down

// Scenario 4: Multiple Claims
// - Claim → wait/clear storage → claim again
// - Balance should accumulate (5 → 10 → 15)
```

### Mobile Testing
```typescript
// ✅ MUST test on mobile wallets
// - MetaMask Mobile
// - Trust Wallet
// - Coinbase Wallet
// - Rainbow

// ✅ Check mobile responsiveness
// - Wallet modal fits screen
// - Buttons are tappable
// - Text is readable
// - No horizontal scroll
```

---

## 📊 Performance Rules

### Target Performance
| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| Wallet connection | <2s | <5s |
| Ban check | <100ms | <500ms |
| Proof generation | <30s | <60s |
| Balance update | <100ms | <500ms |
| UI render | <16ms | <100ms |

### Optimization Rules
```typescript
// ✅ Memoize expensive computations
const bannedSet = useMemo(() => {
  return new Set(bannedList.map(addr => addr.toLowerCase()));
}, [bannedList]);

// ✅ Debounce rapid updates
const debouncedCheckStatus = useMemo(
  () => debounce(checkClaimStatus, 300),
  []
);

// ✅ Use loading skeletons (perceived performance)
if (isLoading) {
  return <Skeleton />;
}
```

---

## 🎯 Component Structure

### Faucet Page Components
```
Faucet.tsx (main page)
  ├── WalletStatus.tsx (connection status)
  ├── TokenBalance.tsx (show $NUL balance)
  ├── ClaimButton.tsx (main CTA)
  ├── ClaimProgress.tsx (proof generation progress)
  ├── ClaimSuccess.tsx (success modal)
  ├── BanStatus.tsx (show ban/cooldown status)
  └── ClaimHistory.tsx (list of past claims)
```

### State Management
```typescript
// ✅ Use context for shared state
interface FaucetContextType {
  balance: number;
  canClaim: boolean;
  claimStatus: ClaimStatus;
  claims: ClaimRecord[];
  refreshBalance: () => void;
}

const FaucetContext = createContext<FaucetContextType | null>(null);

// ✅ Custom hook for easy access
function useFaucet() {
  const context = useContext(FaucetContext);
  if (!context) {
    throw new Error('useFaucet must be used within FaucetProvider');
  }
  return context;
}
```

---

## 🚨 Error Handling

### Graceful Degradation
```typescript
// ✅ ALWAYS have fallbacks
try {
  const proof = await generateProof(address);
  await claimTokens(proof);
} catch (error) {
  // Log error
  console.error('Claim failed:', error);
  
  // Show user-friendly message
  showNotification(getErrorMessage(error));
  
  // Revert state
  setClaimState('idle');
  
  // Offer retry
  setShowRetryButton(true);
}
```

### Network Errors
```typescript
// ✅ Handle wallet disconnection gracefully
useEffect(() => {
  if (!isConnected && claimState === 'generating') {
    // User disconnected during claim
    setClaimState('error');
    showNotification('Wallet disconnected. Please reconnect and try again.');
  }
}, [isConnected, claimState]);
```

---

## 📝 Documentation Rules

### Component Documentation
```typescript
/**
 * Faucet component - Wallet-connected $NUL token distribution
 * 
 * Features:
 * - Connect wallet via RainbowKit
 * - Check if address is banned (ZK proof)
 * - Claim 5 $NUL tokens (mock)
 * - 24-hour cooldown between claims
 * - Balance tracking (localStorage)
 * 
 * @example
 * <Faucet />
 */
export default function Faucet() {
  // ...
}
```

### Function Documentation
```typescript
/**
 * Check if address can claim tokens
 * 
 * @param address - Wallet address to check
 * @param bannedList - List of banned addresses
 * @returns {boolean} true if can claim, false otherwise
 * 
 * Checks:
 * 1. Address not in ban list
 * 2. Cooldown period expired (24h)
 */
function canClaim(address: string, bannedList: string[]): boolean {
  // ...
}
```

---

## 🔄 Git Workflow

### Branch: wallet-demo
```bash
# ALWAYS work on wallet-demo branch
git checkout wallet-demo

# Commit frequently with clear messages
git commit -m "feat: add wallet connection with RainbowKit"
git commit -m "feat: implement claim button and logic"
git commit -m "feat: add cooldown timer"
git commit -m "style: add success animation"
git commit -m "fix: handle wallet disconnection"
git commit -m "test: verify mobile wallet support"
```

### Before Committing
```bash
# ✅ ALWAYS check before committing
pnpm run build     # Must succeed
pnpm run lint      # Must pass
# Test manually    # All scenarios work
```

---

## ✅ Definition of Done

### Feature Checklist
- [ ] Wallet connection works (MetaMask, WalletConnect)
- [ ] Ban check works (banned users blocked)
- [ ] Proof generation works (with wallet address)
- [ ] Claim button works (5 $NUL distributed)
- [ ] Balance updates correctly
- [ ] Cooldown timer works (24h)
- [ ] Mock TX hash generated
- [ ] Success animation shown
- [ ] Error handling works
- [ ] Mobile responsive
- [ ] Works on mobile wallets
- [ ] localStorage persistence works
- [ ] Admin panel still works (ban list upload)
- [ ] Documentation updated
- [ ] No console errors

---

**Follow these rules for consistent, high-quality wallet demo implementation.**
