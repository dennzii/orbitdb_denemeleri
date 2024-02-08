export const CONTRACT_ABI = 
    [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "reciever",
                    "type": "address"
                }
            ],
            "name": "createCargo",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "id",
                    "type": "uint256"
                }
            ],
            "name": "recieveCargo",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "addr",
                    "type": "address"
                }
            ],
            "name": "registerAddress",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "takeOver",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "initialOwner",
                    "type": "address"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "id",
                    "type": "uint256"
                }
            ],
            "name": "getCargoDetails",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "Sender",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "Reciever",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "Current",
                            "type": "address"
                        },
                        {
                            "internalType": "enum CargoStatus",
                            "name": "Status",
                            "type": "uint8"
                        },
                        {
                            "internalType": "uint256",
                            "name": "cargoID",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct Cargo",
                    "name": "",
                    "type": "tuple"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]
