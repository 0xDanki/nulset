/**
 * Browser-compatible SMT-lite tree logic
 * 
 * This is adapted from scripts/src/tree.ts to work in the browser.
 * Uses circomlibjs for Poseidon hash (same as backend).
 * 
 * IMPORTANT: Keep hash logic identical to backend!
 */

import { buildPoseidon } from 'circomlibjs'
import { MerkleWitness } from './types'

const TREE_DEPTH = 32

// Poseidon instance
let poseidon: any = null

/**
 * Initialize Poseidon hash (async, must call before use)
 */
async function initPoseidon() {
  if (!poseidon) {
    poseidon = await buildPoseidon()
  }
  return poseidon
}

/**
 * Hash two field elements using Poseidon
 * MUST match backend implementation exactly!
 */
function hash(left: bigint, right: bigint): bigint {
  if (!poseidon) {
    throw new Error('Poseidon not initialized. Call initPoseidon() first.')
  }
  const result = poseidon.F.toString(poseidon([left, right]))
  return BigInt(result)
}

/**
 * Generate Merkle witness for a given identifier
 * 
 * @param identifier Twitter ID (string)
 * @param bannedIds Array of banned Twitter IDs
 * @param root Expected Merkle root (for validation)
 * @returns Merkle witness for proof generation
 */
export async function generateWitnessForId(
  identifier: string,
  bannedIds: string[],
  root: string
): Promise<MerkleWitness> {
  // Initialize Poseidon
  await initPoseidon()
  
  console.log('[Tree Browser] Generating witness for:', identifier)
  console.log('[Tree Browser] Banned IDs:', bannedIds.length)
  
  // Derive index from identifier
  const idx = deriveIndex(identifier)
  console.log('[Tree Browser] Derived index:', idx)
  
  // Check if identifier is banned
  const isBanned = bannedIds.includes(identifier)
  const leafValue = isBanned ? '1' : '0'
  
  console.log('[Tree Browser] Is banned:', isBanned, 'Leaf value:', leafValue)
  
  // Generate Merkle path
  const { siblings, directionBits } = await computeMerklePath(idx, bannedIds)
  
  // Verify the path reaches the expected root
  const computedRoot = computeRootFromPath(
    BigInt(idx),
    BigInt(leafValue),
    siblings.map(s => BigInt(s)),
    directionBits.map(b => BigInt(b))
  )
  
  console.log('[Tree Browser] Computed root:', computedRoot.toString())
  console.log('[Tree Browser] Expected root:', root)
  
  if (computedRoot.toString() !== root) {
    console.warn('[Tree Browser] Root mismatch! Proof may fail.')
  }
  
  return {
    idx: idx.toString(),
    leaf_value: leafValue,
    siblings: siblings,
    direction_bits: directionBits
  }
}

/**
 * Derive tree index from identifier (matches backend)
 */
function deriveIndex(identifier: string): number {
  // Simple hash-based derivation
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    hash = ((hash << 5) - hash) + identifier.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  // Ensure positive and within tree size
  const maxLeaves = Math.pow(2, TREE_DEPTH)
  return Math.abs(hash) % maxLeaves
}

/**
 * Compute Merkle path for an index
 */
async function computeMerklePath(
  idx: number,
  bannedIds: string[]
): Promise<{ siblings: string[], directionBits: string[] }> {
  const siblings: string[] = []
  const directionBits: string[] = []
  
  // Build banned indices map
  const bannedIndices = new Set<number>()
  for (const id of bannedIds) {
    bannedIndices.add(deriveIndex(id))
  }
  
  // Compute zero hashes (for empty subtrees)
  const zeroHashes = await computeZeroHashes()
  
  let currentIdx = idx
  
  for (let level = 0; level < TREE_DEPTH; level++) {
    const isRight = currentIdx % 2 === 1
    const siblingIdx = isRight ? currentIdx - 1 : currentIdx + 1
    
    directionBits.push(isRight ? '1' : '0')
    
    // Check if sibling is banned
    const siblingIsBanned = bannedIndices.has(siblingIdx)
    const siblingValue = siblingIsBanned ? BigInt(1) : BigInt(0)
    
    // Compute sibling hash
    let siblingHash: bigint
    if (level === 0) {
      // Leaf level
      siblingHash = siblingValue
    } else {
      // Internal node - would need full tree reconstruction
      // For now, use zero hash (empty subtree assumption)
      siblingHash = zeroHashes[level]
    }
    
    siblings.push(siblingHash.toString())
    
    currentIdx = Math.floor(currentIdx / 2)
  }
  
  return { siblings, directionBits }
}

/**
 * Compute zero hashes for empty subtrees
 */
async function computeZeroHashes(): Promise<bigint[]> {
  const zeroHashes: bigint[] = [BigInt(0)]
  
  for (let i = 1; i <= TREE_DEPTH; i++) {
    const prev = zeroHashes[i - 1]
    zeroHashes.push(hash(prev, prev))
  }
  
  return zeroHashes
}

/**
 * Compute root from Merkle path (for verification)
 */
function computeRootFromPath(
  idx: bigint,
  leafValue: bigint,
  siblings: bigint[],
  directionBits: bigint[]
): bigint {
  let current = leafValue
  
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i]
    const isRight = directionBits[i] === BigInt(1)
    
    if (isRight) {
      current = hash(sibling, current)
    } else {
      current = hash(current, sibling)
    }
  }
  
  return current
}

/**
 * Build tree and compute root (for admin panel)
 */
export async function buildTreeAndGetRoot(bannedIds: string[]): Promise<string> {
  await initPoseidon()
  
  console.log('[Tree Browser] Building tree for', bannedIds.length, 'banned IDs')
  
  // For now, return a mock root
  // In production, this would build the full tree
  // and compute the root properly
  
  // TODO: Implement full tree building
  // This should match the backend tree.ts exactly
  
  const mockRoot = '10492359701221030970494707424271293435609873369838429079570923130897022847987'
  return mockRoot
}
