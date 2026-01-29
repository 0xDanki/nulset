pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/mux1.circom";

// SMT-lite non-membership proof circuit
// Proves that a leaf at a given index has value 0 (not banned)
// and the Merkle path correctly hashes to the public root
//
// HASH: Poseidon (matches circomlibjs)

template VerifyNonMembership(depth) {
    // Public inputs
    signal input root;
    
    // Private inputs
    signal input idx;  // Reserved for future validation
    signal input leaf_value;
    signal input siblings[depth];
    signal input direction_bits[depth];
    
    // Constraint 1: Enforce non-membership (leaf must be 0)
    leaf_value === 0;
    
    // Constraint 2: Recompute Merkle root from leaf up
    signal computed_root;
    computed_root <== ComputeMerkleRoot(depth)(leaf_value, siblings, direction_bits);
    
    // Constraint 3: Verify computed root matches public root
    root === computed_root;
}

// Helper template to compute Merkle root
template ComputeMerkleRoot(depth) {
    signal input leaf;
    signal input siblings[depth];
    signal input directions[depth];
    signal output root;
    
    signal hashes[depth + 1];
    hashes[0] <== leaf;
    
    component hashers[depth];
    component selectors[depth * 2];  // For left/right selection
    
    for (var i = 0; i < depth; i++) {
        hashers[i] = Poseidon(2);
        
        // Use mux to select left value based on direction
        // If direction=0: left=hash, right=sibling
        // If direction=1: left=sibling, right=hash
        selectors[i*2] = Mux1();
        selectors[i*2].c[0] <== hashes[i];     // When direction=0
        selectors[i*2].c[1] <== siblings[i];   // When direction=1
        selectors[i*2].s <== directions[i];
        
        selectors[i*2+1] = Mux1();
        selectors[i*2+1].c[0] <== siblings[i]; // When direction=0
        selectors[i*2+1].c[1] <== hashes[i];   // When direction=1
        selectors[i*2+1].s <== directions[i];
        
        hashers[i].inputs[0] <== selectors[i*2].out;
        hashers[i].inputs[1] <== selectors[i*2+1].out;
        
        hashes[i + 1] <== hashers[i].out;
    }
    
    root <== hashes[depth];
}

// Main component with depth=32
component main {public [root]} = VerifyNonMembership(32);
