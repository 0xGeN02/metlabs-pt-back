import { ethers } from "ethers";
import { z } from "zod";
import { SmartContractPruebaTecnicaAbi__factory } from "types/factories/SmartContractPruebaTecnicaAbi__factory";
import { SmartContractPruebaTecnicaAbi } from '../types/SmartContractPruebaTecnicaAbi';

// Define a schema for environment variables
const envSchema = z.object({
  ALCHEMY_API_URL: z.string().url(),
  ALCHEMY_SEPOLIA_API_KEY: z.string(),
  CONTRACT_ADDRESS: z.string(),
  WALLET_PRIVATE_KEY: z.string(),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

const providerURL = env.ALCHEMY_API_URL;
const network: ethers.Networkish = env.ALCHEMY_SEPOLIA_API_KEY;
const contractAddress = env.CONTRACT_ADDRESS;
const privateKey = env.WALLET_PRIVATE_KEY;

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