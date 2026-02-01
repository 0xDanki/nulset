import { useState } from 'react'
import { generateNulSetProof, verifyNulSetProof } from '../../lib/nulset/wrapper'
import { generateWitnessForId } from '../../lib/nulset/tree-browser'
import { NulSetProof } from '../../lib/nulset/types'
import { loadState } from '../../lib/nulset/state-manager'

export default function PlatformDemo() {
  const [userId, setUserId] = useState('')
  const [nulsetProof, setNulSetProof] = useState<NulSetProof | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<{ granted: boolean; message: string } | null>(null)

  const handleVerifyAccess = async () => {
    if (!userId.trim()) {
      alert('Please enter a user ID')
      return
    }

    setVerifying(true)
    setResult(null)
    setNulSetProof(null)

    try {
      console.log('Step 1: Loading admin-uploaded ban list...')
      
      // Load ban list from admin panel (localStorage)
      const state = loadState()
      if (!state) {
        setResult({
          granted: false,
          message: 'No ban list configured. Please upload a ban list in the Admin panel first.'
        })
        return
      }
      
      const bannedIds = state.bannedList
      const root = state.root
      
      console.log('[Demo] Using admin ban list:', bannedIds.length, 'identifiers')
      console.log('[Demo] Root:', root)
      
      const witness = await generateWitnessForId(userId, bannedIds, root)
      console.log('Witness generated:', witness)
      
      // Check leaf value (should be 0 for allowed users)
      if (witness.leaf_value !== '0') {
        setResult({
          granted: false,
          message: 'Access denied: Your ID is on the banned list.'
        })
        return
      }

      console.log('Step 2: Generating NulSet proof (this may take 10-30s)...')
      
      const nulsetProof = await generateNulSetProof(
        userId,
        root,
        witness,
        (progress) => console.log('NulSet progress:', progress)
      )
      
      setNulSetProof(nulsetProof)
      console.log('NulSet proof generated!')

      console.log('Step 3: Verifying NulSet proof...')
      const nulsetValid = await verifyNulSetProof(nulsetProof)
      
      if (!nulsetValid) {
        setResult({
          granted: false,
          message: 'NulSet proof verification failed. Access denied.'
        })
        return
      }

      console.log('✅ All proofs verified!')
      
      setResult({
        granted: true,
        message: 'Zero-knowledge proof verified. Faucet claim approved!'
      })
      
    } catch (err) {
      console.error('Verification error:', err)
      setResult({
        granted: false,
        message: `Verification error: ${err}`
      })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Faucet Demo</h1>
        <p className="text-gray-600">
          Anti-Sybil faucet gate using zero-knowledge proofs for privacy-preserving exclusion
        </p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Faucet Tokens</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g., 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
              className="w-full input"
              disabled={verifying}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter any identifier (wallet address, email, numeric ID, etc.)
            </p>
          </div>

          <button
            onClick={handleVerifyAccess}
            disabled={verifying || !userId.trim()}
            className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3 text-lg"
          >
            {verifying ? 'Verifying...' : 'Claim Faucet Tokens'}
          </button>
        </div>

        {verifying && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 mb-2">Generating zero-knowledge proof...</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                <span>Generating Merkle witness</span>
              </div>
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                <span>Generating Groth16 proof (10-30s)</span>
              </div>
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                <span>Verifying proof</span>
              </div>
            </div>
          </div>
        )}

        {nulsetProof && !result && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              Proof generated. Verifying...
            </p>
          </div>
        )}

        {result && (
          <div className={`mt-6 p-6 rounded-lg border-2 ${
            result.granted 
              ? 'bg-green-50 border-green-300' 
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-start">
              <div className="text-4xl mr-4">
                {result.granted ? '✅' : '❌'}
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 ${
                  result.granted ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.granted ? 'Access Granted' : 'Access Denied'}
                </h3>
                <p className={result.granted ? 'text-green-800' : 'text-red-800'}>
                  {result.message}
                </p>
                {result.granted && (
                  <div className="mt-4 p-3 bg-white rounded border border-green-200">
                    <p className="text-sm text-gray-700 font-medium">What happened:</p>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1">
                      <li>✓ Generated Merkle witness for your ID</li>
                      <li>✓ Created zero-knowledge proof (Groth16)</li>
                      <li>✓ Verified proof cryptographically</li>
                      <li>✓ Confirmed you're NOT on the banned list</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => {
                setResult(null)
                setNulSetProof(null)
                setUserId('')
              }}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Try another ID
            </button>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">How This Works</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>1. Admin Setup:</strong> Platform uploads list of banned IDs → builds Merkle tree</p>
          <p><strong>2. User Request:</strong> You enter your ID → system generates witness (Merkle path)</p>
          <p><strong>3. ZK Proof:</strong> System creates Groth16 proof showing you're NOT banned</p>
          <p><strong>4. Verification:</strong> Proof verified cryptographically → access granted/denied</p>
          <p className="mt-3 text-xs text-gray-600">
            <strong>Privacy:</strong> The verifier only sees your proof + root. They don't see the ban list or your Merkle path.
          </p>
        </div>
      </div>

      {/* Current Ban List Info */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-900 mb-2">Current Ban List</h3>
        {(() => {
          const state = loadState()
          if (!state) {
            return (
              <p className="text-sm text-yellow-800">
                ⚠️ No ban list loaded. Please upload one in the <a href="/admin" className="underline font-medium">Admin panel</a> first.
              </p>
            )
          }
          return (
            <>
              <p className="text-sm text-gray-700 mb-2">
                Using admin-uploaded ban list with <strong>{state.bannedList.length}</strong> identifiers
              </p>
              <details className="text-sm">
                <summary className="cursor-pointer text-blue-600 hover:underline">View banned identifiers</summary>
                <ul className="mt-2 max-h-40 overflow-y-auto bg-white p-2 rounded">
                  {state.bannedList.map((id, idx) => (
                    <li key={idx} className="py-1 text-gray-600 font-mono text-xs">{id}</li>
                  ))}
                </ul>
              </details>
            </>
          )
        })()}
      </div>
    </div>
  )
}
