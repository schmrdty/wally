import { ethers } from "ethers"
import { CONTRACT_ABI } from "../frontend/src/contract.js" // Or copy ABI JSON here
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0xD8900C1b8610A27300ED68C3A248b44616155d37"

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL) // Alchemy, Infura, etc.

export const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

// For admin writes (e.g. transferToken), use a backend wallet:
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
export const contractWithSigner = contract.connect(signer)

// Example: backend transferToken call
export async function backendTransferToken(user, token, amount) {
  return await contractWithSigner.transferToken(user, token, amount)
}