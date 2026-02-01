/**
 * Balance Manager - Manages $NUL token balances and claim history
 * 
 * Features:
 * - Track balance per address (localStorage)
 * - Record claim history
 * - Enforce 24-hour cooldown
 * - Generate mock transaction hashes
 */

export const TOKEN_CONFIG = {
  name: 'NulSet Token',
  symbol: '$NUL',
  decimals: 18,
  supply: 1_000_000_000, // 1 billion
  claimAmount: 5,
  cooldownHours: 24,
} as const;

const COOLDOWN_MS = TOKEN_CONFIG.cooldownHours * 60 * 60 * 1000; // 24 hours

export interface ClaimRecord {
  address: string;
  amount: number;
  timestamp: number;
  txHash: string;
  proofGenTime: number;
}

export interface BalanceData {
  balance: number;
  lastClaim: number;
  totalClaims: number;
}

export interface ClaimHistory {
  claims: ClaimRecord[];
}

// Storage keys
const BALANCES_KEY = 'nulset_balances';
const CLAIMS_KEY = 'nulset_claims';

/**
 * Normalize address to lowercase for consistent storage
 */
function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

/**
 * Safe localStorage getter with error handling
 */
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

/**
 * Safe localStorage setter with error handling
 */
function safeSetItem(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set ${key}:`, error);
  }
}

/**
 * Get balance for an address
 */
export function getBalance(address: string): number {
  const balances = safeGetItem<Record<string, BalanceData>>(BALANCES_KEY, {});
  return balances[normalizeAddress(address)]?.balance || 0;
}

/**
 * Get full balance data for an address
 */
export function getBalanceData(address: string): BalanceData {
  const balances = safeGetItem<Record<string, BalanceData>>(BALANCES_KEY, {});
  return balances[normalizeAddress(address)] || {
    balance: 0,
    lastClaim: 0,
    totalClaims: 0,
  };
}

/**
 * Add balance to an address
 */
export function addBalance(address: string, amount: number): void {
  const balances = safeGetItem<Record<string, BalanceData>>(BALANCES_KEY, {});
  const addr = normalizeAddress(address);
  
  balances[addr] = {
    balance: (balances[addr]?.balance || 0) + amount,
    lastClaim: Date.now(),
    totalClaims: (balances[addr]?.totalClaims || 0) + 1,
  };
  
  safeSetItem(BALANCES_KEY, balances);
}

/**
 * Get cooldown remaining in milliseconds
 */
export function getCooldownRemaining(address: string): number {
  const data = getBalanceData(address);
  
  if (!data.lastClaim) return 0; // Never claimed
  
  const elapsed = Date.now() - data.lastClaim;
  const remaining = COOLDOWN_MS - elapsed;
  
  return Math.max(0, remaining);
}

/**
 * Check if address can claim (cooldown expired)
 */
export function canClaimCooldown(address: string): boolean {
  return getCooldownRemaining(address) === 0;
}

/**
 * Format cooldown for display
 */
export function formatCooldown(ms: number): string {
  if (ms === 0) return 'Ready to claim';
  
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

/**
 * Format balance for display
 */
export function formatBalance(balance: number): string {
  return `${balance.toFixed(2)} ${TOKEN_CONFIG.symbol}`;
}

/**
 * Generate mock transaction hash
 */
export function generateMockTxHash(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const hex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return '0x' + hex;
}

/**
 * Record a claim in history
 */
export function recordClaim(
  address: string,
  amount: number,
  proofGenTime: number
): ClaimRecord {
  const txHash = generateMockTxHash();
  const record: ClaimRecord = {
    address: normalizeAddress(address),
    amount,
    timestamp: Date.now(),
    txHash,
    proofGenTime,
  };
  
  // Add to balance
  addBalance(address, amount);
  
  // Add to claim history
  const history = safeGetItem<ClaimHistory>(CLAIMS_KEY, { claims: [] });
  history.claims.unshift(record); // Add to beginning
  
  // Keep only last 100 claims
  if (history.claims.length > 100) {
    history.claims = history.claims.slice(0, 100);
  }
  
  safeSetItem(CLAIMS_KEY, history);
  
  return record;
}

/**
 * Get claim history for an address
 */
export function getClaimHistory(address: string): ClaimRecord[] {
  const history = safeGetItem<ClaimHistory>(CLAIMS_KEY, { claims: [] });
  const addr = normalizeAddress(address);
  return history.claims.filter(claim => claim.address === addr);
}

/**
 * Get all claims (for admin/stats)
 */
export function getAllClaims(): ClaimRecord[] {
  const history = safeGetItem<ClaimHistory>(CLAIMS_KEY, { claims: [] });
  return history.claims;
}

/**
 * Clear all balances and claims (for testing)
 */
export function clearAllData(): void {
  localStorage.removeItem(BALANCES_KEY);
  localStorage.removeItem(CLAIMS_KEY);
  console.log('[Balance Manager] All data cleared');
}
