import { useState } from 'react'

export default function AdminUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [identifiers, setIdentifiers] = useState<string[]>([])
  const [root, setRoot] = useState<string>('')
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string>('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setError('')
    setFile(uploadedFile)

    try {
      const text = await uploadedFile.text()
      
      // Parse CSV or JSON
      let parsed: string[] = []
      if (uploadedFile.name.endsWith('.json')) {
        const json = JSON.parse(text)
        parsed = json.banned || json.identifiers || []
      } else if (uploadedFile.name.endsWith('.csv')) {
        // Simple CSV parsing (identifier per line, skip header)
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
        parsed = lines.slice(1) // Skip header
      }

      if (parsed.length === 0) {
        throw new Error('No identifiers found in file')
      }

      setIdentifiers(parsed)
      console.log('Parsed identifiers:', parsed)
    } catch (err) {
      setError(`Failed to parse file: ${err}`)
      setFile(null)
    }
  }

  const buildTree = async () => {
    if (identifiers.length === 0) {
      setError('No identifiers to build tree from')
      return
    }

    setBuilding(true)
    setError('')

    try {
      // TODO: Import and use the existing tree.ts logic
      // For now, simulate tree building
      console.log('Building tree with identifiers:', identifiers)
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock root for now
      const mockRoot = '10492359701221030970494707424271293435609873369838429079570923130897022847987'
      setRoot(mockRoot)
      
      console.log('Tree built. Root:', mockRoot)
    } catch (err) {
      setError(`Failed to build tree: ${err}`)
    } finally {
      setBuilding(false)
    }
  }

  const downloadRoot = () => {
    const rootData = {
      root,
      depth: 32,
      bannedCount: identifiers.length,
      bannedIndices: identifiers,
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(rootData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'root.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Administrator Panel</h1>
        <p className="text-gray-600">
          Upload a list of banned Twitter user IDs to build a sparse Merkle tree exclusion set
        </p>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <p><strong>Note:</strong> Upload Twitter user IDs (19-digit numbers), not email addresses. Users will prove ownership via ZK-TLS.</p>
        </div>
      </div>

      {/* Step 1: File Upload */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Upload Banned List</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".csv,.json"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label 
            htmlFor="file-upload" 
            className="cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Choose CSV or JSON File
          </label>
          
          {file && (
            <p className="mt-4 text-gray-600">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {identifiers.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">
              Successfully parsed {identifiers.length} identifiers
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-green-600">View identifiers</summary>
              <ul className="mt-2 text-sm text-gray-700 max-h-40 overflow-y-auto">
                {identifiers.map((id, idx) => (
                  <li key={idx} className="py-1">{id}</li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>

      {/* Step 2: Build Tree */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Build Merkle Tree</h2>
        
        <button
          onClick={buildTree}
          disabled={identifiers.length === 0 || building}
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {building ? 'Building Tree...' : 'Build Sparse Merkle Tree'}
        </button>

        {building && (
          <div className="mt-4 text-gray-600">
            <p>Building sparse Merkle tree with depth=32...</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Display Root */}
      {root && (
        <div className="card bg-primary-50 border-2 border-primary-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 3: Merkle Root</h2>
          
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Root Commitment:</p>
            <code className="block text-xs font-mono text-gray-900 break-all bg-gray-50 p-3 rounded">
              {root}
            </code>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-600">Tree Depth:</span>
              <span className="ml-2 font-medium">32</span>
            </div>
            <div>
              <span className="text-gray-600">Banned Count:</span>
              <span className="ml-2 font-medium">{identifiers.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Capacity:</span>
              <span className="ml-2 font-medium">4,294,967,296 identifiers</span>
            </div>
            <div>
              <span className="text-gray-600">Hash Function:</span>
              <span className="ml-2 font-medium">Poseidon</span>
            </div>
          </div>

          <button
            onClick={downloadRoot}
            className="btn btn-primary"
          >
            Download root.json
          </button>

          <p className="mt-4 text-sm text-gray-600">
            Share this root with platforms that want to use this exclusion list.
          </p>
        </div>
      )}

      {/* Format Help */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
        <h3 className="font-semibold mb-2">File Format</h3>
        <p className="mb-2">CSV (Twitter IDs):</p>
        <pre className="bg-white p-2 rounded mb-3">
{`identifier
1234567890123456789
9876543210987654321`}
        </pre>
        <p className="mb-2">JSON (Twitter IDs):</p>
        <pre className="bg-white p-2 rounded">
{`{
  "banned": [
    "1234567890123456789",
    "9876543210987654321"
  ]
}`}
        </pre>
        <p className="mt-3 text-xs text-gray-600">
          <strong>Tip:</strong> Use test-data/banned-twitter-ids.json for demo
        </p>
      </div>
    </div>
  )
}
