use poseidon::poseidon2::Poseidon2;

// ============================================================================
// CONSTANTS
// ============================================================================

global MAX_DEPTH: u32 = 32;
global CHUNK: u32 = 256;

// ============================================================================
// DOMAIN SEPARATION TAGS
// Prevents cross-protocol hash collisions when the same Poseidon2 parameters
// are reused. Each hash operation uses a unique domain tag as the first element.
// ============================================================================

global DOMAIN_ENTRY: Field = 0x454e5452595f5631;       // "ENTRY_V1"
global DOMAIN_SHUFFLE: Field = 0x53485546464c455f5631;  // "SHUFFLE_V1"
global DOMAIN_SECRET: Field = 0x5345435245545f5631;     // "SECRET_V1"
global DOMAIN_GP: Field = 0x47505f5631;                 // "GP_V1"

// ============================================================================
// HASH FUNCTIONS (with domain separation)
// ============================================================================

fn hash2(a: Field, b: Field) -> Field {
    Poseidon2::hash([a, b], 2)
}

fn hash3(a: Field, b: Field, c: Field) -> Field {
    Poseidon2::hash([a, b, c], 3)
}

fn entry_hash_fn(commitment: Field, alias: Field) -> Field {
    Poseidon2::hash([DOMAIN_ENTRY, commitment, alias], 3)
}

fn shuffle_seed_fn(vrf_output: Field, operator_secret: Field, raffle_id: Field) -> Field {
    Poseidon2::hash([DOMAIN_SHUFFLE, vrf_output, operator_secret, raffle_id], 4)
}

fn secret_hash_fn(operator_secret: Field) -> Field {
    Poseidon2::hash([DOMAIN_SECRET, operator_secret], 2)
}

// ============================================================================
// ZERO VALUES - Must match IncrementalMerkleTree.sol zeros(i) exactly
// ============================================================================

fn zero_at(level: u32) -> Field {
    if level == 0 { 0x1d028cb78671d570e29d04748982b4d86bf5d94d10b081fc71ab63f5f319a144 }
    else if level == 1 { 0x2702209a4ea80e6bbf9f8fe36da29f1eba9794e7a5afc6d4987502b867b2782c }
    else if level == 2 { 0x0eed089401030c227ffe8ee49faa3e98d1090a4c38b1ad94cb8487ae6bdf47d7 }
    else if level == 3 { 0x098fd15689f7dc1d33fcc9a135e90410b077240261134c7a56e2a3f7a71b98d8 }
    else if level == 4 { 0x1cde1166a86cf6ef94fe2992f5c67063f595939f87a93dffa2e2f0c505dfc791 }
    else if level == 5 { 0x205b0bff5586bfca62d3206f9731040cc0935a9b65c6ec7899ec2bc8da67ce12 }
    else if level == 6 { 0x2693cc868fbed3c2bdbc0af93fb61c1defda77da8ffab201af750b8e748ad4a0 }
    else if level == 7 { 0x2217e8304afcd5622719d233ab0de5fcae7bedd4b19cd40562beb18400338d9b }
    else if level == 8 { 0x28f8e6b1e3f075f3fdc6cb2cb2b2e9bbe5333477147b8ffabbd1d3bd5cd6f0c0 }
    else if level == 9 { 0x2b571502975f1b52653e2a90e75f835e7133211e903ee30c18eae39e5a54a003 }
    else if level == 10 { 0x01004fe703167ea084b15031ef1797eff6717655820e97b15c3f5f160adc58b3 }
    else if level == 11 { 0x2405d6072abfd248a61d72511906e089ea958d7685221b3f891f6442978588c7 }
    else if level == 12 { 0x159f221789c95106cdba76de370bd8d2acc3c45897b2aad72f6d8f1953b02cbb }
    else if level == 13 { 0x1d8b8943e98b3841b5d57a6407ebf93721d1a17de8fe9efa7cdaddea564531bb }
    else if level == 14 { 0x213c67f6dcdd9f86c76a7452bafd916440013eedb3f71aa2fc3d4619e9990aeb }
    else if level == 15 { 0x2fa3fae6226c32750351b998c397e37c7fb8f14d68cca124672d49b524744847 }
    else if level == 16 { 0x05ed3f2487e0cfe51e10e558ce98eefbaebf0eabe0ea6cdfaeba432d8c9a0ffc }
    else if level == 17 { 0x2d6226cc2cd15cbec071be3b2574e6e5d5570f72ddd4acf7b9399384cb140ee0 }
    else if level == 18 { 0x18e425282700d965c80c2386a4682da6d33628307641dc7d1d2901daa31fcc0d }
    else if level == 19 { 0x28239d63a8ee098ce6d497c7eb15d11ca423185d3b1a5be97392394d3d691ff7 }
    else if level == 20 { 0x1196568a4bed8c2f8eee0dbf9a62034940f8e567630b14ac917aa5fa0747ac7a }
    else if level == 21 { 0x251610436985b62321e7d0be2e7536359665518ba198fec7073c0ca198097852 }
    else if level == 22 { 0x24f0ad62d50feed3e2c59b59bb6c06863e4e578b0f7cd0eb68b6e085b1fa736d }
    else if level == 23 { 0x020cd2dc08d478c3e154d4358f984c1823117a14895b545b0d6a2fb72f638f7f }
    else if level == 24 { 0x125ee57756f6b850994a7117d95332c885b600dc1b3a6d8fc6b69221fcd5ebf9 }
    else if level == 25 { 0x29f9cb3e9f17085d7d43d5645429e4083d3ad7dec3192a970cc8ef9cf1d388aa }
    else if level == 26 { 0x21518a1b2046d7ee337397aafcfbd922e01d118b2f48b8da5d8d29da7791ec19 }
    else if level == 27 { 0x26769f5b643b8c03c05179c60c410d8f13a07a481a4295edafae5fe8e1807ff6 }
    else if level == 28 { 0x1118b9bbc49f482de8e3e792471f2816e964ac619606aaa556aade0e27986b80 }
    else if level == 29 { 0x208479db3047fb2d7d1891b07b27e6030671387a59fc1b6326bc62cf9c58941e }
    else if level == 30 { 0x1dc9cf833a0e2e3fe2e63a5356060d43497e4830a310413457c8daf9e56dbf75 }
    else if level == 31 { 0x22516451d073ee15525e5ca2796d69d13e76f627bce77c5244a5737c83c536f9 }
    else { 0x00a812174e08b158a441f6e823d92ee3a1c3fe2eccc0a15283e7f841a39da33b }
}

// ============================================================================
// MERKLE ROOT COMPUTATION
// Computes the root of a Merkle tree from an array of leaves.
// Leaves beyond index n are padded with zero_at(0).
// ============================================================================

fn compute_merkle_root(leaves: [Field; CHUNK], n: u32, depth: u32) -> Field {
    let mut layer: [Field; CHUNK] = [0; CHUNK];

    for i in 0..CHUNK {
        if (i as u32) < n {
            layer[i] = leaves[i];
        } else {
            layer[i] = zero_at(0);
        }
    }

    let mut width: u32 = CHUNK;
    for level in 0..MAX_DEPTH {
        if level < depth {
            let half = width / 2;
            for k in 0..(CHUNK / 2) {
                if (k as u32) < half {
                    let left_idx = k * 2;
                    let right_idx = left_idx + 1;
                    let left = layer[left_idx];
                    let right = if (right_idx as u32) < width { layer[right_idx] } else { zero_at(level) };
                    layer[k] = hash2(left, right);
                }
            }
            width = half;
        }
    }

    layer[0]
}

// ============================================================================
// FISHER-YATES SHUFFLE (deterministic, inside ZK circuit)
//
// Given a seed and n elements, produces a permutation by deriving
// pseudo-random swap indices from sequential hashes of the seed.
// The permutation is applied to pending_leaves to produce shuffled output.
// ============================================================================

fn fisher_yates_shuffle(
    input: [Field; CHUNK],
    n: u32,
    seed: Field
) -> [Field; CHUNK] {
    let mut arr: [Field; CHUNK] = input;

    // Fisher-Yates: iterate from n-1 down to 1, swapping element i with a random j in [0, i]
    for iter in 0..CHUNK {
        // We go from n-1 down to 1
        // iter=0 corresponds to i=n-1, iter=1 corresponds to i=n-2, etc.
        if (iter as u32) < (n - 1) {
            let i = n - 1 - (iter as u32);
            // Derive a pseudo-random index j in [0, i]
            let hash_val = Poseidon2::hash([seed, iter as Field], 2);

            // Convert hash to a bounded index: j = hash_val % (i + 1)
            // Cast to u64 for modulo since i+1 <= CHUNK (256)
            let hash_as_int = hash_val as u64;
            let modulus = (i + 1) as u64;
            let j_int = hash_as_int % modulus;
            let j = j_int as Field;

            // Swap arr[i] and arr[j]
            // Since Noir doesn't support dynamic indexing easily, we do a conditional copy
            let val_i = arr[i];
            let mut val_j: Field = 0;
            for k in 0..CHUNK {
                if (k as Field) == j {
                    val_j = arr[k];
                }
            }

            // Write val_j to position i
            arr[i] = val_j;

            // Write val_i to position j
            for k in 0..CHUNK {
                if (k as Field) == j {
                    arr[k] = val_i;
                }
            }
        }
    }

    arr
}

// ============================================================================
// GRAND PRODUCT FOR MULTISET EQUALITY (Fiat-Shamir)
//
// Given two lists A and B, proves they are equal as multisets by checking:
//   prod(challenge - A[i]) == prod(challenge - B[i])
// The challenge is derived from public inputs via Fiat-Shamir.
// ============================================================================

fn grand_product(values: [Field; CHUNK], n: u32, challenge: Field) -> Field {
    let mut acc: Field = 1;
    for i in 0..CHUNK {
        if (i as u32) < n {
            acc = acc * (challenge - values[i]);
        }
    }
    acc
}

// ============================================================================
// MAIN: VERIFIABLE HASH-BASED SHUFFLE
//
// Architecture: VRF Seed + Operator Secret
// - VRF output provides fairness (unbiasable randomness)
// - Operator secret provides privacy (permutation unknowable to external observers)
// - The shuffle is deterministic inside the circuit from the combined seed
//
// This circuit proves:
// 1. Pending leaves form the correct pending_root
// 2. Operator secret matches the committed hash
// 3. The shuffle was performed correctly using Fisher-Yates from the combined seed
// 4. Each shuffled entry_hash decomposes into (commitment, alias) correctly
// 5. Shuffled commitments and aliases form the correct final/alias roots
// 6. Multiset equality between pending leaves and recomputed entry hashes
// ============================================================================

fn main(
    // PRIVATE INPUTS
    pending_leaves: [Field; CHUNK],          // entry_hashes from the pending tree
    final_commitments: [Field; CHUNK],       // commitments in shuffled order
    final_aliases: [Field; CHUNK],           // aliases in shuffled order
    operator_secret: Field,                  // operator's secret (for privacy)

    // PUBLIC INPUTS
    pending_root: pub Field,                 // Merkle root of pending entry_hashes
    final_root: pub Field,                   // Merkle root of shuffled commitments
    alias_root: pub Field,                   // Merkle root of shuffled aliases
    raffle_id: pub Field,
    n_participants: pub Field,
    tree_depth: pub Field,
    operator_secret_hash: pub Field,         // H(operator_secret) committed on-chain
    vrf_output: pub Field                    // VRF randomness output
) {
    // ========================================
    // VALIDATION
    // ========================================
    let depth = tree_depth as u32;
    let n = n_participants as u32;

    assert(depth > 0, "Depth must be positive");
    assert(depth <= MAX_DEPTH, "Depth exceeds maximum");
    assert(n > 0, "Must have participants");
    assert(n <= CHUNK, "Participants exceed chunk size");
    assert(raffle_id != 0, "Invalid raffle ID");

    // ========================================
    // 1. VERIFY PENDING ROOT
    // ========================================
    let computed_pending_root = compute_merkle_root(pending_leaves, n, depth);
    assert(computed_pending_root == pending_root, "Pending root mismatch");

    // ========================================
    // 2. VERIFY OPERATOR SECRET
    // The operator committed H(secret) on-chain before VRF revealed.
    // This prevents grinding: operator can't choose secret after seeing VRF.
    // ========================================
    let computed_secret_hash = secret_hash_fn(operator_secret);
    assert(computed_secret_hash == operator_secret_hash, "Operator secret hash mismatch");

    // ========================================
    // 3. COMPUTE SHUFFLE SEED & EXECUTE FISHER-YATES
    // seed = H(DOMAIN_SHUFFLE, vrf_output, operator_secret, raffle_id)
    // This seed is unknowable to external observers (they don't know operator_secret)
    // and unbiasable by the operator (they don't control vrf_output).
    // ========================================
    let seed = shuffle_seed_fn(vrf_output, operator_secret, raffle_id);
    let shuffled_leaves = fisher_yates_shuffle(pending_leaves, n, seed);

    // ========================================
    // 4. VERIFY ENTRY HASH DECOMPOSITION
    // Each shuffled entry_hash must equal H(DOMAIN_ENTRY, commitment, alias)
    // This is the critical soundness link: it binds the shuffle output
    // to the claimed (commitment, alias) pairs.
    // ========================================
    let mut recomputed_entry_hashes: [Field; CHUNK] = [zero_at(0); CHUNK];
    for i in 0..CHUNK {
        if (i as u32) < n {
            let computed_eh = entry_hash_fn(final_commitments[i], final_aliases[i]);
            recomputed_entry_hashes[i] = computed_eh;
            assert(shuffled_leaves[i] == computed_eh, "Entry hash decomposition mismatch");
        }
    }

    // ========================================
    // 5. MULTISET EQUALITY CHECK (defense in depth)
    // Even though the Fisher-Yates shuffle is deterministic and we verified
    // each position, this grand product check provides an independent
    // verification that the multiset of pending leaves equals the multiset
    // of recomputed entry hashes.
    // ========================================
    let gp_challenge = Poseidon2::hash(
        [DOMAIN_GP, pending_root, final_root, alias_root, raffle_id, n_participants, tree_depth, vrf_output],
        8
    );

    let prod_pending = grand_product(pending_leaves, n, gp_challenge);
    let prod_final = grand_product(recomputed_entry_hashes, n, gp_challenge);
    assert(prod_pending == prod_final, "Multiset equality check failed");

    // ========================================
    // 6. VERIFY FINAL COMMITMENT ROOT
    // ========================================
    let computed_final_root = compute_merkle_root(final_commitments, n, depth);
    assert(computed_final_root == final_root, "Final root mismatch");

    // ========================================
    // 7. VERIFY ALIAS ROOT
    // ========================================
    let computed_alias_root = compute_merkle_root(final_aliases, n, depth);
    assert(computed_alias_root == alias_root, "Alias root mismatch");
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
fn test_zero_at_level_0() {
    let z = zero_at(0);
    assert(z == 0x1d028cb78671d570e29d04748982b4d86bf5d94d10b081fc71ab63f5f319a144);
}

#[test]
fn test_entry_hash_domain_separation() {
    // entry_hash with domain tag should differ from plain hash2
    let commit: Field = 123;
    let alias: Field = 456;

    let with_domain = entry_hash_fn(commit, alias);
    let without_domain = hash2(commit, alias);

    assert(with_domain != without_domain, "Domain separation must produce different hashes");
}

#[test]
fn test_secret_hash() {
    let secret: Field = 42;
    let h = secret_hash_fn(secret);
    assert(h != 0);

    // Same secret should produce same hash
    let h2 = secret_hash_fn(secret);
    assert(h == h2);
}

#[test]
fn test_shuffle_deterministic() {
    // Same seed should produce same shuffle
    let mut input: [Field; CHUNK] = [zero_at(0); CHUNK];
    input[0] = 100;
    input[1] = 200;
    input[2] = 300;
    input[3] = 400;

    let seed: Field = 999;

    let result1 = fisher_yates_shuffle(input, 4, seed);
    let result2 = fisher_yates_shuffle(input, 4, seed);

    for i in 0..4 {
        assert(result1[i] == result2[i], "Shuffle must be deterministic");
    }
}

#[test]
fn test_shuffle_is_permutation() {
    // After shuffle, the multiset of values should be preserved
    let mut input: [Field; CHUNK] = [zero_at(0); CHUNK];
    input[0] = 10;
    input[1] = 20;
    input[2] = 30;
    input[3] = 40;

    let seed: Field = 12345;
    let result = fisher_yates_shuffle(input, 4, seed);

    // Verify that the sum is preserved (necessary but not sufficient for permutation)
    let mut sum_input: Field = 0;
    let mut sum_output: Field = 0;
    for i in 0..4 {
        sum_input = sum_input + input[i];
        sum_output = sum_output + result[i];
    }
    assert(sum_input == sum_output, "Shuffle must preserve multiset");

    // Verify via grand product
    let challenge: Field = 9999;
    let mut prod_in: Field = 1;
    let mut prod_out: Field = 1;
    for i in 0..4 {
        prod_in = prod_in * (challenge - input[i]);
        prod_out = prod_out * (challenge - result[i]);
    }
    assert(prod_in == prod_out, "Grand product must match for permutation");
}

#[test]
fn test_merkle_root_single_leaf() {
    let mut leaves: [Field; CHUNK] = [zero_at(0); CHUNK];
    leaves[0] = hash2(123, 456);

    let root = compute_merkle_root(leaves, 1, 1);
    let expected = hash2(leaves[0], zero_at(0));
    assert(root == expected);
}
