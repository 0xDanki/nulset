import { useState } from 'react'
import { generateTwitterProof, getTLSNotaryError, isTLSNotaryAvailable } from '../lib/tlsnotary/prover'
import { TwitterProof, ProofGenerationProgress } from '../lib/tlsnotary/types'

interface TwitterConnectProps {
  onProofGenerated: (proof: TwitterProof) => void
  onError?: (error: string) => void
}

export default function TwitterConnect({ onProofGenerated, onError }: TwitterConnectProps) {
  const [connecting, setConnecting] = useState(false)
  const [progress, setProgress] = useState<ProofGenerationProgress | null>(null)
  const [error, setError] = useState<string>('')

  const handleConnect = async () => {
    setConnecting(true)
    setError('')
    setProgress(null)

    try {
      // Check if TLSNotary is available
      if (!isTLSNotaryAvailable()) {
        throw new Error('TLSNotary not available. Please install the browser extension.')
      }

      // Generate Twitter proof
      const proof = await generateTwitterProof({}, (p) => {
        setProgress(p)
      })

      // Success
      onProofGenerated(proof)
      
    } catch (err) {
      const errorMsg = getTLSNotaryError(err)
      setError(errorMsg)
      if (onError) {
        onError(errorMsg)
      }
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center py-3 text-lg"
      >
        {connecting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Connecting to Twitter...
          </>
        ) : (
          <>
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            Verify with Twitter
          </>
        )}
      </button>

      {progress && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700 font-medium">{progress.message}</span>
            <span className="text-sm text-gray-500">{progress.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Step: {progress.step}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-4">
        <p className="font-semibold mb-1">How it works:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>You'll be prompted to authenticate with Twitter</li>
          <li>TLSNotary intercepts the HTTPS connection</li>
          <li>A cryptographic proof is generated</li>
          <li>Only your Twitter ID is revealed (nothing else)</li>
          <li>The proof is verified and used for access check</li>
        </ol>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-1">Privacy guarantee:</p>
        <p>Your Twitter username, followers, tweets, and all other data stay private. Only your user ID is proven.</p>
      </div>
    </div>
  )
}
