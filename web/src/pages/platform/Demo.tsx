import { useState } from 'react'

export default function PlatformDemo() {
  const [identifier, setIdentifier] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<{ granted: boolean; message: string } | null>(null)

  const handleLogin = async () => {
    if (!identifier.trim()) {
      alert('Please enter an identifier')
      return
    }

    setVerifying(true)
    setResult(null)

    try {
      // TODO: Generate proof and verify
      // For now, simulate verification
      console.log('Verifying access for:', identifier)
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock verification result
      const isAllowed = !identifier.toLowerCase().includes('banned')
      
      setResult({
        granted: isAllowed,
        message: isAllowed 
          ? 'Zero-knowledge proof verified. Access granted.' 
          : 'Proof verification failed. Access denied.'
      })
    } catch (err) {
      setResult({
        granted: false,
        message: `Error: ${err}`
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Identifier (Email/Username)
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="alice@example.com"
              className="w-full input"
              disabled={verifying}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={verifying || !identifier.trim()}
            className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3 text-lg"
          >
            {verifying ? 'Verifying Access...' : 'Login with Zero-Knowledge Proof'}
          </button>
        </div>

        {verifying && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 mb-2">Generating proof...</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                <span>Computing Merkle witness</span>
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
        <h3 className="font-semibold text-yellow-900 mb-2">Test Data</h3>
        <p className="text-sm text-yellow-800 mb-2">Try these identifiers:</p>
        <ul className="text-sm space-y-1">
          <li>
            <button 
              onClick={() => setIdentifier('alice@example.com')} 
              className="text-blue-600 hover:underline"
            >
              alice@example.com
            </button>
            <span className="text-gray-600 ml-2">(Not banned - should grant access)</span>
          </li>
          <li>
            <button 
              onClick={() => setIdentifier('bob@banned.com')} 
              className="text-blue-600 hover:underline"
            >
              bob@banned.com
            </button>
            <span className="text-gray-600 ml-2">(Banned - should deny access)</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
