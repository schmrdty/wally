import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contractConfig.js";
import db from "./db.js";

export async function transferTokens(req, res) {
  const { from, to, amount } = req.body; // Validate inputs!
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_API_KEY);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  // Check balance/threshold
  const balance = await contract.balanceOf(from);
  const threshold = await contract.minBalances(from);
  const toSend = balance - threshold;

  if (toSend <= 0) {
    return res.status(400).json({ error: "Balance below threshold" });
  }

  const tx = await contract.transfer(to, toSend);
  await tx.wait();

  await db.run(
    `INSERT INTO activity_log (wallet_address, action, message) VALUES (?, ?, ?)`,
    [from, "transfer", `Transferred ${toSend} from ${from} to ${to}`]
  );

  res.json({ success: true, txHash: tx.hash });
}