import { ethers } from "ethers";

// For ETH transfers and ERC20 transfers in a single batch
export async function batchExecute({ provider, signer, batchContract, calls }) {
  // calls: [{to, data, value}]
  const targets = calls.map(c => c.to);
  const payloads = calls.map(c => c.data);
  const values = calls.map(c => c.value || 0);

  // If any call sends ETH, sum the value
  const totalValue = values.reduce((a, b) => ethers.BigNumber.from(a).add(b), ethers.BigNumber.from(0));

  const tx = await batchContract.connect(signer).batch(
    targets,
    payloads,
    { value: totalValue }
  );
  return tx.wait();
}

// Usage example:
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const batchContract = new ethers.Contract(
  BATCH_EXECUTOR_ADDRESS,
  BATCH_EXECUTOR_ABI,
  signer
);

const erc20 = new ethers.Contract(ERC20_ADDRESS, ERC20_ABI, signer);
const recipient = "0x...";
const amount = ethers.utils.parseUnits("10", 18);

const erc20Data = erc20.interface.encodeFunctionData("transfer", [recipient, amount]);
const ethRecipient = "0x...";
const ethAmount = ethers.utils.parseEther("0.1");

// Prepare batch
const calls = [
  { to: ERC20_ADDRESS, data: erc20Data, value: 0 },
  { to: ethRecipient, data: "0x", value: ethAmount }
];

await batchExecute({ provider, signer, batchContract, calls });