// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct  Cargo {
    uint256 cargoID;
    address Sender;
    address Reciever;
    address Current;
    CargoStatus Status;
}

enum CargoStatus{
    Created,
    Taken,
    Shipped,
    Delivered
}

contract SupplyChainManagement {

    uint256 _cargoCount;
    address _owner;

    mapping(uint256 => Cargo) public _IDtoCargo;
    mapping(address => CargoStatus) public _registeredAccounts;

    constructor (address initialOwner){
        _owner = initialOwner;
        _cargoCount = 1;
    }

    //Kargo gönderen ve kabul eden hesaplar registered olmalıdır. Bu da ancak kontrat sahibi tarafından yapılabilir.
    modifier IsAccountRegistered()
    {
        require(_registeredAccounts[msg.sender] == true,"Account is not registered.");
        _;
    }

    //Fonksiyonu çağıran hesabın alıcı hesap olduğunu kontrol eder.
    modifier IsReciever(Cargo memory cargo)
    {
        require(cargo.Reciever == msg.sender,"You are not allowed to accept this good.");
        _;
    }

    modifier onlyOwner()
    {
        require(msg.sender == _owner,"It's a only owner function.");
        _;
    }

    //Kargoların sadece kontrat sahibi olan server tarafıdan oluşturulması düşünüldü.
    function createCargo(address reciever) external IsAccountRegistered() 
    {
        Cargo memory newCargo;
        newCargo.Sender = msg.sender;
        newCargo.Reciever = reciever;
        newCargo.Current = msg.sender;
        newCargo.cargoID = _cargoCount;
        newCargo.Status = CargoStatus.Created;

        _IDtoCargo[_cargoCount] = newCargo;

        _cargoCount += 1;
    }

    //aracı tarafın kargoyu alması için bir fonksiyon ama ismi ve içeriği belli değil
    //pass the good to delivery
    function takeOver(uint256 id) external IsCourier(_IDtoCargo[id]) IsAccountRegistered()
    {
        _IDtoCargo[id].Current = msg.sender;
        _IDtoCargo[id].Status = CargoStatus.Taken;
    }

    //Kargoyu teslim almak için bir fonksiyon
    function recieveCargo(uint256 id) external IsReciever(_IDtoCargo[id]) IsAccountRegistered()
    {
        _IDtoCargo[id].Current = msg.sender;//Kargoyu elinde bulunduran kişi nihai alıcıdır.
        _IDtoCargo[id].Status = CargoStatus.Delivered;//Kargo durumu 
    }

    function getCargoDetails(uint256 id) view external returns( Cargo memory)  {
        return _IDtoCargo[id];
    }

    //Sadece kontrat sahibi, kargo yaratacak ve kabul edecek hesapları kontrata kayıt edebilir.
    function registerAddress(address addr) external onlyOwner()
    {
        _registeredAccounts[addr] = true;
    }

}