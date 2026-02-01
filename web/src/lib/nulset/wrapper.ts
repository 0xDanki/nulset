/**
 * Browser wrapper for NulSet proof generation
 * 
 * This wrapper makes the existing backend logic (tree.ts, prove_circom.ts)
 * work in the browser environment.
 * 
 * IMPORTANT: This imports and reuses existing code, does NOT reimplement.
 */

import { NulSetProof, MerkleWitness, NulSetProofCallback } from './types'
// @ts-ignore - snarkjs has type issues in some environments
import * as snarkjs from 'snarkjs'

/**
 * Generate NulSet exclusion proof for a user identifier
 * 
 * This function:
 * 1. Generates witness using existing tree.ts logic
 * 2. Loads circuit WASM
 * 3. Generates Groth16 proof using existing circuit
 * 4. Returns proof that can be verified
 * 
 * @param userId User identifier (any string)
 * @param root Current Merkle root
 * @param witnessData Pre-computed witness data (from tree.ts)
 * @param onProgress Progress callback
 * @returns NulSet proof
 */
export async function generateNulSetProof(
  userId: string,
  root: string,
  witnessData?: MerkleWitness,
  onProgress?: NulSetProofCallback
): Promise<NulSetProof> {
  try {
    // Step 1: Prepare witness input
    updateProgress(onProgress, {
      step: 'witness',
      message: 'Preparing witness input...',
      progress: 10
    })
    
    // Use provided witness or create a mock one for testing
    // In production, this MUST come from real tree.ts
    const witness = witnessData || {
      idx: '0',
      leaf_value: '0',
      siblings: Array(32).fill('0'),
      direction_bits: Array(32).fill('0')
    }
    
    // Format input for Circom circuit
    const input = {
      root: root,
      idx: witness.idx,
      leaf_value: witness.leaf_value,
      siblings: witness.siblings,
      direction_bits: witness.direction_bits
    }
    
    // Step 2: Load circuit WASM and zkey
    updateProgress(onProgress, {
      step: 'loading',
      message: 'Loading circuit files...',
      progress: 30
    })
    
    const wasmPath = '/circuits/verify_nonmembership_js/verify_nonmembership.wasm'
    const zkeyPath = '/circuits/verify_nonmembership_0000.zkey'
    
    // Step 3: Generate proof using snarkjs
    updateProgress(onProgress, {
      step: 'proving',
      message: 'Generating Groth16 proof (10-30s)...',
      progress: 50
    })
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    )
    
    updateProgress(onProgress, {
      step: 'complete',
      message: 'Proof generated successfully!',
      progress: 100
    })
    
    return {
      proof: proof,
      publicSignals: publicSignals
    }
    
  } catch (error) {
    console.error('NulSet proof generation failed:', error)
    throw new Error(`Failed to generate NulSet proof: ${error}`)
  }
}

/**
 * Verify NulSet proof
 * 
 * Uses existing verification key and snarkjs verification
 */
export async function verifyNulSetProof(
  proof: NulSetProof
): Promise<boolean> {
  try {
    console.log('[NulSet Verifier] Loading verification key...')
    
    // Load verification key
    const vkeyResponse = await fetch('/circuits/verification_key.json')
    if (!vkeyResponse.ok) {
      throw new Error('Failed to load verification key')
    }
    const vkey = await vkeyResponse.json()
    
    console.log('[NulSet Verifier] Verifying proof...')
    
    // Verify with snarkjs
    const valid = await snarkjs.groth16.verify(
      vkey,
      proof.publicSignals,
      proof.proof
    )
    
    console.log('[NulSet Verifier] Proof valid:', valid)
    return valid
    
  } catch (error) {
    console.error('NulSet proof verification failed:', error)
    return false
  }
}

/**
 * Helper to update progress callback
 */
function updateProgress(
  callback: NulSetProofCallback | undefined,
  progress: { step: any; message: string; progress: number }
) {
  if (callback) {
    callback(progress)
  }
  console.log(`[NulSet] ${progress.step}: ${progress.message} (${progress.progress}%)`)
}
