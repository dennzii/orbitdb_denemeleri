// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; // Imports the ReentrancyGuard contract from OpenZeppelin's contracts library. This is used to prevent reentrancy attacks in smart contracts.

struct Cargo { // Defines a new struct for Cargo with various attributes.
    uint256 cargoID; // Unique identifier for the cargo.
    address sender; // Address of the sender (company creating the cargo).
    address receiver; // Address of the receiver (final destination of the cargo).
    AccountTypes current; // Current role handling the cargo.
    CargoStatus status; // Current status of the cargo.
}

enum CargoStatus { // Enumeration defining possible statuses of cargo.
    Created, // Cargo has been created but not yet taken by a courier.
    Taken, // Cargo has been taken by a courier.
    Shipped, // Cargo is in transit (not used in this contract, but defined for future use).
    Delivered // Cargo has been delivered to the receiver.
}

enum AccountTypes { // Enumeration defining possible account types.
    Undefined, // Account is not registered or specified.
    Sender, // Account is a sender (company that creates cargos).
    Courier, // Account is a courier (company that transfers cargos).
    Receiver // Account is a receiver (final destination of the cargo).
}

contract SupplyChainManagement is ReentrancyGuard { // Starts the definition of the main contract.
    uint256 private _cargoCount; // Private variable to keep track of the number of cargos.
    address private _owner; // Private variable storing the address of the contract owner.

    mapping(uint256 => Cargo) public _IDtoCargo; // Mapping from cargo ID to Cargo struct.
    mapping(address => AccountTypes) public _registeredAccounts; // Mapping from account address to AccountTypes.

    constructor(address initialOwner) { // Constructor to initialize contract with the owner's address.
        _owner = initialOwner; // Sets the owner of the contract.
        _cargoCount = 1; // Initializes cargo count starting from 1.
    }

    modifier isAccountRegistered() { // Modifier to check if an account is registered.
        require(_registeredAccounts[msg.sender] != AccountTypes.Undefined, "Account is not registered.");
        _; // Continues execution if the condition is met.
    }

    modifier isSender() { // Modifier to check if the message sender is a registered sender.
        require(_registeredAccounts[msg.sender] == AccountTypes.Sender, "Not a sender account.");
        _; // Continues execution if the condition is met.
    }

    modifier isReceiver(uint256 cargoID) { // Modifier to check if the message sender is the receiver of the cargo.
        require(_IDtoCargo[cargoID].receiver == msg.sender, "You are not allowed to accept this cargo.");
        _; // Continues execution if the condition is met.
    }

    modifier isCourier() { // Modifier to check if the message sender is a registered courier.
        require(_registeredAccounts[msg.sender] == AccountTypes.Courier, "Not a courier account.");
        _; // Continues execution if the condition is met.
    }

    modifier onlyOwner() { // Modifier to check if the message sender is the owner of the contract.
        require(msg.sender == _owner, "It's an owner-only function.");
        _; // Continues execution if the condition is met.
    }

    function createCargo(address receiver) external isAccountRegistered isSender nonReentrant { // Function to create a new cargo.
        Cargo memory newCargo; // Creates a new temporary Cargo struct.
        newCargo.cargoID = _cargoCount; // Assigns the next cargo ID.
        newCargo.sender = msg.sender; // Sets the sender to the message sender.
        newCargo.receiver = receiver; // Sets the receiver to the provided address.
        newCargo.current = AccountTypes.Sender; // Sets the current handler to Sender.
        newCargo.status = CargoStatus.Created; // Sets the cargo status to Created.

        _IDtoCargo[_cargoCount] = newCargo; // Maps the new cargo to its ID in the mapping.
        _cargoCount += 1; // Increments the cargo count for the next cargo.
    }

    function takeOver(uint256 id) external isAccountRegistered isCourier nonReentrant { // Function for a courier to take over a cargo.
        require(_IDtoCargo[id].status == CargoStatus.Created, "Cargo not in correct state for takeover."); // Checks if the cargo is in the Created state.
        _IDtoCargo[id].current = AccountTypes.Courier; // Updates the current handler to Courier.
        _IDtoCargo[id].status = CargoStatus.Taken; // Updates the cargo status to Taken.
    }

    function receiveCargo(uint256 id) external isAccountRegistered isReceiver(id) nonReentrant { // Function for a receiver to acknowledge receipt of a cargo.
        require(_IDtoCargo[id].status == CargoStatus.Taken, "Cargo not in correct state for receiving."); // Checks if the cargo is in the Taken state.
        _IDtoCargo[id].current = AccountTypes.Receiver; // Updates the current handler to Receiver.
        _IDtoCargo[id].status = CargoStatus.Delivered; // Updates the cargo status to Delivered.
    }

    function registerAddress(address addr, AccountTypes accountType) external onlyOwner nonReentrant { // Function for the owner to register an address with a specific account type.
        _registeredAccounts[addr] = accountType; // Maps the address to the specified account type in the mapping.
    }

    function getCargoDetails(uint256 id) external view returns (Cargo memory) { // Function to get details of a specific cargo.
        return _IDtoCargo[id]; // Returns the Cargo struct associated with the given ID.
    }

    function getRegisteredAccountDetails(address _addr) external view returns (AccountTypes) { // Function to get AccountType detail of a specific address.
        return _registeredAccounts[_addr]; // Returns the AccountType of a specific address.
    }
}