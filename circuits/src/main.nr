use dep::poseidon::poseidon::bn254::hash_2;

// SMT-lite non-membership proof circuit
// Proves that a leaf at a given index has value 0 (not banned)
// and the Merkle path correctly hashes to the public root
//
// HASH: Poseidon (BN254) - chosen for JS/TS compatibility

fn main(
    // Public inputs
    root: pub Field,
    
    // Private inputs
    _idx: Field,  // Reserved for future idx validation
    leaf_value: Field,
    siblings: [Field; 32],
    direction_bits: [Field; 32]
) {
    // Constraint 1: Enforce non-membership (leaf must be 0)
    assert(leaf_value == 0, "Leaf value must be 0 for non-membership");
    
    // Constraint 2: Recompute Merkle root from leaf up
    let computed_root = compute_merkle_root(leaf_value, siblings, direction_bits);
    
    // Constraint 3: Verify computed root matches public root
    assert(computed_root == root, "Computed root does not match public root");
}

// Compute Merkle root by hashing from leaf up the tree
fn compute_merkle_root(
    leaf: Field,
    siblings: [Field; 32],
    directions: [Field; 32]
) -> Field {
    let mut current = leaf;
    
    for i in 0..32 {
        let sibling = siblings[i];
        let direction = directions[i];
        
        // direction = 0 means current is left child (hash current || sibling)
        // direction = 1 means current is right child (hash sibling || current)
        
        // Use conditional logic to determine hash order
        // If direction == 0: hash([current, sibling])
        // If direction == 1: hash([sibling, current])
        let left = if direction == 0 { current } else { sibling };
        let right = if direction == 0 { sibling } else { current };
        
        // Hash the pair using Poseidon (BN254, matches @zk-kit/poseidon in TS)
        current = hash_2([left, right]);
    }
    
    current
}

// TODO: When ready for production, consider:
// - Add idx validation (verify idx is correctly derived from identifier)
// - Add overflow checks if needed
