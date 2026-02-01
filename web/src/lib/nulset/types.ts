/**
 * NulSet types for browser integration
 * 
 * These types wrap the existing backend logic for use in the browser
 */

export interface NulSetProof {
  // Groth16 proof components (snarkjs format)
  pi_a: string[]
  pi_b: string[][]
  pi_c: string[]
  
  // Public signals (merkle root)
  publicSignals: string[]
}

export interface MerkleWitness {
  idx: string
  leaf_value: string
  siblings: string[]
  direction_bits: string[]
}

export interface TreeData {
  root: string
  depth: number
  bannedCount: number
  bannedIndices: string[]
}

export interface ProofGenerationProgress {
  step: 'witness' | 'loading' | 'proving' | 'complete'
  message: string
  progress: number
}

export type NulSetProofCallback = (progress: ProofGenerationProgress) => void
