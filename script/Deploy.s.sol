// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Poseidon2} from "@poseidon/src/Poseidon2.sol";
import "../src/Raffle.sol";

contract DeployRaffero is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Poseidon2 hash contract
        Poseidon2 poseidon = new Poseidon2();
        console.log("Poseidon2:        ", address(poseidon));

        // 2. Deploy HonkVerifiers from compiled artifacts
        address claimVerifier = deployCode("verifiers/RaffleVerifier.sol:HonkVerifier");
        console.log("ClaimVerifier:    ", claimVerifier);

        address shuffleVerifier = deployCode("verifiers/ShuffleVerifier.sol:HonkVerifier");
        console.log("ShuffleVerifier:  ", shuffleVerifier);

        // 3. Deploy PrivateRaffle
        PrivateRaffle raffle = new PrivateRaffle(
            address(poseidon),
            claimVerifier,
            shuffleVerifier
        );
        console.log("PrivateRaffle:    ", address(raffle));

        vm.stopBroadcast();
    }
}
