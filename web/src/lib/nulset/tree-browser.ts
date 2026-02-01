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
const LEAF_EMPTY = BigInt(0)
const LEAF_BANNED = BigInt(1)

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
  const hashRaw = poseidon([left, right])
  return BigInt(poseidon.F.toObject(hashRaw))
}

/**
 * Sparse Merkle Tree implementation
 */
class SMTLite {
  private depth: number
  private leaves: Map<number, bigint>
  private zeroHashes: bigint[]

  constructor(depth: number = TREE_DEPTH) {
    this.depth = depth
    this.leaves = new Map()
    this.zeroHashes = this.computeZeroHashes()
  }

  private computeZeroHashes(): bigint[] {
    const zeros: bigint[] = [LEAF_EMPTY]
    for (let i = 0; i < this.depth; i++) {
      zeros.push(hash(zeros[i], zeros[i]))
    }
    return zeros
  }

  ban(identifier: string): void {
    const idx = this.deriveIndex(identifier)
    this.leaves.set(idx, LEAF_BANNED)
    console.log(`[SMT Browser] Banned: "${identifier}" -> index ${idx}`)
  }

  private getLeaf(idx: number): bigint {
    return this.leaves.get(idx) ?? LEAF_EMPTY
  }

  private deriveIndex(identifier: string): number {
    const bytes = new TextEncoder().encode(identifier)
    const chunks: bigint[] = []
    
    for (let i = 0; i < bytes.length; i += 31) {
      const chunk = bytes.slice(i, i + 31)
      let chunkBigInt = BigInt(0)
      for (let j = 0; j < chunk.length; j++) {
        chunkBigInt = (chunkBigInt << BigInt(8)) | BigInt(chunk[j])
      }
      chunks.push(chunkBigInt)
    }
    
    const hashInput = chunks.length > 0 ? chunks[0] : BigInt(0)
    const hashRaw = poseidon([hashInput])
    const hashValue = BigInt(poseidon.F.toObject(hashRaw))
    
    const mask = (BigInt(1) << BigInt(this.depth)) - BigInt(1)
    return Number(hashValue & mask)
  }

  computeRoot(): bigint {
    if (this.leaves.size === 0) {
      return this.zeroHashes[this.depth]
    }

    let currentLevel = new Map<number, bigint>()
    for (const [idx, value] of this.leaves.entries()) {
      currentLevel.set(idx, value)
    }

    for (let level = 0; level < this.depth; level++) {
      const nextLevel = new Map<number, bigint>()
      const parentIndices = new Set<number>()
      
      for (const idx of currentLevel.keys()) {
        parentIndices.add(Math.floor(idx / 2))
      }

      for (const parentIdx of parentIndices) {
        const leftIdx = parentIdx * 2
        const rightIdx = parentIdx * 2 + 1
        const left = currentLevel.get(leftIdx) ?? this.zeroHashes[level]
        const right = currentLevel.get(rightIdx) ?? this.zeroHashes[level]
        
        if (left !== this.zeroHashes[level] || right !== this.zeroHashes[level]) {
          nextLevel.set(parentIdx, hash(left, right))
        }
      }
      
      currentLevel = nextLevel
    }

    return currentLevel.get(0) ?? this.zeroHashes[this.depth]
  }

  generateWitness(identifier: string): MerkleWitness {
    const idx = this.deriveIndex(identifier)
    const leaf = this.getLeaf(idx)
    
    const siblings: bigint[] = []
    const directions: bigint[] = []
    let currentIdx = idx

    for (let level = 0; level < this.depth; level++) {
      const isLeftChild = currentIdx % 2 === 0
      const siblingIdx = isLeftChild ? currentIdx + 1 : currentIdx - 1
      
      const sibling = this.computeSibling(level, siblingIdx)
      siblings.push(sibling)
      directions.push(isLeftChild ? BigInt(0) : BigInt(1))
      
      currentIdx = Math.floor(currentIdx / 2)
    }

    const status = leaf === LEAF_EMPTY ? "✓ ALLOWED" : "✗ BANNED"
    console.log(`[SMT Browser] Witness for "${identifier}": index=${idx}, leaf=${leaf} ${status}`)

    return {
      idx: idx.toString(),
      leaf_value: leaf.toString(),
      siblings: siblings.map(s => s.toString()),
      direction_bits: directions.map(d => d.toString())
    }
  }

  private computeSibling(level: number, idx: number): bigint {
    if (level === 0) {
      return this.getLeaf(idx)
    }

    const subtreeStart = idx * (2 ** level)
    const subtreeEnd = (idx + 1) * (2 ** level)
    
    let hasNonZero = false
    for (const leafIdx of this.leaves.keys()) {
      if (leafIdx >= subtreeStart && leafIdx < subtreeEnd) {
        hasNonZero = true
        break
      }
    }

    if (!hasNonZero) {
      return this.zeroHashes[level]
    }

    const left = this.computeSibling(level - 1, idx * 2)
    const right = this.computeSibling(level - 1, idx * 2 + 1)
    return hash(left, right)
  }
}

/**
 * Generate Merkle witness for a given identifier
 * 
 * @param identifier User ID (string)
 * @param bannedIds Array of banned IDs
 * @param root Expected Merkle root (for validation)
 * @returns Merkle witness for proof generation
 */
export async function generateWitnessForId(
  identifier: string,
  bannedIds: string[],
  root: string
): Promise<MerkleWitness> {
  await initPoseidon()
  
  console.log('[Tree Browser] Generating witness for:', identifier)
  console.log('[Tree Browser] Banned IDs:', bannedIds.length)
  
  // Build tree with banned IDs
  const tree = new SMTLite(TREE_DEPTH)
  for (const id of bannedIds) {
    tree.ban(id)
  }
  
  // Compute root
  const computedRoot = tree.computeRoot()
  console.log('[Tree Browser] Computed root:', computedRoot.toString())
  console.log('[Tree Browser] Expected root:', root)
  
  if (computedRoot.toString() !== root) {
    console.warn('[Tree Browser] Root mismatch! Proof may fail.')
  }
  
  // Generate witness
  const witness = tree.generateWitness(identifier)
  return witness
}


/**
 * Build tree and compute root (for admin panel)
 */
export async function buildTreeAndGetRoot(bannedIds: string[]): Promise<string> {
  await initPoseidon()
  
  console.log('[Tree Browser] Building tree for', bannedIds.length, 'banned IDs')
  
  const tree = new SMTLite(TREE_DEPTH)
  for (const id of bannedIds) {
    tree.ban(id)
  }
  
  const root = tree.computeRoot()
  console.log('[Tree Browser] Root:', root.toString())
  
  return root.toString()
}
