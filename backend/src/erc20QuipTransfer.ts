import { QuipEthereum, QuipABI } from "@quipus/ethereum-sdk";
import { ethers } from "ethers";

const quip = new QuipEthereum({
  vaultId: process.env.QUIP_VAULT_ID!,
  apiKey: process.env.QUIP_API_KEY!,
});

const ERC20_ABI = [
  QuipABI.pqFunction("transfer", ["address", "uint256"], "bool"),
];

export async function sendERC20TransferViaQuip({
  tokenAddress,
  to,
  amount,
  chainId
}: {
  tokenAddress: string;
  to: string;
  amount: string;
  chainId: number;
}) {
  const iface = new ethers.utils.Interface(ERC20_ABI as any);
  const data = iface.encodeFunctionData("transfer", [to, amount]);
  const tx = {
    to: tokenAddress,
    data,
    value: "0x0",
    gasLimit: "0x5208",
    chainId
  };
  return await quip.sendTransaction(tx);
}