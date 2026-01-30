/**
 * TLSNotary integration types for Twitter verification
 * 
 * These types define the structure of TLS proofs generated
 * when users prove ownership of their Twitter accounts.
 */

export interface TwitterProof {
  // Twitter user ID extracted from TLS proof
  twitterId: string
  
  // The actual TLS attestation proof
  tlsProof: TLSAttestation
  
  // Timestamp of proof generation
  timestamp: number
  
  // Optional: username (if user chooses to reveal)
  username?: string
}

export interface TLSAttestation {
  // TLS session data
  session: {
    serverName: string
    timestamp: number
  }
  
  // Cryptographic proof of the TLS transcript
  proof: {
    // Notary signature
    signature: string
    
    // Public key of notary
    notaryPubKey: string
    
    // Revealed portions of transcript
    revealed: Record<string, any>
    
    // Redacted portions (hashed)
    redacted: string[]
  }
  
  // API response data (selectively revealed)
  data: {
    endpoint: string
    method: string
    statusCode: number
    headers: Record<string, string>
    body: string | object
  }
}

export interface TwitterAPIResponse {
  data: {
    id: string  // Twitter user ID
    name?: string
    username?: string
    created_at?: string
    verified?: boolean
    public_metrics?: {
      followers_count: number
      following_count: number
      tweet_count: number
    }
  }
}

export interface TLSNotaryConfig {
  // Notary server URL
  notaryUrl: string
  
  // Websocket proxy for TCP connections
  websocketProxyUrl: string
  
  // Max proof size in bytes
  maxProofSize?: number
  
  // Timeout for proof generation (ms)
  timeout?: number
}

export interface ProofGenerationProgress {
  step: 'init' | 'connecting' | 'requesting' | 'notarizing' | 'complete'
  message: string
  progress: number  // 0-100
}

export type ProofGenerationCallback = (progress: ProofGenerationProgress) => void

export interface VerificationResult {
  valid: boolean
  reason?: string
  twitterId?: string
  timestamp?: number
}

// Configuration defaults
export const DEFAULT_TLSNOTARY_CONFIG: TLSNotaryConfig = {
  notaryUrl: 'https://notary.pse.dev',  // PSE's hosted notary
  websocketProxyUrl: 'wss://notary.pse.dev/proxy',
  maxProofSize: 10 * 1024 * 1024,  // 10MB
  timeout: 60000  // 60 seconds
}
