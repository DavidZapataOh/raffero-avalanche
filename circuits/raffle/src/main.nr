use poseidon::poseidon2::Poseidon2;

// Maximum Merkle tree depth (supports up to 2^32 = 4,294,967,296 participants)
global MAX_DEPTH: u32 = 32;

// ============================================================================
// DOMAIN SEPARATION TAGS
// Must match the tags used in the finalize circuit and the Solidity contract.
// Prevents cross-protocol hash collisions when the same Poseidon2 parameters
// are reused across different hash operations.
// ============================================================================

global DOMAIN_COMMIT: Field = 0x434f4d4d49545f5631;    // "COMMIT_V1"
global DOMAIN_NULL: Field = 0x4e554c4c5f5631;          // "NULL_V1"
global DOMAIN_BIND: Field = 0x42494e445f5631;          // "BIND_V1"

// ============================================================================
// HASH FUNCTIONS
// ============================================================================

// Generic Poseidon2 hash of two Field elements (used for Merkle tree nodes)
fn hash2(a: Field, b: Field) -> Field {
    Poseidon2::hash([a, b], 2)
}

// Domain-separated commitment: H(DOMAIN_COMMIT, secret, nullifier)
fn commit_hash(secret: Field, nullifier: Field) -> Field {
    Poseidon2::hash([DOMAIN_COMMIT, secret, nullifier], 3)
}

// Domain-separated nullifier hash: H(DOMAIN_NULL, nullifier, raffle_id)
fn null_hash(nullifier: Field, raffle_id: Field) -> Field {
    Poseidon2::hash([DOMAIN_NULL, nullifier, raffle_id], 3)
}

// Domain-separated recipient binding: H(DOMAIN_BIND, nullifier_hash, recipient)
fn bind_hash(nullifier_hash: Field, recipient: Field) -> Field {
    Poseidon2::hash([DOMAIN_BIND, nullifier_hash, recipient], 3)
}

fn main(
    // PRIVATE INPUTS
    secret: Field,
    nullifier: Field,
    siblings: [Field; MAX_DEPTH],
    path_indices: [Field; MAX_DEPTH],  // 0 or 1 for each level
    recipient: Field,

    // PUBLIC INPUTS
    root: pub Field,
    nullifier_hash: pub Field,
    recipient_binding: pub Field,
    raffle_id: pub Field,
    winner_index: pub Field,
    tree_depth: pub Field
) {
    // Convert tree_depth to u32 for comparisons
    let depth = tree_depth as u32;
    assert(depth <= MAX_DEPTH);
    assert(depth > 0);

    // commitment = H(DOMAIN_COMMIT, secret, nullifier)
    let commitment = commit_hash(secret, nullifier);

    // nullifier_hash = H(DOMAIN_NULL, nullifier, raffle_id)
    // Binding to raffle_id prevents cross-raffle replay attacks
    let computed_nullifier_hash = null_hash(nullifier, raffle_id);
    assert(computed_nullifier_hash == nullifier_hash);

    // recipient_binding = H(DOMAIN_BIND, nullifier_hash, recipient)
    // Binds the proof to a specific recipient, preventing front-running
    let computed_recipient_binding = bind_hash(nullifier_hash, recipient);
    assert(computed_recipient_binding == recipient_binding);

    // Reconstruct the winner index from path bits
    let mut reconstructed_index: Field = 0;
    let mut power_of_two: Field = 1;
    for i in 0..MAX_DEPTH {
        if i < depth {
            let bit = path_indices[i];
            // Ensure bit is 0 or 1
            assert(bit * (bit - 1) == 0);
            reconstructed_index = reconstructed_index + bit * power_of_two;
            power_of_two = power_of_two * 2;
        }
    }
    assert(reconstructed_index == winner_index);

    // Verify Merkle proof: commitment must be at winner_index in the final tree
    let mut current_hash = commitment;
    for i in 0..MAX_DEPTH {
        if i < depth {
            let sibling = siblings[i];
            let is_right = path_indices[i];

            let left = if is_right == 0 { current_hash } else { sibling };
            let right = if is_right == 0 { sibling } else { current_hash };

            current_hash = hash2(left, right);
        }
    }
    assert(current_hash == root);

    assert(raffle_id != 0);
}

// ============================================================================
// TESTS
// ============================================================================

#[test]
fn test_hash2() {
    let h = hash2(1, 2);
    assert(h != 0);
}

#[test]
fn test_domain_separation_produces_different_hashes() {
    let a: Field = 123;
    let b: Field = 456;

    let plain = hash2(a, b);
    let with_commit_domain = commit_hash(a, b);
    let with_null_domain = null_hash(a, b);

    assert(plain != with_commit_domain, "Domain separation must differ from plain hash");
    assert(plain != with_null_domain, "Domain separation must differ from plain hash");
    assert(with_commit_domain != with_null_domain, "Different domains must produce different hashes");
}

#[test]
fn test_simple_merkle_proof() {
    let secret: Field = 123;
    let nullifier: Field = 456;
    let commitment = commit_hash(secret, nullifier);

    let leaf1 = commit_hash(789, 101112);

    let computed_root = hash2(commitment, leaf1);

    let mut siblings: [Field; MAX_DEPTH] = [0; MAX_DEPTH];
    siblings[0] = leaf1;

    let path_indices: [Field; MAX_DEPTH] = [0; MAX_DEPTH];

    let mut current = commitment;
    let sibling = siblings[0];
    let is_right = path_indices[0];
    let left = if is_right == 0 { current } else { sibling };
    let right = if is_right == 0 { sibling } else { current };
    current = hash2(left, right);

    assert(current == computed_root);
}

#[test]
fn test_nullifier_hash_binds_to_raffle_id() {
    let nullifier: Field = 42;
    let raffle_1: Field = 1;
    let raffle_2: Field = 2;

    let h1 = null_hash(nullifier, raffle_1);
    let h2 = null_hash(nullifier, raffle_2);

    assert(h1 != h2, "Nullifier hash must differ across raffles");
}
