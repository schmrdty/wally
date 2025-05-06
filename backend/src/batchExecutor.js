import { ethers } from "ethers";
import { BATCH_EXECUTOR_ADDRESS, BATCH_EXECUTOR_ABI } from "./contractConfig.js";
import { ERC20_ABI } from "./erc20Abi.js";

export async function batchExecute({ privateKey, providerUrl, batchCalls }) {
  const provider = new ethers.JsonRpcProvider(providerUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const batchContract = new ethers.Contract(BATCH_EXECUTOR_ADDRESS, BATCH_EXECUTOR_ABI, signer);

  const targets = batchCalls.map(c => c.to);
  const payloads = batchCalls.map(c => c.data);
  const values = batchCalls.map(c => ethers.BigNumber.from(c.value || 0));
  const totalValue = values.reduce((a, b) => a.add(b), ethers.BigNumber.from(0));

  // Send the batch
  const tx = await batchContract.batch(targets, payloads, { value: totalValue });
  return tx.wait();
}

// Example batch with ERC20 and ETH
const erc20 = new ethers.Contract(ERC20_ADDRESS, ERC20_ABI);
const erc20Data = erc20.interface.encodeFunctionData("transfer", [recipient, amount]);
const ethRecipient = "0x...";
const ethAmount = ethers.utils.parseEther("0.1");

const batchCalls = [
  { to: ERC20_ADDRESS, data: erc20Data, value: 0 },
  { to: ethRecipient, data: "0x", value: ethAmount }
];

// Call from your API/controller:
await batchExecute({
  privateKey: process.env.PRIVATE_KEY,
  providerUrl: process.env.ALCHEMY_API_KEY,
  batchCalls
});