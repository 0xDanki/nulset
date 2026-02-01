import { useAccount, useReadContract } from 'wagmi';
import { getContractAddresses } from '../config';
import NulTokenABI from '../abis/NulToken.json';
import { formatUnits } from 'viem';

/**
 * Hook to interact with NulToken contract
 */
export function useNulToken() {
  const { address, chainId } = useAccount();
  const contracts = chainId ? getContractAddresses(chainId) : null;
  
  // Read balance
  const { data: rawBalance, refetch: refetchBalance } = useReadContract({
    address: contracts?.nulToken,
    abi: NulTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts?.nulToken,
    },
  });
  
  // Read total supply
  const { data: rawTotalSupply } = useReadContract({
    address: contracts?.nulToken,
    abi: NulTokenABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!contracts?.nulToken,
    },
  });
  
  // Format values
  const balance = rawBalance ? Number(formatUnits(rawBalance as bigint, 18)) : 0;
  const totalSupply = rawTotalSupply ? Number(formatUnits(rawTotalSupply as bigint, 18)) : 0;
  
  return {
    balance,
    totalSupply,
    refetchBalance,
    tokenAddress: contracts?.nulToken,
  };
}
