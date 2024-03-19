// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; // Imports the ReentrancyGuard contract from OpenZeppelin's contracts library. This is used to prevent reentrancy attacks in smart contracts.

struct Cargo {
    // Defines a new struct for Cargo with various attributes.
    bytes32 cargoID; // Unique identifier for the cargo.
    address sender; // Address of the sender (company creating the cargo).
    address receiver; // Address of the receiver (final destination of the cargo).
    address current; // Current role handling the cargo.
    CargoStatus status; // Current status of the cargo.
}

enum CargoStatus {
    // Enumeration defining possible statuses of cargo.
    Created, // Cargo has been created but not yet taken by a courier.
    Taken, // Cargo has been taken by a courier.
    Shipped, // Cargo is in transit (not used in this contract, but defined for future use).
    Delivered // Cargo has been delivered to the receiver.
}

//Sender ve reciever acc type ayrı olmalı mı bilemedim. Çünkü Bir kargo alıcısı bir şey de göndermek isteyebilir onlar gönderen-alıcı şeklinde olmalı.
//Courier mantıklı.
enum AccountTypes {
    // Enumeration defining possible account types.
    Undefined, // Account is not registered or specified.
    Sender, // Account is a sender (company that creates cargos).
    Courier, // Account is a courier (company that transfers cargos).
    Receiver // Account is a receiver (final destination of the cargo).
}

contract SupplyChainManagement is ReentrancyGuard { // Starts the definition of the main contract.
    uint256 private _cargoCount; // Private variable to keep track of the number of cargos.
    address private _owner; // Private variable storing the address of the contract owner.

    //Bu değişkenler private ama kodun en altından get fonksiyonları yazıldı.
    mapping(bytes32 => Cargo) private _IDtoCargo; // Mapping from cargo ID to Cargo struct.
    mapping(address => AccountTypes) private _registeredAccounts; // Mapping from account address to AccountTypes.
    mapping(address => bytes32[]) private accToCargoIDs; //hangi adresin hangi kargolar ile ilişkili olduğunu öğreniyoruz.

    //Belirli bir kargonun belirli bir kurye tarafından QR'ının taratılıp taratılmadığını belirtir.
    mapping(bytes32 => mapping(address => bool)) qrScanned;

    function setQRScanned(
        bytes32 cargoID,
        address courierAddr
    ) public onlyOwner isCourier(courierAddr) isAccountRegistered(courierAddr) {
        qrScanned[cargoID][courierAddr] = true;
    }

    //Bu şekilde mobil uygulamada ilişkili olunan (gönderilen, alınan kargolar gösterilebilinir.

    constructor(address initialOwner) {
        // Constructor to initialize contract with the owner's address.
        _owner = initialOwner; // Sets the owner of the contract.
        _cargoCount = 1; // Initializes cargo count starting from 1.
    }

    modifier isAccountRegistered(address addr) {
        // Modifier to check if an account is registered.
        require(
            _registeredAccounts[addr] != AccountTypes.Undefined,
            "Account is not registered."
        );
        _; // Continues execution if the condition is met.
    }

    modifier isSender(address addr) {
        // Modifier to check if the message sender is a registered sender.
        require(
            _registeredAccounts[addr] == AccountTypes.Sender,
            "Not a sender account."
        );
        _; // Continues execution if the condition is met.
    }

    modifier isReceiver(bytes32 cargoID) {
        // Modifier to check if the message sender is the receiver of the cargo.
        require(
            _IDtoCargo[cargoID].receiver == msg.sender,
            "You are not allowed to accept this cargo."
        );
        _; // Continues execution if the condition is met.
    }

    modifier isCourier(address addr) {
        // Modifier to check if the message sender is a registered courier.
        require(
            _registeredAccounts[addr] == AccountTypes.Courier,
            "Not a courier account."
        );
        _; // Continues execution if the condition is met.
    }

    modifier onlyOwner() {
        // Modifier to check if the message sender is the owner of the contract.
        require(msg.sender == _owner, "It's an owner-only function.");
        _; // Continues execution if the condition is met.
    }

    function createCargo(
        address receiver
    )
        external
        isAccountRegistered(msg.sender)
        isSender(msg.sender)
        nonReentrant
        returns (bytes32)
    {
        // Function to create a new cargo.
        Cargo memory newCargo; // Creates a new temporary Cargo struct.

        //Kargo ID'si oluşturulur.
        bytes32 id = keccak256(
            abi.encode(msg.sender, block.timestamp, receiver, _cargoCount)
        );

        newCargo.cargoID = id; // Assigns the next cargo ID.
        newCargo.sender = msg.sender; // Sets the sender to the message sender.
        newCargo.receiver = receiver; // Sets the receiver to the provided address.
        newCargo.current = msg.sender; // Sets the current handler to Sender.
        newCargo.status = CargoStatus.Created; // Sets the cargo status to Created.

        //Gonderen ve Alıcıya kargoyu tanımlayalım ki kendi ekranlarında kargo bilgilerini görebilmek için referansları olsun.
        accToCargoIDs[msg.sender].push(id);
        accToCargoIDs[receiver].push(id);

        _IDtoCargo[id] = newCargo; // Maps the new cargo to its ID in the mapping.
        _cargoCount += 1; // Increments the cargo count for the next cargo.

        return id;
    }

    //Kargocu tarafından kargo teslim alınırken çağırılacak fonksiyon.
    function takeCargo(
        bytes32 id
    )
        external
        isAccountRegistered(msg.sender)
        isCourier(msg.sender)
        nonReentrant
    {
        // Function for a courier to take over a cargo.
        require(
            _IDtoCargo[id].status == CargoStatus.Created,
            "Cargo not in correct state for takeover."
        ); // Checks if the cargo is in the Created state.
        _IDtoCargo[id].current = msg.sender; // Updates the current handler to Courier.
        _IDtoCargo[id].status = CargoStatus.Taken; // Updates the cargo status to Taken.

        //Kargocu kargoyu alırken kendisine kargonun kendisi tanımlanır.
        accToCargoIDs[msg.sender].push(id);
    }

    //Kargonun nihai alıcısı tarafından kullanılacak fonksiyon
    function receiveCargo(
        bytes32 id
    ) external isAccountRegistered(msg.sender) isReceiver(id) nonReentrant {
        // Function for a receiver to acknowledge receipt of a cargo.
        require(
            _IDtoCargo[id].status == CargoStatus.Taken,
            "Cargo not in correct state for receiving."
        ); // Checks if the cargo is in the Taken state.
        _IDtoCargo[id].current = msg.sender; // Updates the current handler to Receiver.
        _IDtoCargo[id].status = CargoStatus.Delivered; // Updates the cargo status to Delivered.
    }

    function registerAddress(
        address addr,
        AccountTypes accountType
    ) external onlyOwner nonReentrant {
        // Function for the owner to register an address with a specific account type.
        _registeredAccounts[addr] = accountType; // Maps the address to the specified account type in the mapping.
    }

    //GET FUNCTIONS

    function getCargoDetails(bytes32 id) external view returns (Cargo memory) {
        // Function to get details of a specific cargo.
        return _IDtoCargo[id]; // Returns the Cargo struct associated with the given ID.
    }

    function getRegisteredAccountDetails(
        address _addr
    ) external view returns (AccountTypes) {
        // Function to get AccountType detail of a specific address.
        return _registeredAccounts[_addr]; // Returns the AccountType of a specific address.
    }

    function getIDtoCargo(
        bytes32 id
    ) public view isAccountRegistered(msg.sender) returns (Cargo memory) {
        return _IDtoCargo[id];
    }

    function getRegisteredAccounts(
        address addr
    ) public view isAccountRegistered(msg.sender) returns (AccountTypes) {
        return _registeredAccounts[addr];
    }

    function gettAccToCargoIDs(
        address addr
    ) public view isAccountRegistered(msg.sender) returns (bytes32[] memory) {
        return accToCargoIDs[addr];
    }
}
