import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contractConfig.js";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

export const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// For admin writes (e.g. transferToken), use a backend wallet:
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
export const contractWithSigner = contract.connect(signer);

// backend ERC20tokenBalance call + math for defining balance after user input mins
const balance = await provider.getBalance(userAddress); // for native ETH/ETH-based tokens
const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
const balance = await token.balanceOf(userAddress);
const threshold = ethers.parseEther(userThreshold); // get from on-chain or DB
const toSend = balance - threshold;
if (toSend > 0) {
  // Proceed with transfer of 'toSend'
}
// backend 

// Example: backend transferToken call
export async function backendTransferToken(user, token, amount) {
  return await contractWithSigner.transferToken(user, token, amount);
}

// backend 