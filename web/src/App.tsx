import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import AdminUpload from './pages/admin/Upload'
import PlatformDemo from './pages/platform/Demo'
import Faucet from './pages/platform/Faucet'
import FaucetOnchain from './pages/platform/FaucetOnchain'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">NulSet</h1>
                  <span className="ml-3 text-sm text-gray-500">Privacy-Preserving Exclusion</span>
                </div>
                <div className="ml-10 flex items-center space-x-4">
                  <Link 
                    to="/admin" 
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin
                  </Link>
                  <Link 
                    to="/platform" 
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Demo (Manual)
                  </Link>
                  <Link 
                    to="/faucet" 
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Faucet (Mock)
                  </Link>
                  <Link 
                    to="/faucet-onchain" 
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Faucet (On-Chain) ⭐
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<AdminUpload />} />
            <Route path="/platform" element={<PlatformDemo />} />
            <Route path="/faucet" element={<Faucet />} />
            <Route path="/faucet-onchain" element={<FaucetOnchain />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

function Home() {
  return (
    <div className="text-center py-12">
      <h2 className="text-4xl font-bold text-gray-900 mb-4">
        Privacy-Preserving Exclusion Verification
      </h2>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Prove you're not on a banned list without revealing your identity.
        Built with zero-knowledge proofs and sparse Merkle trees.
      </p>
      
      <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-4xl mx-auto">
        <Link to="/admin" className="card hover:shadow-lg transition-shadow">
          <div className="text-primary-600 text-4xl mb-4">🔐</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Administrator</h3>
          <p className="text-gray-600">
            Upload banned identifiers and generate Merkle root commitments
          </p>
        </Link>

        <Link to="/platform" className="card hover:shadow-lg transition-shadow">
          <div className="text-primary-600 text-4xl mb-4">🧪</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Demo (Manual)</h3>
          <p className="text-gray-600">
            Test with any identifier (address, email, ID, etc.)
          </p>
        </Link>

        <Link to="/faucet" className="card hover:shadow-lg transition-shadow">
          <div className="text-primary-600 text-4xl mb-4">💧</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Faucet (Mock)</h3>
          <p className="text-gray-600">
            Connect wallet and claim {5} $NUL mock tokens (localStorage)
          </p>
        </Link>

        <Link to="/faucet-onchain" className="card hover:shadow-lg transition-shadow border-2 border-primary-300">
          <div className="text-primary-600 text-4xl mb-4">⭐</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Faucet (On-Chain)</h3>
          <p className="text-gray-600">
            Real ERC-20 tokens on Base Sepolia with on-chain verification
          </p>
        </Link>
      </div>

      <div className="mt-16 p-6 bg-blue-50 rounded-lg max-w-3xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">How it works</h3>
        <div className="text-left text-gray-700 space-y-2">
          <p>1. <strong>Admin</strong> uploads list of banned identifiers → builds sparse Merkle tree → publishes root</p>
          <p>2. <strong>User</strong> generates witness (Merkle path) for their identifier</p>
          <p>3. <strong>User</strong> creates Groth16 zero-knowledge proof in browser (10-30s)</p>
          <p>4. <strong>Platform</strong> verifies proof cryptographically → grants or denies access</p>
        </div>
      </div>
    </div>
  )
}

export default App
