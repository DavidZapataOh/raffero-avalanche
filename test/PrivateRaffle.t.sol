// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Poseidon2} from "@poseidon/src/Poseidon2.sol";
import "../src/Raffle.sol";

/**
 * @title PrivateRaffleTest
 * @notice Integration tests using real Poseidon2 (poseidon2-evm),
 *         real HonkVerifiers, and real ZK proofs generated from Noir circuits.
 *         No mocks anywhere.
 */
contract PrivateRaffleTest is Test {
    PrivateRaffle public raffle;
    Poseidon2 public poseidon;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");

    // Loaded from fixture
    uint256 RAFFLE_ID;
    uint256 TICKET_PRICE;
    uint256 TREE_DEPTH;
    address RECIPIENT;
    uint256 WINNER_INDEX;
    uint256[] commitmentValues;
    bytes32 commitmentRoot; // root of raw commitment tree (for simple path)
    bytes claimProof;
    bytes32[] claimPublicInputs;

    function setUp() public {
        string memory json = vm.readFile("test/fixtures/claim-test-data.json");

        TREE_DEPTH = vm.parseJsonUint(json, ".treeDepth");
        RAFFLE_ID = vm.parseJsonUint(json, ".raffleId");
        TICKET_PRICE = vm.parseJsonUint(json, ".ticketPrice");
        RECIPIENT = address(uint160(vm.parseJsonUint(json, ".recipient")));
        WINNER_INDEX = vm.parseJsonUint(json, ".winnerIndex");
        commitmentRoot = bytes32(vm.parseJsonUint(json, ".commitmentRoot"));

        // Deploy real Poseidon2
        poseidon = new Poseidon2();

        // Deploy REAL verifiers
        address claimVerifier = deployCode("verifiers/RaffleVerifier.sol:HonkVerifier");
        address shuffleVerifier = deployCode("verifiers/ShuffleVerifier.sol:HonkVerifier");

        // Deploy PrivateRaffle with real contracts
        raffle = new PrivateRaffle(address(poseidon), claimVerifier, shuffleVerifier);

        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(carol, 10 ether);

        // Load commitments
        bytes memory commitmentsRaw = vm.parseJson(json, ".commitments");
        commitmentValues = abi.decode(commitmentsRaw, (uint256[]));

        // Load proof and public inputs
        claimProof = vm.parseJsonBytes(json, ".proof");
        bytes memory piRaw = vm.parseJson(json, ".publicInputs");
        claimPublicInputs = abi.decode(piRaw, (bytes32[]));
    }

    // ── Helpers ────────────────────────────────────────────────────────

    function _create() internal {
        raffle.createRaffle(RAFFLE_ID, TICKET_PRICE, TREE_DEPTH);
    }

    function _depositAll() internal {
        address[3] memory users = [alice, bob, carol];
        for (uint i = 0; i < commitmentValues.length; i++) {
            vm.prank(users[i]);
            raffle.depositTicket{value: TICKET_PRICE}(RAFFLE_ID, commitmentValues[i]);
        }
    }

    // ── Tests ──────────────────────────────────────────────────────────

    function test_CreateRaffle() public {
        _create();
        (uint256 levels, uint256 price, uint256 maxSize, uint256 nextIdx,, bool open,,,) = raffle.getRaffleCore(RAFFLE_ID);
        assertEq(levels, TREE_DEPTH);
        assertEq(price, TICKET_PRICE);
        assertEq(maxSize, 1 << TREE_DEPTH);
        assertEq(nextIdx, 0);
        assertTrue(open);
    }

    function test_DepositTicket() public {
        _create();
        bytes32 rootBefore = raffle.getRoot(RAFFLE_ID);
        vm.prank(alice);
        raffle.depositTicket{value: TICKET_PRICE}(RAFFLE_ID, commitmentValues[0]);
        assertEq(raffle.commitments(RAFFLE_ID, 0), commitmentValues[0]);
        assertTrue(raffle.getRoot(RAFFLE_ID) != rootBefore);
        assertEq(address(raffle).balance, TICKET_PRICE);
    }

    function test_DepositTicket_WrongPrice_Reverts() public {
        _create();
        vm.prank(alice);
        vm.expectRevert("BAD_PRICE");
        raffle.depositTicket{value: 0.05 ether}(RAFFLE_ID, commitmentValues[0]);
    }

    function test_DepositTicket_Closed_Reverts() public {
        _create();
        vm.prank(alice);
        raffle.depositTicket{value: TICKET_PRICE}(RAFFLE_ID, commitmentValues[0]);
        raffle.closeAndFinalizeSimple(RAFFLE_ID, 1, commitmentRoot);
        vm.prank(bob);
        vm.expectRevert("CLOSED");
        raffle.depositTicket{value: TICKET_PRICE}(RAFFLE_ID, commitmentValues[1]);
    }

    function test_CloseAndFinalizeSimple() public {
        _create();
        _depositAll();
        raffle.closeAndFinalizeSimple(RAFFLE_ID, 7777, commitmentRoot);
        (,,,,, bool open,,,) = raffle.getRaffleCore(RAFFLE_ID);
        (,,,, bool finalized) = raffle.getRaffleExtra(RAFFLE_ID);
        assertFalse(open);
        assertTrue(finalized);
    }

    function test_CloseAndFinalizeSimple_SetsWinner() public {
        _create();
        _depositAll();
        raffle.closeAndFinalizeSimple(RAFFLE_ID, 100, commitmentRoot);
        (,,, uint256 nextIdx,,,,uint256 winnerIdx,) = raffle.getRaffleCore(RAFFLE_ID);
        assertEq(winnerIdx, 100 % nextIdx);
        assertEq(winnerIdx, 1);
    }

    function test_EntryHashRoot_MatchesFixture() public {
        _create();
        _depositAll();
        // On-chain root is the entry_hash root (not commitment root)
        bytes32 onChainRoot = raffle.getRoot(RAFFLE_ID);
        uint256 expectedEntryHashRoot = vm.parseJsonUint(
            vm.readFile("test/fixtures/claim-test-data.json"), ".entryHashRoot"
        );
        assertEq(uint256(onChainRoot), expectedEntryHashRoot, "On-chain entry-hash root must match FFI");
    }

    function test_ClaimPrize_RealProof() public {
        _create();
        _depositAll();

        uint256 vrf = WINNER_INDEX + 3 * 1000;
        raffle.closeAndFinalizeSimple(RAFFLE_ID, vrf, commitmentRoot);

        (,,,,, bool open, bool winnerSet, uint256 winnerIdx, uint256 pool) = raffle.getRaffleCore(RAFFLE_ID);
        assertFalse(open);
        assertTrue(winnerSet);
        assertEq(winnerIdx, WINNER_INDEX);
        assertEq(pool, 3 * TICKET_PRICE);

        // finalRoot should be the commitment root we passed
        (,, bytes32 finalRoot,,) = raffle.getRaffleExtra(RAFFLE_ID);
        assertEq(finalRoot, commitmentRoot, "Final root must be commitment root");

        uint256 balanceBefore = RECIPIENT.balance;
        raffle.claimPrize(claimProof, claimPublicInputs, RECIPIENT);

        assertEq(RECIPIENT.balance, balanceBefore + pool, "Recipient should receive prize pool");

        (,,,,,,,, uint256 poolAfter) = raffle.getRaffleCore(RAFFLE_ID);
        assertEq(poolAfter, 0);
    }

    function test_ClaimPrize_DoubleClaim_Reverts() public {
        _create();
        _depositAll();
        uint256 vrf = WINNER_INDEX + 3 * 1000;
        raffle.closeAndFinalizeSimple(RAFFLE_ID, vrf, commitmentRoot);

        raffle.claimPrize(claimProof, claimPublicInputs, RECIPIENT);

        vm.expectRevert("ALREADY_CLAIMED");
        raffle.claimPrize(claimProof, claimPublicInputs, RECIPIENT);
    }

    function test_ClaimPrize_WrongRecipient_Reverts() public {
        _create();
        _depositAll();
        uint256 vrf = WINNER_INDEX + 3 * 1000;
        raffle.closeAndFinalizeSimple(RAFFLE_ID, vrf, commitmentRoot);

        vm.expectRevert("RECIPIENT_NOT_BOUND");
        raffle.claimPrize(claimProof, claimPublicInputs, address(0xDEAD));
    }

    function test_CommitShuffleSecret() public {
        _create();
        _depositAll();
        raffle.closeRaffle(RAFFLE_ID, 42);
        bytes32 h = keccak256("secret");
        raffle.commitShuffleSecret(RAFFLE_ID, h);
        (bytes32 stored,,,,) = raffle.getRaffleExtra(RAFFLE_ID);
        assertEq(stored, h);
    }

    function test_CommitShuffleSecret_AlreadyCommitted_Reverts() public {
        _create();
        _depositAll();
        raffle.closeRaffle(RAFFLE_ID, 42);
        bytes32 h = keccak256("secret");
        raffle.commitShuffleSecret(RAFFLE_ID, h);
        vm.expectRevert("SECRET_ALREADY_COMMITTED");
        raffle.commitShuffleSecret(RAFFLE_ID, h);
    }

    function test_CloseRaffle() public {
        _create();
        _depositAll();
        raffle.closeRaffle(RAFFLE_ID, 999);
        (,,,,, bool open,,,) = raffle.getRaffleCore(RAFFLE_ID);
        (, uint256 vrf,,,) = raffle.getRaffleExtra(RAFFLE_ID);
        assertFalse(open);
        assertEq(vrf, 999);
    }

    function test_MultipleDeposits() public {
        _create();
        bytes32 r0 = raffle.getRoot(RAFFLE_ID);
        vm.prank(alice);
        raffle.depositTicket{value: TICKET_PRICE}(RAFFLE_ID, commitmentValues[0]);
        bytes32 r1 = raffle.getRoot(RAFFLE_ID);
        assertTrue(r1 != r0);
        vm.prank(bob);
        raffle.depositTicket{value: TICKET_PRICE}(RAFFLE_ID, commitmentValues[1]);
        bytes32 r2 = raffle.getRoot(RAFFLE_ID);
        assertTrue(r2 != r1);
        vm.prank(carol);
        raffle.depositTicket{value: TICKET_PRICE}(RAFFLE_ID, commitmentValues[2]);
        bytes32 r3 = raffle.getRoot(RAFFLE_ID);
        assertTrue(r3 != r2);
        assertEq(address(raffle).balance, 3 * TICKET_PRICE);
    }
}
