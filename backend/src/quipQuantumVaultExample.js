import { QuipEthereum, QuipABI } from "@quipus/ethereum-sdk";
import { ethers } from "ethers";

// --- CONFIGURATION ---

// 1. Initialize QuipEthereum with your Quip Vault credentials
const quip = new QuipEthereum({
  vaultId: process.env.QUIP_VAULT_ID!,
  apiKey: process.env.QUIP_API_KEY!,
  // ...other config as needed (see Quip docs)
});

// 2. Example contract ABIs (post-quantum compatible)
const ERC20_ABI = [
  // Use QuipABI extension for post-quantum compatibility if required
  QuipABI.pqFunction("transfer", ["address", "uint256"], "bool"),
  QuipABI.pqFunction("balanceOf", ["address"], "uint256"),
];

// 3. Optional: Native ETH transfer (no ABI needed, just a value transfer)

// --- UTILITY: Post-Quantum Transfer Function ---

/**
 * Sends either an ETH or ERC20 transfer from the Quip vault.
 * @param to string - recipient address
 * @param amount string - amount in wei (for ERC20) or ETH (for native, as string)
 * @param tokenAddress string | undefined - ERC20 address, or undefined for native ETH
 * @param chainId number - e.g., 84532 for Base Sepolia, 8453 for Base mainnet
 * @returns Transaction result
 */
export async function sendQuipTransfer({
  to,
  amount,
  tokenAddress,
  chainId
}: {
  to: string;
  amount: string;
  tokenAddress?: string;
  chainId: number;
}): Promise<any> {
  if (tokenAddress) {
    // --- ERC20 Transfer ---
    // Compose post-quantum ABI function call
    const iface = new ethers.utils.Interface(ERC20_ABI as any);
    const data = iface.encodeFunctionData("transfer", [to, amount]);
    const tx = {
      to: tokenAddress,
      data,
      value: "0x0",
      gasLimit: "0x5208", // set higher as needed
      chainId
    };
    return await quip.sendTransaction(tx);
  } else {
    // --- Native ETH Transfer ---
    const tx = {
      to,
      value: ethers.utils.hexlify(ethers.utils.parseEther(amount)),
      data: "0x",
      gasLimit: "0x5208", // set appropriately
      chainId
    };
    return await quip.sendTransaction(tx);
  }
}

// --- EXAMPLE USAGE ---

async function main() {
  // Example: send 0.01 ETH to a user on Base Sepolia
  const ethResult = await sendQuipTransfer({
    to: "0xRecipientAddress...",
    amount: "0.01",
    chainId: 84532
  });
  console.log("ETH transfer tx:", ethResult);

  // Example: send 10 tokens (assuming 18 decimals) to a user
  const tokenResult = await sendQuipTransfer({
    to: "0xRecipientAddress...",
    amount: ethers.utils.parseUnits("10", 18).toString(),
    tokenAddress: "0xYourERC20TokenAddress...",
    chainId: 84532
  });
  console.log("ERC20 transfer tx:", tokenResult);
}

main().catch(console.error);