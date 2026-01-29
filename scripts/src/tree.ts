import { buildPoseidon } from "circomlibjs";

// SMT-lite tree builder for non-membership proofs
// Depth: 32, Leaf values: 0 (empty), 1 (banned)
// Hash: Poseidon (BN254) - MUST match Noir circuit

// Poseidon instance (initialized async)
let poseidon: any = null;

const TREE_DEPTH = 32;
const LEAF_EMPTY = BigInt(0);
const LEAF_BANNED = BigInt(1);

export interface MerkleWitness {
  idx: string;
  leaf_value: string;
  siblings: string[];
  direction_bits: string[];
}

export interface TreeData {
  root: string;
  depth: number;
  bannedIndices: number[];
}

export class SMTLite {
  private depth: number;
  private leaves: Map<number, bigint>; // Only store non-zero leaves
  private zeroHashes: bigint[]; // Precomputed hashes of empty subtrees at each level

  private constructor(depth: number = TREE_DEPTH) {
    this.depth = depth;
    this.leaves = new Map();
    this.zeroHashes = this.computeZeroHashes();
    
    const maxLeaves = 2 ** this.depth;
    console.log(`[SMT] Initialized sparse tree with depth=${this.depth}, max leaves=${maxLeaves}`);
  }

  // Async factory method to initialize Poseidon
  static async create(depth: number = TREE_DEPTH): Promise<SMTLite> {
    if (!poseidon) {
      poseidon = await buildPoseidon();
    }
    return new SMTLite(depth);
  }

  // Precompute hashes of empty subtrees at each level
  // zeroHashes[0] = hash of empty leaf (0)
  // zeroHashes[i] = hash(zeroHashes[i-1], zeroHashes[i-1])
  private computeZeroHashes(): bigint[] {
    const zeros: bigint[] = [LEAF_EMPTY];
    
    for (let i = 0; i < this.depth; i++) {
      const prevZero = zeros[i];
      const hashRaw = poseidon([prevZero, prevZero]);
      const hash = BigInt(poseidon.F.toObject(hashRaw));
      zeros.push(hash);
    }
    
    return zeros;
  }

  // Mark identifier as banned (leaf = 1)
  public ban(identifier: string): void {
    const idx = this.deriveIndex(identifier);
    this.leaves.set(idx, LEAF_BANNED);
    console.log(`[SMT] Banned: "${identifier}" -> index ${idx}`);
  }

  // Get leaf value (0 if not set, since tree is sparse)
  private getLeaf(idx: number): bigint {
    return this.leaves.get(idx) ?? LEAF_EMPTY;
  }

  // Derive deterministic index from identifier
  private deriveIndex(identifier: string): number {
    // Hash identifier to get a field element, then take bottom 32 bits
    const bytes = Buffer.from(identifier, 'utf8');
    
    // Split into chunks and hash
    const chunks: bigint[] = [];
    for (let i = 0; i < bytes.length; i += 31) {
      const chunk = bytes.subarray(i, i + 31);
      const chunkBigInt = BigInt("0x" + chunk.toString("hex"));
      chunks.push(chunkBigInt);
    }
    
    // Hash all chunks (or just first if single chunk)
    const hashInput = chunks.length > 0 ? chunks[0] : BigInt(0);
    const hashRaw = poseidon([hashInput]);
    const hash = BigInt(poseidon.F.toObject(hashRaw));
    
    // Take bottom 32 bits as index
    const mask = (BigInt(1) << BigInt(this.depth)) - BigInt(1);
    const idx = Number(hash & mask);
    
    return idx;
  }

  // Compute Merkle root efficiently for sparse tree
  public computeRoot(): bigint {
    // If no banned users, root is just the zero hash at depth
    if (this.leaves.size === 0) {
      const root = this.zeroHashes[this.depth];
      console.log(`[SMT] Computed root (empty tree): ${root.toString()}`);
      return root;
    }
    
    // For sparse tree with few leaves, compute only the affected branches
    // Start with all leaves set to their values or zero
    let currentLevel = new Map<number, bigint>();
    
    // Initialize leaf level
    const maxIndex = 2 ** this.depth;
    for (const [idx, value] of this.leaves.entries()) {
      if (idx < maxIndex) {
        currentLevel.set(idx, value);
      }
    }
    
    // Hash up level by level
    for (let level = 0; level < this.depth; level++) {
      const nextLevel = new Map<number, bigint>();
      
      // Find all parent indices that need computation
      const parentIndices = new Set<number>();
      for (const idx of currentLevel.keys()) {
        parentIndices.add(Math.floor(idx / 2));
      }
      
      // Compute each parent
      for (const parentIdx of parentIndices) {
        const leftIdx = parentIdx * 2;
        const rightIdx = parentIdx * 2 + 1;
        
        const left = currentLevel.get(leftIdx) ?? this.zeroHashes[level];
        const right = currentLevel.get(rightIdx) ?? this.zeroHashes[level];
        
        // Only store if not both zero
        if (left !== this.zeroHashes[level] || right !== this.zeroHashes[level]) {
          const hashRaw = poseidon([left, right]);
          const hash = BigInt(poseidon.F.toObject(hashRaw));
          nextLevel.set(parentIdx, hash);
        }
      }
      
      currentLevel = nextLevel;
    }
    
    // Root is at index 0 of the top level
    const root = currentLevel.get(0) ?? this.zeroHashes[this.depth];
    console.log(`[SMT] Computed root: ${root.toString()}`);
    return root;
  }

  // Generate witness for a given identifier
  public generateWitness(identifier: string): MerkleWitness {
    const idx = this.deriveIndex(identifier);
    const leaf = this.getLeaf(idx);
    
    const siblings: bigint[] = [];
    const directions: bigint[] = [];
    
    let currentIdx = idx;
    
    // Collect siblings from leaf to root
    for (let level = 0; level < this.depth; level++) {
      const isLeftChild = currentIdx % 2 === 0;
      const siblingIdx = isLeftChild ? currentIdx + 1 : currentIdx - 1;
      
      // Get sibling value - need to compute it recursively
      const sibling = this.computeSibling(level, siblingIdx);
      siblings.push(sibling);
      
      // direction = 0: current is left, direction = 1: current is right
      directions.push(isLeftChild ? BigInt(0) : BigInt(1));
      
      currentIdx = Math.floor(currentIdx / 2);
    }
    
    const status = leaf === LEAF_EMPTY ? "✓ ALLOWED" : "✗ BANNED";
    console.log(`[SMT] Generated witness for "${identifier}": index=${idx}, leaf=${leaf} ${status}`);
    
    return {
      idx: idx.toString(),
      leaf_value: leaf.toString(),
      siblings: siblings.map(s => s.toString()),
      direction_bits: directions.map(d => d.toString())
    };
  }

  // Compute value at a specific position (for witness generation)
  private computeSibling(level: number, idx: number): bigint {
    if (level === 0) {
      return this.getLeaf(idx);
    }
    
    // For sparse tree, check if entire subtree is empty
    // If no leaves in this subtree range, return zero hash
    const subtreeStart = idx * (2 ** level);
    const subtreeEnd = (idx + 1) * (2 ** level);
    
    let hasNonZero = false;
    for (const leafIdx of this.leaves.keys()) {
      if (leafIdx >= subtreeStart && leafIdx < subtreeEnd) {
        hasNonZero = true;
        break;
      }
    }
    
    if (!hasNonZero) {
      return this.zeroHashes[level];
    }
    
    // Compute recursively
    const left = this.computeSibling(level - 1, idx * 2);
    const right = this.computeSibling(level - 1, idx * 2 + 1);
    
    const hashRaw = poseidon([left, right]);
    return BigInt(poseidon.F.toObject(hashRaw));
  }

  // Export tree data
  public export(): TreeData {
    const bannedIndices: number[] = Array.from(this.leaves.keys()).sort((a, b) => a - b);
    const root = this.computeRoot();
    
    return {
      root: root.toString(),
      depth: this.depth,
      bannedIndices
    };
  }
}
