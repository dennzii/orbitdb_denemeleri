import dotenv from "dotenv";
import { ethers } from "ethers";
import { getAccountNonce } from "permissionless";
import { UserOperation, bundlerActions, getSenderAddress, signUserOperationHashWithECDSA } from "permissionless";
import { pimlicoBundlerActions, pimlicoPaymasterActions } from "permissionless/actions/pimlico";
import { Hash, concat, createClient, createPublicClient, encodeFunctionData, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
dotenv.config();

// DEFINE THE CONSTANTS
const signingKey = process.env.NEXT_SIGNING_KEY; // replace this with a private key you generate!
const apiKey = process.env.NEXT_GOERLI_TEST_API_KEY; // replace with your Pimlico API key
const entryPointAddress = process.env.NEXT_ENTRY_POINT_PUBLIC_ADDRESS as `0x${string}`; // replace with the entry point address
const erc20PaymasterAddress = process.env.NEXT_ERC20_PAYMASTER_ADDRESS as `0x${string}`; // replace with the erc20 paymaster address
const simpleAccountFactoryAddress = process.env.NEXT_SIMPLE_ACCOUNT_FACTORY_PUBLIC_ADDRESS as `0x${string}`; // replace with the simple account factory address
const supplyChainManagementAddress = process.env.NEXT_SUPPLY_CHAIN_MANAGEMENT_PUBLIC_ADDRESS_SEPOLIA as `0x${string}`; // replace with the simple account factory address
const chain = "sepolia"; // replace with the chain you want to use
console.log(signingKey);

if (!signingKey) {
    throw new Error("The signing key is not defined in the environment variables.");
}
if (apiKey === undefined) {
    throw new Error(
        "Please replace the `apiKey` env variable with your Pimlico API key"
    );
}
if (entryPointAddress === undefined) {
    throw new Error(
        "Please replace the `ENTRY_POINT_ADDRESS` env variable with your Pimlico API key"
    );
}
if (erc20PaymasterAddress === undefined) {
    throw new Error(
        "Please replace the `ENTRY_POINT_ADDRESS` env variable with your Pimlico API key"
    );
}
if (simpleAccountFactoryAddress === undefined) {
    throw new Error(
        "Please replace the `SIMPLE_ACCOUNT_FACTORY_ADDRESS` env variable with your Pimlico API key"
    );
}
if (supplyChainManagementAddress === undefined) {
    throw new Error(
        "Please replace the `NEXT_SUPPLY_CHAIN_MANAGEMENT_PUBLIC_ADDRESS_SEPOLIA` env variable with your Pimlico API key"
    );
}

const formattedSigningKey = signingKey.startsWith('0x') ? signingKey : `0x${signingKey}`;
const signer = privateKeyToAccount(formattedSigningKey as Hash);

const bundlerClient = createClient({
    transport: http(`https://api.pimlico.io/v1/${chain}/rpc?apikey=${apiKey}`),
    chain: sepolia,
})
    .extend(bundlerActions)
    .extend(pimlicoBundlerActions);

const paymasterClient = createClient({
    // ⚠️ using v2 of the API ⚠️
    transport: http(`https://api.pimlico.io/v2/${chain}/rpc?apikey=${apiKey}`),
    chain: sepolia,
}).extend(pimlicoPaymasterActions);

const publicClient = createPublicClient({
    transport: http("https://rpc.sepolia.org"),
    chain: sepolia,
});

// CALCULATE THE DETERMINISTIC SENDER ADDRESS
const initCode = concat([
    simpleAccountFactoryAddress,
    encodeFunctionData({
        abi: [
            {
                inputs: [
                    { name: "owner", type: "address" },
                    { name: "salt", type: "uint256" },
                ],
                name: "createAccount",
                outputs: [{ name: "ret", type: "address" }],
                stateMutability: "nonpayable",
                type: "function",
            },
        ],
        args: [signer.address, 0n],
    }),
]);

const senderAddress = await getSenderAddress(publicClient, {
    initCode,
    entryPoint: entryPointAddress,
});

console.log("Counterfactual sender address:", senderAddress);

const generateCreateAccountCallData = ({ email }: { email: string }) => {
    let hexString = "";
    hexString = "0x" + Buffer.from(email, "utf8").toString("hex");
    const salt = hexString;
    const createAccountData = encodeFunctionData({
        abi: [
            {
                inputs: [
                    { name: "owner", type: "address" },
                    { name: "salt", type: "uint256" },
                ],
                name: "createAccount",
                outputs: [{ name: "ret", type: "address" }],
                stateMutability: "nonpayable",
                type: "function",
            },
        ],
        args: [signer.address, BigInt(salt)],
    });

    const to = simpleAccountFactoryAddress;
    const value = 0n;
    const data = createAccountData;

    const callData = encodeFunctionData({
        abi: [
            {
                inputs: [
                    { name: "dest", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "func", type: "bytes" },
                ],
                name: "execute",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function",
            },
        ],
        args: [to, value, data],
    });

    return callData;
};

const generateGetAddressCallData = ({ _owner, email }: { _owner: string, email: string }) => {
    let hexString = "";
    hexString = "0x" + Buffer.from(email, "utf8").toString("hex");
    const salt = hexString;
    const ownerAddress = _owner as `0x${string}`;
    const getAddressData = encodeFunctionData({
        abi: [
            {
                inputs: [
                    { name: "owner", type: "address" },
                    { name: "salt", type: "uint256" },
                ],
                name: "getAddress",
                outputs: [{ name: "", type: "address" }],
                stateMutability: "nonpayable",
                type: "function",
            },
        ],
        args: [ownerAddress, BigInt(salt)],
    });

    const to = simpleAccountFactoryAddress;
    const value = 0n;
    const data = getAddressData;

    const callData = encodeFunctionData({
        abi: [
            {
                inputs: [
                    { name: "dest", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "func", type: "bytes" },
                ],
                name: "execute",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function",
            },
        ],
        args: [to, value, data],
    });

    return callData;
};

const submitUserOperation = async (userOperation: UserOperation) => {
    const userOperationHash = await bundlerClient.sendUserOperation({
        userOperation,
        entryPoint: entryPointAddress,
    });
    console.log(`UserOperation submitted. Hash: ${userOperationHash}`);

    console.log("Querying for receipts...");
    const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOperationHash,
    });
    console.log(
        `Receipt found!\nTransaction hash: ${receipt.receipt.transactionHash}`
    );
};

// const approveCallData = genereteApproveCallData(usdcTokenAddress, erc20PaymasterAddress)

// FILL OUT THE REMAINING USEROPERATION VALUES
const gasPriceResult = await bundlerClient.getUserOperationGasPrice();

const nonceOfAccount = await getAccountNonce(publicClient, {
    sender: senderAddress,
    entryPoint: entryPointAddress,
});

let dynamicInitCode;

if (nonceOfAccount === 0n) {
    console.log("Sender address is 0x, creating...");
    dynamicInitCode = initCode;
} else {
    dynamicInitCode = "0x" as `0x${string}`;
}


const approveCallData = generateCreateAccountCallData({
    email: "edizzum@gmail.com",
});

const getAddressCallData = generateGetAddressCallData({
    _owner: signer.address,
    email: "edizzum@gmail.com",
});

const userOperation: Partial<UserOperation> = {
    sender: senderAddress,
    nonce: nonceOfAccount,
    initCode: dynamicInitCode,
    callData: approveCallData,
    maxFeePerGas: gasPriceResult.fast.maxFeePerGas,
    maxPriorityFeePerGas: gasPriceResult.fast.maxPriorityFeePerGas,
    paymasterAndData: "0x",
    signature:
        "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
};

// SPONSOR THE USEROPERATION USING THE VERIFYING PAYMASTER
const result = await paymasterClient.sponsorUserOperation({
    userOperation: userOperation as UserOperation,
    entryPoint: entryPointAddress,
});

userOperation.preVerificationGas = result.preVerificationGas;
userOperation.verificationGasLimit = result.verificationGasLimit;
userOperation.callGasLimit = result.callGasLimit;
userOperation.paymasterAndData = result.paymasterAndData;

// SIGN THE USEROPERATION
const signature = await signUserOperationHashWithECDSA({
    account: signer,
    userOperation: userOperation as UserOperation,
    chainId: sepolia.id,
    entryPoint: entryPointAddress,
});

userOperation.signature = signature;
const outputOfUserOperation = await submitUserOperation(userOperation as UserOperation);
console.log(outputOfUserOperation);