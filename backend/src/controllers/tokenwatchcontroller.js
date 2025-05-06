import db from "./db.js";
import { ethers } from "ethers";
import validateWallet from "./validate.js";
// import Farcaster integration as needed

// POST /start-watching
export async function startWatching(req, res) {
  const {
    walletAddress,
    destinationAddress,
    warpcastFid,
    tokenAddresses,
    transferMode,
    minimumBalance,
  } = req.body;

  if (!walletAddress || !destinationAddress) {
    return res.status(400).json({ error: "walletAddress and destinationAddress are required" });
  }
  if (!ethers.isAddress(walletAddress) || !ethers.isAddress(destinationAddress)) {
    return res.status(400).json({ error: "Invalid Ethereum address provided" });
  }
  // Optionally validate token addresses
  if (tokenAddresses && !Array.isArray(tokenAddresses)) {
    return res.status(400).json({ error: "tokenAddresses must be an array" });
  }

  // Create session and watcher logic
  try {
    const startedAt = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO watch_sessions (watched_wallet, destination_wallet, started_at, is_gas_sponsored, transfer_mode, minimum_balance, tokens) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        walletAddress,
        destinationAddress,
        startedAt,
        !!warpcastFid,
        transferMode || null,
        minimumBalance || null,
        JSON.stringify(tokenAddresses || []),
      ]
    );
    const sessionId = result.lastID;
    // Optionally: set up watcher jobs, notify user via Farcaster
    res.json({ sessionId });
  } catch (err) {
    console.error("[START WATCHING ERROR]:", err);
    res.status(500).json({ error: "Failed to start watching." });
  }
}

// POST /stop-watching
export async function stopWatching(req, res) {
  const { walletAddress } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ error: "walletAddress required" });
  }
  // End session logic; optionally remove any scheduled jobs
  try {
    await db.run(
      `UPDATE watch_sessions SET stopped_at = ? WHERE watched_wallet = ? AND stopped_at IS NULL`,
      [new Date().toISOString(), walletAddress]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[STOP WATCHING ERROR]:", err);
    res.status(500).json({ error: "Failed to stop watching." });
  }
}