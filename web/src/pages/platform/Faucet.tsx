import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import confetti from 'canvas-confetti'
import { generateNulSetProof, verifyNulSetProof } from '../../lib/nulset/wrapper'
import { generateWitnessForId } from '../../lib/nulset/tree-browser'
import { NulSetProof } from '../../lib/nulset/types'
import { loadState } from '../../lib/nulset/state-manager'
import {
  TOKEN_CONFIG,
  getBalance,
  getCooldownRemaining,
  canClaimCooldown,
  formatCooldown,
  formatBalance,
  recordClaim,
} from '../../lib/nulset/balance-manager'

type ClaimState = 'idle' | 'checking' | 'generating' | 'verifying' | 'claiming' | 'success' | 'error'

interface ClaimStatus {
  canClaim: boolean
  reason: string
  icon: string
}

export default function Faucet() {
  const { address, isConnected } = useAccount()
  
  const [balance, setBalance] = useState(0)
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null)
  const [claimState, setClaimState] = useState<ClaimState>('idle')
  const [nulsetProof, setNulSetProof] = useState<NulSetProof | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string; txHash?: string } | null>(null)
  const [proofStartTime, setProofStartTime] = useState(0)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  // Load balance when address changes
  useEffect(() => {
    if (address) {
      setBalance(getBalance(address))
      checkClaimStatus(address)
      setCooldownRemaining(getCooldownRemaining(address))
    } else {
      setBalance(0)
      setClaimStatus(null)
      setCooldownRemaining(0)
    }
  }, [address])

  // Update cooldown timer every second
  useEffect(() => {
    if (!address || cooldownRemaining === 0) return

    const interval = setInterval(() => {
      const remaining = getCooldownRemaining(address)
      setCooldownRemaining(remaining)
      
      if (remaining === 0) {
        clearInterval(interval)
        checkClaimStatus(address) // Refresh status
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [address, cooldownRemaining])

  const checkClaimStatus = (walletAddress: string): ClaimStatus => {
    // Load ban list
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

    // Check if banned
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

    // Check cooldown
    if (!canClaimCooldown(walletAddress)) {
      const remaining = getCooldownRemaining(walletAddress)
      const status = {
        canClaim: false,
        reason: `Next claim in ${formatCooldown(remaining)}`,
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

  const handleClaim = async () => {
    if (!address || !isConnected) {
      alert('Please connect your wallet first')
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
      console.log('[Faucet] Root:', root)
      
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

      // Check cooldown
      if (!canClaimCooldown(address)) {
        const remaining = getCooldownRemaining(address)
        setResult({
          success: false,
          message: `You must wait ${formatCooldown(remaining)} before claiming again.`
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
      console.log('[Faucet] Proof generated!')

      console.log('[Faucet] Step 3: Verifying proof...')
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

      console.log('[Faucet] Step 4: Claiming tokens...')
      setClaimState('claiming')
      
      const proofGenTime = Date.now() - proofStartTime
      const claimRecord = recordClaim(address, TOKEN_CONFIG.claimAmount, proofGenTime)
      
      console.log('[Faucet] ✅ Claim successful!')
      
      // Update balance
      setBalance(getBalance(address))
      setCooldownRemaining(getCooldownRemaining(address))
      
      setResult({
        success: true,
        message: `Successfully claimed ${TOKEN_CONFIG.claimAmount} ${TOKEN_CONFIG.symbol}!`,
        txHash: claimRecord.txHash
      })
      setClaimState('success')
      
      // Show confetti
      showSuccessAnimation()
      
      // Refresh claim status
      checkClaimStatus(address)
      
    } catch (err) {
      console.error('[Faucet] Claim error:', err)
      setResult({
        success: false,
        message: `Claim failed: ${err}`
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {TOKEN_CONFIG.symbol} Faucet
        </h1>
        <p className="text-gray-600">
          Privacy-preserving token distribution using zero-knowledge exclusion proofs
        </p>
      </div>

      {/* Wallet Connection Card */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Wallet Connection</h2>
            {isConnected && address && (
              <p className="text-sm text-gray-600 mt-1">
                Connected: {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            )}
          </div>
          <ConnectButton />
        </div>
      </div>

      {/* Balance Card */}
      {isConnected && address && (
        <div className="card mb-6 bg-gradient-to-r from-primary-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Your Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatBalance(balance)}
              </p>
            </div>
            <div className="text-6xl">💰</div>
          </div>
        </div>
      )}

      {/* Claim Status Card */}
      {isConnected && address && claimStatus && (
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
      {isConnected && address ? (
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
            {claimState === 'claiming' && 'Claiming tokens...'}
            {claimState === 'success' && '✅ Claimed!'}
            {claimState === 'error' && '❌ Failed'}
          </button>

          {/* Loading States */}
          {(claimState === 'checking' || claimState === 'generating' || claimState === 'verifying' || claimState === 'claiming') && (
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
                    ['verifying', 'claiming'].includes(claimState) ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span>Generating zero-knowledge proof (10-30s)</span>
                </div>
                <div className="flex items-center">
                  <div className={`rounded-full h-4 w-4 mr-2 ${
                    claimState === 'verifying' ? 'animate-spin border-b-2 border-primary-600' : 
                    claimState === 'claiming' ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span>Verifying proof</span>
                </div>
                <div className="flex items-center">
                  <div className={`rounded-full h-4 w-4 mr-2 ${
                    claimState === 'claiming' ? 'animate-spin border-b-2 border-primary-600' : 'bg-gray-300'
                  }`}></div>
                  <span>Claiming tokens</span>
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
                      New Balance: {formatBalance(balance)}
                    </p>
                    <p className="text-xs text-gray-500 font-mono break-all">
                      TX: {result.txHash.slice(0, 20)}...{result.txHash.slice(-20)}
                    </p>
                    <p className="text-xs text-yellow-600 mt-2">
                      ⚠️ Mock transaction (demo only)
                    </p>
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
            Connect your wallet to claim {TOKEN_CONFIG.claimAmount} {TOKEN_CONFIG.symbol} tokens
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      )}

      {/* How it Works */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">How This Works</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>1. Connect Wallet:</strong> Connect your Web3 wallet (MetaMask, WalletConnect, etc.)</p>
          <p><strong>2. Check Eligibility:</strong> System checks if your address is banned (without revealing the ban list)</p>
          <p><strong>3. Generate Proof:</strong> Create a zero-knowledge proof showing you're NOT banned</p>
          <p><strong>4. Claim Tokens:</strong> Receive {TOKEN_CONFIG.claimAmount} {TOKEN_CONFIG.symbol} tokens (mock, demo only)</p>
          <p><strong>5. Cooldown:</strong> Wait {TOKEN_CONFIG.cooldownHours} hours before claiming again</p>
          <p className="mt-3 text-xs text-gray-600">
            <strong>Privacy:</strong> The proof reveals nothing about the ban list or your position in the Merkle tree.
          </p>
        </div>
      </div>

      {/* Token Info */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-900 mb-2">
          {TOKEN_CONFIG.symbol} Token Info
        </h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p><strong>Name:</strong> {TOKEN_CONFIG.name}</p>
          <p><strong>Symbol:</strong> {TOKEN_CONFIG.symbol}</p>
          <p><strong>Supply:</strong> {TOKEN_CONFIG.supply.toLocaleString()} tokens</p>
          <p><strong>Claim Amount:</strong> {TOKEN_CONFIG.claimAmount} {TOKEN_CONFIG.symbol}</p>
          <p><strong>Cooldown:</strong> {TOKEN_CONFIG.cooldownHours} hours</p>
          <p className="text-xs text-yellow-700 mt-2">
            ⚠️ This is a mock token for demonstration purposes only. No real tokens are distributed.
          </p>
        </div>
      </div>
    </div>
  )
}
