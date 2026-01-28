import { poseidon2 } from "@zk-kit/poseidon";

// SMT-lite tree builder for non-membership proofs
// Depth: 32, Leaf values: 0 (empty), 1 (banned)
// Hash: Poseidon (BN254) - MUST match Noir circuit

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
  private tree: Map<string, bigint>; // key: "level-index", value: hash

  constructor(depth: number = TREE_DEPTH) {
    this.depth = depth;
    this.tree = new Map();
    this.initializeEmptyTree();
  }

  // Initialize tree with all leaves = 0 (empty)
  private initializeEmptyTree(): void {
    const maxLeaves = 2 ** this.depth;
    
    // Set all leaves to LEAF_EMPTY
    for (let i = 0; i < maxLeaves; i++) {
      this.tree.set(`0-${i}`, LEAF_EMPTY);
    }
    
    console.log(`[SMT] Initialized empty tree with depth=${this.depth}, leaves=${maxLeaves}`);
  }

  // Mark identifier as banned (leaf = 1)
  public ban(identifier: string): void {
    const idx = this.deriveIndex(identifier);
    this.tree.set(`0-${idx}`, LEAF_BANNED);
    console.log(`[SMT] Banned: "${identifier}" -> index ${idx}`);
  }

  // Derive deterministic index from identifier
  private deriveIndex(identifier: string): number {
    // Hash identifier and take bottom 32 bits as index
    const hash = poseidon2([BigInt(Buffer.from(identifier).toString("hex").slice(0, 62), 16)]);
    const idx = Number(hash & BigInt((1 << this.depth) - 1));
    return idx;
  }

  // Compute Merkle root by hashing from leaves up
  public computeRoot(): bigint {
    const maxLeaves = 2 ** this.depth;
    
    // Build tree level by level from leaves to root
    for (let level = 0; level < this.depth; level++) {
      const nodesAtLevel = maxLeaves / (2 ** level);
      const nodesAtNextLevel = nodesAtLevel / 2;
      
      for (let i = 0; i < nodesAtNextLevel; i++) {
        const leftIdx = i * 2;
        const rightIdx = i * 2 + 1;
        
        const left = this.tree.get(`${level}-${leftIdx}`) ?? LEAF_EMPTY;
        const right = this.tree.get(`${level}-${rightIdx}`) ?? LEAF_EMPTY;
        
        // Hash pair using Poseidon (MUST match Noir circuit)
        const parent = poseidon2([left, right]);
        this.tree.set(`${level + 1}-${i}`, parent);
      }
    }
    
    const root = this.tree.get(`${this.depth}-0`) ?? BigInt(0);
    console.log(`[SMT] Computed root: ${root.toString()}`);
    return root;
  }

  // Generate witness for a given identifier
  public generateWitness(identifier: string): MerkleWitness {
    const idx = this.deriveIndex(identifier);
    const leaf = this.tree.get(`0-${idx}`) ?? LEAF_EMPTY;
    
    const siblings: bigint[] = [];
    const directions: bigint[] = [];
    
    let currentIdx = idx;
    
    // Collect siblings from leaf to root
    for (let level = 0; level < this.depth; level++) {
      const isLeftChild = currentIdx % 2 === 0;
      const siblingIdx = isLeftChild ? currentIdx + 1 : currentIdx - 1;
      
      const sibling = this.tree.get(`${level}-${siblingIdx}`) ?? LEAF_EMPTY;
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

  // Export tree data
  public export(): TreeData {
    const bannedIndices: number[] = [];
    const maxLeaves = 2 ** this.depth;
    
    for (let i = 0; i < maxLeaves; i++) {
      const leaf = this.tree.get(`0-${i}`);
      if (leaf === LEAF_BANNED) {
        bannedIndices.push(i);
      }
    }
    
    const root = this.computeRoot();
    
    return {
      root: root.toString(),
      depth: this.depth,
      bannedIndices
    };
  }
}
