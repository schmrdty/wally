import { QuipEthereum, QuipABI } from "@quipus/ethereum-sdk";
import { ethers } from "ethers";

// 1. QuipEthereum Initialization
const quip = new QuipEthereum({
  vaultId: process.env.QUIP_VAULT_ID!,
  apiKey: process.env.QUIP_API_KEY!,
  // ...other config as needed
});

// 2. Your contract's ABI, using QuipABI for quantum-safe encoding
const WALLY_ABI = [
  QuipABI.pqFunction("setMinBalance", ["uint256"], "void"),
  QuipABI.pqFunction("performTransfer", ["address", "uint256"], "void"),
  // ...add more as needed
];

// 3. Example function call: setMinBalance on your contract
export async function setOnChainThreshold({
  contractAddress,
  minBalance,
  chainId
}: {
  contractAddress: string;
  minBalance: string;
  chainId: number;
}) {
  const iface = new ethers.utils.Interface(WALLY_ABI as any);
  const data = iface.encodeFunctionData("setMinBalance", [minBalance]);
  const tx = {
    to: contractAddress,
    data,
    value: "0x0",
    gasLimit: "0x5208",
    chainId
  };
  return await quip.sendTransaction(tx);
}

// 4. Example function call: performTransfer on your contract
export async function performWallyTransfer({
  contractAddress,
  to,
  amount,
  chainId
}: {
  contractAddress: string;
  to: string;
  amount: string;
  chainId: number;
}) {
  const iface = new ethers.utils.Interface(WALLY_ABI as any);
  const data = iface.encodeFunctionData("performTransfer", [to, amount]);
  const tx = {
    to: contractAddress,
    data,
    value: "0x0",
    gasLimit: "0x5208",
    chainId
  };
  return await quip.sendTransaction(tx);
}