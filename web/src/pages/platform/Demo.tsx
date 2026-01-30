import { useState } from 'react'
import TwitterConnect from '../../components/TwitterConnect'
import { TwitterProof } from '../../lib/tlsnotary/types'
import { verifyTwitterProof } from '../../lib/tlsnotary/verifier'
import { generateNulSetProof, verifyNulSetProof } from '../../lib/nulset/wrapper'
import { NulSetProof } from '../../lib/nulset/types'

export default function PlatformDemo() {
  const [twitterProof, setTwitterProof] = useState<TwitterProof | null>(null)
  const [nulsetProof, setNulSetProof] = useState<NulSetProof | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<{ granted: boolean; message: string } | null>(null)

  const handleTwitterProof = async (proof: TwitterProof) => {
    console.log('Twitter proof received:', proof)
    setTwitterProof(proof)
    setResult(null)
    
    // Automatically start NulSet proof generation
    await handleVerifyAccess(proof)
  }

  const handleVerifyAccess = async (proof: TwitterProof) => {
    setVerifying(true)
    setResult(null)

    try {
      // Step 1: Verify Twitter proof
      console.log('Step 1: Verifying Twitter proof...')
      const twitterValid = await verifyTwitterProof(proof)
      
      if (!twitterValid.valid) {
        setResult({
          granted: false,
          message: `Twitter verification failed: ${twitterValid.reason}`
        })
        return
      }

      const twitterId = twitterValid.twitterId!
      console.log('Twitter ID verified:', twitterId)

      // Step 2: Generate NulSet proof
      console.log('Step 2: Generating NulSet proof...')
      const mockRoot = '10492359701221030970494707424271293435609873369838429079570923130897022847987'
      
      const nulsetProof = await generateNulSetProof(
        twitterId,
        mockRoot,
        (progress) => console.log('NulSet progress:', progress)
      )
      
      setNulSetProof(nulsetProof)

      // Step 3: Verify NulSet proof
      console.log('Step 3: Verifying NulSet proof...')
      const nulsetValid = await verifyNulSetProof(nulsetProof)
      
      if (!nulsetValid) {
        setResult({
          granted: false,
          message: 'NulSet proof verification failed. Access denied.'
        })
        return
      }

      // Both proofs valid
      // Check if Twitter ID is in banned list (for demo)
      const bannedIds = ['1234567890123456789', '9876543210987654321', '5555555555555555555']
      const isBanned = bannedIds.includes(twitterId)
      
      setResult({
        granted: !isBanned,
        message: isBanned
          ? 'Access denied: Twitter account is on the banned list.'
          : 'Zero-knowledge proofs verified. Access granted!'
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Demo</h1>
        <p className="text-gray-600">
          Sample platform that uses NulSet for privacy-preserving access control
        </p>
      </div>

      {/* Platform Card */}
      <div className="card border-2 border-primary-200 mb-6">
        <div className="flex items-center mb-6">
          <div className="text-5xl mr-4">🏢</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">SecurePlatform</h2>
            <p className="text-gray-600">Exclusive access for verified users</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            <strong>How it works:</strong> Enter your identifier to generate a zero-knowledge proof. 
            The platform will verify you're not on the banned list without learning your identity.
          </p>
        </div>

        <div className="space-y-4">
          {!twitterProof ? (
            <TwitterConnect
              onProofGenerated={handleTwitterProof}
              onError={(err) => console.error('Twitter connection error:', err)}
            />
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">Twitter Connected!</p>
              <p className="text-green-700 text-sm mt-1">
                Twitter ID: {twitterProof.twitterId}
              </p>
              <button
                onClick={() => {
                  setTwitterProof(null)
                  setNulSetProof(null)
                  setResult(null)
                }}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Connect different account
              </button>
            </div>
          )}
        </div>

        {verifying && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 mb-2">Verifying access...</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                <span>Verifying Twitter proof (ZK-TLS)</span>
              </div>
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                <span>Generating NulSet proof (Groth16)</span>
              </div>
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                <span>Verifying exclusion proof</span>
              </div>
            </div>
          </div>
        )}

        {nulsetProof && !result && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              Both proofs generated. Verifying...
            </p>
          </div>
        )}

        {result && (
          <div className={`mt-6 p-6 rounded-lg border-2 ${
            result.granted 
              ? 'bg-green-50 border-green-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-center mb-2">
              <span className="text-4xl mr-3">
                {result.granted ? '✅' : '❌'}
              </span>
              <h3 className={`text-xl font-bold ${
                result.granted ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.granted ? 'Access Granted' : 'Access Denied'}
              </h3>
            </div>
            <p className={result.granted ? 'text-green-800' : 'text-red-800'}>
              {result.message}
            </p>

            {result.granted && (
              <div className="mt-4 p-4 bg-white rounded border border-green-200">
                <p className="text-gray-700">
                  <strong>Welcome!</strong> You now have access to SecurePlatform.
                  Your identity remains private.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="card bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Privacy Guarantees</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Platform learns ONLY: "proof valid" or "proof invalid"</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Your identifier is never shared with the platform</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Proof generation happens locally in your browser</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>No information about other banned users is revealed</span>
          </li>
        </ul>
      </div>

      {/* Test Data */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-900 mb-2">Test Twitter IDs</h3>
        <p className="text-sm text-yellow-800 mb-2">For demo purposes:</p>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>
            <code className="bg-white px-2 py-1 rounded">8888888888888888888</code>
            <span className="text-gray-600 ml-2">- Alice (Good user, should grant access)</span>
          </li>
          <li>
            <code className="bg-white px-2 py-1 rounded">1234567890123456789</code>
            <span className="text-gray-600 ml-2">- Bob (Banned, should deny access)</span>
          </li>
          <li className="mt-2 text-xs text-gray-600">
            Note: Twitter connection button will use your configured test account's ID
          </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
