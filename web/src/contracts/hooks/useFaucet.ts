import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getContractAddresses } from '../config';
import FaucetABI from '../abis/NulSetFaucet.json';
import { formatUnits } from 'viem';
import { NulSetProof } from '../../lib/nulset/types';

/**
 * Hook to interact with NulSetFaucet contract
 */
export function useFaucet() {
  const { address, chainId } = useAccount();
  const contracts = chainId ? getContractAddresses(chainId) : null;
  
  // Read faucet balance
  const { data: rawFaucetBalance, refetch: refetchFaucetBalance } = useReadContract({
    address: contracts?.faucet,
    abi: FaucetABI,
    functionName: 'getFaucetBalance',
    query: {
      enabled: !!contracts?.faucet,
    },
  });
  
  // Read user stats
  const { data: userStats, refetch: refetchUserStats } = useReadContract({
    address: contracts?.faucet,
    abi: FaucetABI,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts?.faucet,
    },
  });
  
  // Read cooldown check
  const { data: cooldownData, refetch: refetchCooldown } = useReadContract({
    address: contracts?.faucet,
    abi: FaucetABI,
    functionName: 'canUserClaim',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts?.faucet,
    },
  });
  
  // Read merkle root
  const { data: merkleRoot } = useReadContract({
    address: contracts?.faucet,
    abi: FaucetABI,
    functionName: 'merkleRoot',
    query: {
      enabled: !!contracts?.faucet,
    },
  });
  
  // Write contract - claim function
  const { 
    writeContract, 
    data: txHash,
    error: claimError,
    isPending: isClaimPending 
  } = useWriteContract();
  
  // Wait for transaction
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  
  // Format values
  const faucetBalance = rawFaucetBalance ? Number(formatUnits(rawFaucetBalance as bigint, 18)) : 0;
  const totalClaims = userStats ? Number((userStats as any)[0]) : 0;
  const lastClaimTime = userStats ? Number((userStats as any)[1]) : 0;
  const canClaimNow = userStats ? Boolean((userStats as any)[2]) : false;
  const canClaim = cooldownData ? Boolean((cooldownData as any)[0]) : false;
  const cooldownRemaining = cooldownData ? Number((cooldownData as any)[1]) : 0;
  
  /**
   * Claim tokens with ZK proof
   */
  const claimTokens = async (proof: NulSetProof) => {
    if (!contracts?.faucet) {
      throw new Error('Faucet contract not deployed on this network');
    }
    
    // Format proof for Solidity
    // snarkjs proof format:
    // pi_a: [x, y, 1]
    // pi_b: [[x1, x2], [y1, y2], [1, 0]]
    // pi_c: [x, y, 1]
    // publicSignals: [root]
    
    const a: [bigint, bigint] = [
      BigInt(proof.pi_a[0]),
      BigInt(proof.pi_a[1])
    ];
    
    const b: [[bigint, bigint], [bigint, bigint]] = [
      [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
      [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])]
    ];
    
    const c: [bigint, bigint] = [
      BigInt(proof.pi_c[0]),
      BigInt(proof.pi_c[1])
    ];
    
    const input: [bigint] = [
      BigInt(proof.publicSignals[0])
    ];
    
    // Call contract
    writeContract({
      address: contracts.faucet,
      abi: FaucetABI,
      functionName: 'claim',
      args: [a, b, c, input],
    });
  };
  
  return {
    // Balances
    faucetBalance,
    
    // User stats
    totalClaims,
    lastClaimTime,
    canClaimNow,
    canClaim,
    cooldownRemaining,
    merkleRoot: merkleRoot ? merkleRoot.toString() : '0',
    
    // Actions
    claimTokens,
    
    // Transaction state
    txHash,
    isClaimPending,
    isConfirming,
    isConfirmed,
    claimError,
    
    // Refetch functions
    refetchFaucetBalance,
    refetchUserStats,
    refetchCooldown,
    
    // Contract address
    faucetAddress: contracts?.faucet,
  };
}
