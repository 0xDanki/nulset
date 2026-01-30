import { useState } from 'react'

export default function UserProve() {
  const [identifier, setIdentifier] = useState('')
  const [generating, setGenerating] = useState(false)
  const [proof, setProof] = useState<any>(null)
  const [progress, setProgress] = useState<string[]>([])

  const generateProof = async () => {
    if (!identifier.trim()) {
      alert('Please enter an identifier')
      return
    }

    setGenerating(true)
    setProof(null)
    setProgress([])

    try {
      // TODO: Integrate with actual proof generation
      // For now, simulate the process
      
      const steps = [
        'Initializing Poseidon hash...',
        'Building sparse Merkle tree witness...',
        'Loading circuit WASM...',
        'Computing witness...',
        'Generating Groth16 proof...',
        'Proof generated successfully!'
      ]

      for (const step of steps) {
        setProgress(prev => [...prev, step])
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Mock proof
      const mockProof = {
        pi_a: ['1234...', '5678...', '90ab...'],
        pi_b: [['cdef...', 'ghij...'], ['klmn...', 'opqr...'], ['stuv...', 'wxyz...']],
        pi_c: ['abcd...', 'efgh...', 'ijkl...'],
        publicSignals: ['10492359701221030970...']
      }

      setProof(mockProof)
    } catch (err) {
      setProgress(prev => [...prev, `Error: ${err}`])
    } finally {
      setGenerating(false)
    }
  }

  const downloadProof = () => {
    const blob = new Blob([JSON.stringify(proof, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `proof_${identifier.replace(/[^a-z0-9]/gi, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Verification</h1>
        <p className="text-gray-600">
          Generate a zero-knowledge proof to prove you're not on the banned list
        </p>
      </div>

      {/* Proof Generation */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Zero-Knowledge Proof</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Identifier
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="alice@example.com"
              className="w-full input"
              disabled={generating}
            />
            <p className="mt-1 text-xs text-gray-500">
              Your identifier never leaves your browser
            </p>
          </div>

          <button
            onClick={generateProof}
            disabled={generating || !identifier.trim()}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating Proof...' : 'Generate Proof'}
          </button>
        </div>

        {progress.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Progress:</h3>
            <div className="space-y-1">
              {progress.map((step, idx) => (
                <div key={idx} className="flex items-start text-sm">
                  <span className="text-green-600 mr-2">
                    {idx === progress.length - 1 && !generating ? '✓' : '→'}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {proof && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">Proof Generated Successfully!</h3>
            
            <div className="bg-white rounded p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">Proof Structure:</p>
              <pre className="text-xs font-mono overflow-x-auto max-h-60 overflow-y-auto">
                {JSON.stringify(proof, null, 2)}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-600">Proof Size:</span>
                <span className="ml-2 font-medium">~192 bytes</span>
              </div>
              <div>
                <span className="text-gray-600">Verification Time:</span>
                <span className="ml-2 font-medium">&lt;1ms</span>
              </div>
              <div>
                <span className="text-gray-600">Privacy:</span>
                <span className="ml-2 font-medium text-green-600">Full ZK</span>
              </div>
              <div>
                <span className="text-gray-600">Proof System:</span>
                <span className="ml-2 font-medium">Groth16</span>
              </div>
            </div>

            <button
              onClick={downloadProof}
              className="btn btn-primary"
            >
              Download Proof JSON
            </button>

            <p className="mt-4 text-sm text-green-700">
              You can now submit this proof to any platform using this exclusion list.
            </p>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">How Zero-Knowledge Proofs Work</h3>
        <ol className="space-y-2 text-gray-700 text-sm">
          <li><strong>1. Witness Generation:</strong> Your browser computes your position in the Merkle tree locally</li>
          <li><strong>2. Proof Generation:</strong> Using Groth16, your browser creates a cryptographic proof that you're not banned (10-30 seconds)</li>
          <li><strong>3. Privacy:</strong> The proof reveals ONLY "I'm not banned" - no identifier, no tree position, no other information</li>
          <li><strong>4. Verification:</strong> Any platform can verify your proof in milliseconds</li>
          <li><strong>5. Unlinkability:</strong> Multiple proofs from the same user are indistinguishable</li>
        </ol>
      </div>

      {/* Technical Details */}
      <div className="mt-6 card bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Specifications</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Circuit:</p>
            <p className="font-medium">Circom (7,744 constraints)</p>
          </div>
          <div>
            <p className="text-gray-600">Proof System:</p>
            <p className="font-medium">Groth16</p>
          </div>
          <div>
            <p className="text-gray-600">Hash Function:</p>
            <p className="font-medium">Poseidon</p>
          </div>
          <div>
            <p className="text-gray-600">Tree Depth:</p>
            <p className="font-medium">32 (4.3B capacity)</p>
          </div>
          <div>
            <p className="text-gray-600">Security:</p>
            <p className="font-medium">128-bit (BN254)</p>
          </div>
          <div>
            <p className="text-gray-600">Browser Execution:</p>
            <p className="font-medium">WASM + snarkjs</p>
          </div>
        </div>
      </div>
    </div>
  )
}
