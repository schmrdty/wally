import { smartAccountClient } from "./paymaster.js";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contractConfig.js";
import { ethers } from "ethers";
import db from "./db.js";

export async function transferWithPaymasterAndThreshold(userAddress, targetAddress) {
  // 1. Get threshold from DB
  const row = await db.get('SELECT threshold FROM user_settings WHERE address = ?', [userAddress]);
  const threshold = ethers.BigNumber.from(row?.threshold || "0");

  // 2. Get current balance
  const provider = smartAccountClient.provider;
  const balance = await provider.getBalance(userAddress);

  // 3. Compute how much to send
  const toSend = balance.sub(threshold);
  if (toSend.lte(0)) throw new Error("Nothing to send after threshold");

  // 4. Prepare UserOp for token transfer
  const iface = new ethers.utils.Interface(CONTRACT_ABI);
  const data = iface.encodeFunctionData('transfer', [targetAddress, toSend]);

  // 5. Sponsor the transaction via paymaster/bundler
  const userOp = await smartAccountClient.createSponsoredUserOp({
    sender: userAddress,
    to: CONTRACT_ADDRESS,
    data,
    value: 0,
  });

  const txHash = await smartAccountClient.sendUserOp(userOp);

  // 6. Log for frontend
  await db.run(
    `INSERT INTO transactions (tx_type, message, tx_hash, timestamp) VALUES (?, ?, ?, datetime('now'))`,
    ['paymaster-transfer', `Transferred ${toSend.toString()} tokens from ${userAddress} to ${targetAddress} (leaving threshold ${threshold})`, txHash]
  );

  return txHash;
}