import { ethers } from "ethers";
import { SmartContractPruebaTecnicaAbi__factory } from "types/factories/SmartContractPruebaTecnicaAbi__factory";
import { SmartContractPruebaTecnicaAbi } from '../types/SmartContractPruebaTecnicaAbi';

const network: ethers.Networkish = "sepolia"; // Use a valid Ethereum network name
const alchemyApiKey = process.env.ALCHEMY_SEPOLIA_API_KEY;
if (!alchemyApiKey) throw new Error("Alchemy API key is not defined");

const providerURL = `https://eth-sepolia.alchemyapi.io/v2/${alchemyApiKey}`; // Construct the provider URL using the API key
if (!providerURL) throw new Error("Provider URL is not defined");

const contractAddress = process.env.CONTRACT_ADDRESS;
if (!contractAddress) throw new Error("Contract address is not defined");

const privateKey = process.env.WALLET_PRIVATE_KEY;
if (!privateKey) throw new Error("Private key is not defined");
const providerOptions: ethers.JsonRpcApiProviderOptions = {
    polling: true,
    pollingInterval: 10000,
    staticNetwork: true,
    batchMaxCount: 10,
    batchMaxSize: 1000000,
    batchStallTime: 1000,
    cacheTimeout: 10000,
}

// Create a provider
const provider = new ethers.JsonRpcProvider(providerURL, network, providerOptions);
if (!provider) throw new Error("Provider is not defined");

// Create a wallet
const wallet = new ethers.Wallet(privateKey, provider);
if (!wallet) throw new Error("Wallet is not defined");

// Use the factory to connect to the contract
const contract: SmartContractPruebaTecnicaAbi = SmartContractPruebaTecnicaAbi__factory.connect(contractAddress, wallet);
if (!contract) throw new Error("Contract is not defined");

// Export utility functions
export const getWallet = () => wallet;
export const getSigner = () => wallet.connect(provider);
export const getContract = () => contract;