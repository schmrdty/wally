import { smartAccountClient } from "./paymaster.js";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contractConfig.js";
import { ethers } from "ethers";

// Transfer tokens, leaving user's defined threshold
export async function transferLeavingThreshold(userAddress, targetAddress, threshold, amount) {
  // 1. Get balance
  const provider = smartAccountClient.provider;
  const balance = await provider.getBalance(userAddress);

  // 2. Subtract threshold
  const toSend = balance.sub(threshold);

  if (toSend.lte(0)) throw new Error("Insufficient funds after threshold");

  // 3. Prepare transfer UserOp
  const iface = new ethers.utils.Interface(CONTRACT_ABI);
  const data = iface.encodeFunctionData('transfer', [targetAddress, toSend]);
 
  // 4. Insert remaining logic for Threshold transfer
  
  
  return txHash;
}