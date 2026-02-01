/**
 * Contract configuration for Base Sepolia
 * 
 * IMPORTANT: After deploying contracts, update these addresses!
 * The deployment script will output addresses to contracts/deployments/base-sepolia.json
 */

export interface ContractAddresses {
  nulToken: `0x${string}`;
  faucet: `0x${string}`;
  verifier: `0x${string}`;
}

export const CONTRACTS: Record<number, ContractAddresses> = {
  // Base Sepolia (Chain ID: 84532)
  84532: {
    nulToken: '0x27b7d12981dEE74D14CF9665FDd828f6a6eDdc60',
    faucet: '0xD87feDbA0a627934325a4D4cc2fc3fdCAD1AcF6A',
    verifier: '0x7b46c85D37bc1245F45f1e79B3Bf94202710Be2F',
  },
};

/**
 * Get contract addresses for current chain
 */
export function getContractAddresses(chainId: number): ContractAddresses | null {
  return CONTRACTS[chainId] || null;
}

/**
 * Check if contracts are deployed on current chain
 */
export function isContractsDeployed(chainId: number): boolean {
  const addresses = getContractAddresses(chainId);
  if (!addresses) return false;
  
  // Check if any address is not zero
  return (
    addresses.nulToken !== '0x0000000000000000000000000000000000000000' &&
    addresses.faucet !== '0x0000000000000000000000000000000000000000'
  );
}

/**
 * Token configuration
 */
export const TOKEN_CONFIG = {
  name: 'NulSet Token',
  symbol: '$NUL',
  decimals: 18,
  claimAmount: 5, // 5 $NUL per claim
  cooldownHours: 24,
} as const;
