import { useState, useEffect } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'
import confetti from 'canvas-confetti'
import { generateNulSetProof, verifyNulSetProof } from '../../lib/nulset/wrapper'
import { generateWitnessForId } from '../../lib/nulset/tree-browser'
import { NulSetProof } from '../../lib/nulset/types'
import { loadState } from '../../lib/nulset/state-manager'
import { useNulToken } from '../../contracts/hooks/useNulToken'
import { useFaucet } from '../../contracts/hooks/useFaucet'
import { isContractsDeployed, TOKEN_CONFIG } from '../../contracts/config'

type ClaimState = 'idle' | 'checking' | 'generating' | 'verifying' | 'submitting' | 'confirming' | 'success' | 'error'

interface ClaimStatus {
  canClaim: boolean
  reason: string
  icon: string
}

export default function FaucetOnchain() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  // Contract hooks
  const { balance, refetchBalance } = useNulToken()
  const {
    faucetBalance,
    totalClaims: onchainTotalClaims,
    lastClaimTime,
    canClaim: canClaimOnchain,
    cooldownRemaining: onchainCooldownRemaining,
    claimTokens,
    txHash,
    isClaimPending,
    isConfirming,
    isConfirmed,
    claimError,
    refetchUserStats,
    refetchCooldown,
    merkleRoot: onchainRoot,
  } = useFaucet()
  
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null)
  const [claimState, setClaimState] = useState<ClaimState>('idle')
  const [nulsetProof, setNulSetProof] = useState<NulSetProof | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string; txHash?: string } | null>(null)
  const [proofStartTime, setProofStartTime] = useState(0)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  // Check if on Base Sepolia
  const isBaseSepolia = chainId === baseSepolia.id
  const contractsDeployed = isBaseSepolia && isContractsDeployed(chainId)

  // Update cooldown timer
  useEffect(() => {
    setCooldownRemaining(onchainCooldownRemaining * 1000) // Convert to ms
  }, [onchainCooldownRemaining])

  // Update cooldown countdown
  useEffect(() => {
    if (!address || cooldownRemaining === 0) return

    const interval = setInterval(() => {
      const newRemaining = Math.max(0, cooldownRemaining - 1000)
      setCooldownRemaining(newRemaining)
      
      if (newRemaining === 0) {
        clearInterval(interval)
        refetchCooldown()
        refetchUserStats()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [address, cooldownRemaining, refetchCooldown, refetchUserStats])

  // Update claim status when chain data changes
  useEffect(() => {
    if (!address || !isConnected || !isBaseSepolia || !contractsDeployed) {
      setClaimStatus(null)
      return
    }
    
    checkClaimStatus(address)
  }, [address, isConnected, isBaseSepolia, contractsDeployed, canClaimOnchain, cooldownRemaining])

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && claimState === 'confirming') {
      setClaimState('success')
      setResult({
        success: true,
        message: `Successfully claimed ${TOKEN_CONFIG.claimAmount} ${TOKEN_CONFIG.symbol}!`,
        txHash: txHash || undefined
      })
      showSuccessAnimation()
      
      // Refetch balances and stats
      setTimeout(() => {
        refetchBalance()
        refetchUserStats()
        refetchCooldown()
      }, 2000)
    }
  }, [isConfirmed, claimState, txHash, refetchBalance, refetchUserStats, refetchCooldown])

  // Handle claim error
  useEffect(() => {
    if (claimError && claimState !== 'idle' && claimState !== 'success') {
      setClaimState('error')
      setResult({
        success: false,
        message: `Claim failed: ${claimError.message}`,
      })
    }
  }, [claimError, claimState])

  const checkClaimStatus = (walletAddress: string): ClaimStatus => {
    console.log('[Faucet] Checking claim status:', {
      address: walletAddress,
      canClaimOnchain,
      cooldownRemaining,
      onchainCooldownRemaining,
      lastClaimTime,
    })

    // Load ban list for client-side check
    const state = loadState()
    if (!state) {
      const status = {
        canClaim: false,
        reason: 'No ban list configured. Please upload one in the Admin panel.',
        icon: '⚠️',
      }
      setClaimStatus(status)
      return status
    }

    // Check if banned (client-side optimization to avoid proof generation)
    const isBanned = state.bannedList.some(
      banned => banned.toLowerCase() === walletAddress.toLowerCase()
    )

    if (isBanned) {
      const status = {
        canClaim: false,
        reason: 'Your address is on the ban list',
        icon: '❌',
      }
      setClaimStatus(status)
      return status
    }

    // Check onchain cooldown
    // If user has never claimed (lastClaimTime === 0), they can claim
    // Otherwise check cooldown
    if (lastClaimTime > 0 && cooldownRemaining > 0) {
      const hours = Math.floor(cooldownRemaining / (1000 * 60 * 60))
      const minutes = Math.floor((cooldownRemaining % (1000 * 60 * 60)) / (1000 * 60))
      const status = {
        canClaim: false,
        reason: hours > 0 
          ? `Next claim in ${hours}h ${minutes}m`
          : minutes > 0 
            ? `Next claim in ${minutes}m`
            : 'Cooldown expiring...',
        icon: '⏰',
      }
      setClaimStatus(status)
      return status
    }

    // Can claim!
    const status = {
      canClaim: true,
      reason: `Ready to claim ${TOKEN_CONFIG.claimAmount} ${TOKEN_CONFIG.symbol}`,
      icon: '✅',
    }
    setClaimStatus(status)
    return status
  }

  const showSuccessAnimation = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }

  const formatCooldown = (ms: number): string => {
    if (ms === 0) return 'Ready to claim'
    
    const hours = Math.floor(ms / (60 * 60 * 1000))
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    }
    return `${minutes}m remaining`
  }

  const handleClaim = async () => {
    if (!address || !isConnected) {
      alert('Please connect your wallet first')
      return
    }

    if (!isBaseSepolia) {
      alert('Please switch to Base Sepolia network')
      return
    }

    if (!contractsDeployed) {
      alert('Contracts not deployed on this network')
      return
    }

    setClaimState('checking')
    setResult(null)
    setNulSetProof(null)
    setProofStartTime(Date.now())

    try {
      console.log('[Faucet] Step 1: Checking eligibility...')
      
      // Load ban list
      const state = loadState()
      if (!state) {
        setResult({
          success: false,
          message: 'No ban list configured. Please upload a ban list in the Admin panel first.'
        })
        setClaimState('error')
        return
      }
      
      const bannedIds = state.bannedList
      const root = state.root
      
      console.log('[Faucet] Using admin ban list:', bannedIds.length, 'identifiers')
      console.log('[Faucet] Client root:', root)
      console.log('[Faucet] Onchain root:', onchainRoot)
      
      // Verify root matches onchain root
      if (root !== onchainRoot) {
        setResult({
          success: false,
          message: 'Merkle root mismatch. Admin needs to update the on-chain root.'
        })
        setClaimState('error')
        return
      }
      
      // Check if banned (before generating proof to save computation)
      const isBanned = bannedIds.some(
        banned => banned.toLowerCase() === address.toLowerCase()
      )
      
      if (isBanned) {
        setResult({
          success: false,
          message: 'Your address is on the ban list. You cannot claim tokens.'
        })
        setClaimState('error')
        return
      }

      // Double-check onchain cooldown
      if (!canClaimOnchain) {
        setResult({
          success: false,
          message: `You must wait ${formatCooldown(cooldownRemaining)} before claiming again.`
        })
        setClaimState('error')
        return
      }

      console.log('[Faucet] Step 2: Generating zero-knowledge proof...')
      setClaimState('generating')
      
      const witness = await generateWitnessForId(address, bannedIds, root)
      console.log('[Faucet] Witness generated:', witness)
      
      // Check leaf value (should be 0 for allowed users)
      if (witness.leaf_value !== '0') {
        setResult({
          success: false,
          message: 'Proof generation failed: Your address appears to be banned.'
        })
        setClaimState('error')
        return
      }

      const nulsetProof = await generateNulSetProof(
        address,
        root,
        witness,
        (progress) => console.log('[Faucet] Proof progress:', progress)
      )
      
      setNulSetProof(nulsetProof)
      const proofGenTime = Date.now() - proofStartTime
      console.log('[Faucet] Proof generated in', proofGenTime, 'ms')

      console.log('[Faucet] Step 3: Verifying proof locally...')
      setClaimState('verifying')
      
      const nulsetValid = await verifyNulSetProof(nulsetProof)
      
      if (!nulsetValid) {
        setResult({
          success: false,
          message: 'Proof verification failed. Please try again.'
        })
        setClaimState('error')
        return
      }

      console.log('[Faucet] Step 4: Submitting claim to blockchain...')
      setClaimState('submitting')
      
      // Submit transaction
      await claimTokens(nulsetProof)
      
      console.log('[Faucet] Transaction submitted!')
      setClaimState('confirming')
      
    } catch (err) {
      console.error('[Faucet] Claim error:', err)
      setResult({
        success: false,
        message: `Claim failed: ${err instanceof Error ? err.message : String(err)}`
      })
      setClaimState('error')
    }
  }

  const resetClaim = () => {
    setResult(null)
    setNulSetProof(null)
    setClaimState('idle')
    if (address) {
      checkClaimStatus(address)
    }
  }

  // If not on Base Sepolia, show switch network prompt
  if (isConnected && !isBaseSepolia) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🌐</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Wrong Network
          </h3>
          <p className="text-gray-600 mb-6">
            Please switch to Base Sepolia to use the faucet
          </p>
          <button
            onClick={() => switchChain?.({ chainId: baseSepolia.id })}
            className="btn btn-primary"
          >
            Switch to Base Sepolia
          </button>
        </div>
      </div>
    )
  }

  // If contracts not deployed
  if (isConnected && isBaseSepolia && !contractsDeployed) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Contracts Not Deployed
          </h3>
          <p className="text-gray-600 mb-4">
            The NulSet contracts have not been deployed to Base Sepolia yet.
          </p>
          <p className="text-sm text-gray-500">
            Admin: Please deploy contracts and update the frontend config.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {TOKEN_CONFIG.symbol} Faucet (On-Chain)
        </h1>
        <p className="text-gray-600">
          Real token distribution on Base Sepolia using zero-knowledge exclusion proofs
        </p>
      </div>

      {/* Wallet Connection Card */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Wallet Connection</h2>
            {isConnected && address && (
              <>
                <p className="text-sm text-gray-600 mt-1">
                  Connected: {address.slice(0, 6)}...{address.slice(-4)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ✓ Base Sepolia
                </p>
              </>
            )}
          </div>
          <ConnectButton />
        </div>
      </div>

      {/* Balance Card */}
      {isConnected && address && contractsDeployed && (
        <div className="card mb-6 bg-gradient-to-r from-primary-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Your Balance (On-Chain)</p>
              <p className="text-3xl font-bold text-gray-900">
                {balance.toFixed(2)} {TOKEN_CONFIG.symbol}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Total Claims: {onchainTotalClaims}
              </p>
            </div>
            <div className="text-6xl">💰</div>
          </div>
        </div>
      )}

      {/* Faucet Stats */}
      {isConnected && contractsDeployed && (
        <div className="card mb-6 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Faucet Statistics</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Faucet Balance</p>
              <p className="font-semibold text-gray-900">{faucetBalance.toLocaleString()} {TOKEN_CONFIG.symbol}</p>
            </div>
            <div>
              <p className="text-gray-600">Claim Amount</p>
              <p className="font-semibold text-gray-900">{TOKEN_CONFIG.claimAmount} {TOKEN_CONFIG.symbol}</p>
            </div>
          </div>
        </div>
      )}

      {/* Claim Status Card */}
      {isConnected && address && claimStatus && contractsDeployed && (
        <div className="card mb-6">
          <div className="flex items-start">
            <div className="text-4xl mr-4">{claimStatus.icon}</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Claim Status
              </h3>
              <p className="text-gray-700">{claimStatus.reason}</p>
              {cooldownRemaining > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${100 - (cooldownRemaining / (TOKEN_CONFIG.cooldownHours * 60 * 60 * 1000) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Claim Button Card */}
      {isConnected && address && contractsDeployed ? (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Claim {TOKEN_CONFIG.symbol} Tokens
          </h2>
          
          <button
            onClick={handleClaim}
            disabled={
              claimState !== 'idle' || 
              !claimStatus?.canClaim
            }
            className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-4 text-lg font-semibold"
          >
            {claimState === 'idle' && `Claim ${TOKEN_CONFIG.claimAmount} ${TOKEN_CONFIG.symbol}`}
            {claimState === 'checking' && 'Checking eligibility...'}
            {claimState === 'generating' && 'Generating proof...'}
            {claimState === 'verifying' && 'Verifying proof...'}
            {claimState === 'submitting' && 'Submitting transaction...'}
            {claimState === 'confirming' && 'Confirming transaction...'}
            {claimState === 'success' && '✅ Claimed!'}
            {claimState === 'error' && '❌ Failed'}
          </button>

          {/* Loading States */}
          {(claimState === 'checking' || claimState === 'generating' || claimState === 'verifying' || claimState === 'submitting' || claimState === 'confirming') && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 mb-3 font-medium">Processing your claim...</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className={`rounded-full h-4 w-4 mr-2 ${
                    claimState === 'checking' ? 'animate-spin border-b-2 border-primary-600' : 'bg-green-500'
                  }`}></div>
                  <span>Checking eligibility</span>
                </div>
                <div className="flex items-center">
                  <div className={`rounded-full h-4 w-4 mr-2 ${
                    claimState === 'generating' ? 'animate-spin border-b-2 border-primary-600' : 
                    ['verifying', 'submitting', 'confirming'].includes(claimState) ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span>Generating zero-knowledge proof (10-30s)</span>
                </div>
                <div className="flex items-center">
                  <div className={`rounded-full h-4 w-4 mr-2 ${
                    claimState === 'verifying' ? 'animate-spin border-b-2 border-primary-600' : 
                    ['submitting', 'confirming'].includes(claimState) ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span>Verifying proof</span>
                </div>
                <div className="flex items-center">
                  <div className={`rounded-full h-4 w-4 mr-2 ${
                    claimState === 'submitting' ? 'animate-spin border-b-2 border-primary-600' : 
                    claimState === 'confirming' ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span>Submitting transaction</span>
                </div>
                <div className="flex items-center">
                  <div className={`rounded-full h-4 w-4 mr-2 ${
                    claimState === 'confirming' ? 'animate-spin border-b-2 border-primary-600' : 'bg-gray-300'
                  }`}></div>
                  <span>Confirming on blockchain (~2s)</span>
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`mt-6 p-6 rounded-lg border-2 ${
              result.success 
                ? 'bg-green-50 border-green-300' 
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {result.success ? '🎉' : '❌'}
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? 'Claim Successful!' : 'Claim Failed'}
                </h3>
                <p className={`text-lg mb-4 ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message}
                </p>
                
                {result.success && result.txHash && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      + {TOKEN_CONFIG.claimAmount} {TOKEN_CONFIG.symbol}
                    </p>
                    <p className="text-xs text-gray-600 mb-1">
                      New Balance: {balance.toFixed(2)} {TOKEN_CONFIG.symbol}
                    </p>
                    <p className="text-xs text-gray-500 font-mono break-all mb-2">
                      TX: {result.txHash}
                    </p>
                    <a
                      href={`https://sepolia.basescan.org/tx/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View on BaseScan →
                    </a>
                  </div>
                )}
                
                <button
                  onClick={resetClaim}
                  className="mt-4 text-sm text-blue-600 hover:underline"
                >
                  {result.success ? 'Close' : 'Try Again'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🔌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-600 mb-6">
            Connect your wallet to claim {TOKEN_CONFIG.claimAmount} {TOKEN_CONFIG.symbol} tokens on Base Sepolia
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      )}

      {/* How it Works */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">How This Works (On-Chain)</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>1. Connect Wallet:</strong> Connect your Web3 wallet and switch to Base Sepolia</p>
          <p><strong>2. Check Eligibility:</strong> System checks if your address is banned (without revealing the ban list)</p>
          <p><strong>3. Generate Proof:</strong> Create a zero-knowledge proof showing you're NOT banned (~30s)</p>
          <p><strong>4. Verify Proof:</strong> Proof is verified client-side before submission</p>
          <p><strong>5. Submit Transaction:</strong> Proof is sent to smart contract for on-chain verification</p>
          <p><strong>6. Receive Tokens:</strong> Smart contract verifies proof and transfers {TOKEN_CONFIG.claimAmount} {TOKEN_CONFIG.symbol} to your wallet</p>
          <p><strong>7. Cooldown:</strong> Wait {TOKEN_CONFIG.cooldownHours} hours before claiming again</p>
          <p className="mt-3 text-xs text-gray-600">
            <strong>Privacy:</strong> The proof reveals nothing about the ban list. All verification happens transparently on-chain.
          </p>
        </div>
      </div>

      {/* Token Info */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-900 mb-2">
          {TOKEN_CONFIG.symbol} Token Info (Base Sepolia)
        </h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p><strong>Name:</strong> {TOKEN_CONFIG.name}</p>
          <p><strong>Symbol:</strong> {TOKEN_CONFIG.symbol}</p>
          <p><strong>Network:</strong> Base Sepolia (Chain ID: 84532)</p>
          <p><strong>Claim Amount:</strong> {TOKEN_CONFIG.claimAmount} {TOKEN_CONFIG.symbol}</p>
          <p><strong>Cooldown:</strong> {TOKEN_CONFIG.cooldownHours} hours</p>
          <p className="text-xs text-yellow-700 mt-2">
            ✓ Real ERC-20 tokens on Base Sepolia testnet. Transactions verified on-chain!
          </p>
        </div>
      </div>
    </div>
  )
}
