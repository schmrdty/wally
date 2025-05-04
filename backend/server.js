import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import db from "./db.js";
import validateWallet from "./validate.js";
import axios from "axios";
import { ethers } from "ethers";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { getLogs } from "./activityLogController.js";
import { startWatching, stopWatching } from "./tokenWatcherController.js";
import { revokeUserData } from "./revokeController.js";
import { idempotencyMiddleware } from "./idempotencyMiddleware.js";
app.use(idempotencyMiddleware);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());
app.use(morgan("combined"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// --- General Utility ---
function handleError(res, errorMessage, statusCode = 500) {
  console.error(`[ERROR]: ${errorMessage}`);
  res.status(statusCode).json({ type: 'error', message: errorMessage });
}

// --- API Routes ---

// Start watching a wallet and destination pair.
app.post('/watch', async (req, res) => {
  const { watched, destination } = req.body;
  if (!watched || !destination) {
    return res.status(400).json({ type: 'error', message: 'Fields cannot be blank.' });
  }
  if (watched === destination) {
    return res.status(400).json({ type: 'error', message: 'Watched cannot equal Destination.' });
  }
  try {
    const exists = await db.get(
      `SELECT * FROM watch_sessions WHERE watched_wallet = ? AND destination_wallet = ?`,
      [watched, destination]
    );
    if (exists) {
      return res.status(409).json({ type: 'error', message: 'Config already exists.' });
    }

    const validWatched = await validateWallet(watched);
    const validDestination = await validateWallet(destination);

    if (!validWatched.valid || !validDestination.valid) {
      return res.status(400).json({
        type: 'error',
        message: `Invalid wallet/ENS: ${!validWatched.valid ? watched : destination}`,
      });
    }

    await db.query(
      `INSERT INTO watch_sessions (watched_wallet, destination_wallet, started_at) VALUES (?, ?, datetime('now'))`,
      [validWatched.address, validDestination.address]
    );
    res.status(201).json({
      type: 'success',
      message: `Now watching ${validWatched.address}`,
    });
  } catch (error) {
    handleError(res, 'Failed to start watching. Please try again.');
  }
});

// Stop watching a wallet.
app.post('/unwatch', async (req, res) => {
  const { watched } = req.body;
  if (!watched) {
    return res.status(400).json({ type: 'error', message: 'Watched wallet address is required.' });
  }
  try {
    await db.query(`DELETE FROM watch_sessions WHERE watched_wallet = ?`, [watched]);
    res.status(200).json({
      type: 'success',
      message: `Stopped watching ${watched}`,
    });
  } catch (error) {
    handleError(res, 'Failed to stop watching. Please try again.');
  }
});

// Retrieve the transaction logs.
app.get('/logs', async (req, res) => {
  try {
    const logs = await db.all(`SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 100`);
    res.status(200).json(logs);
  } catch (error) {
    handleError(res, 'Failed to retrieve logs. Please try again.');
  }
});

// Log a custom transaction or message.
app.post('/log', async (req, res) => {
  const { type, message } = req.body;
  if (!type || !message) {
    return res.status(400).json({ type: 'error', message: 'Both type and message are required.' });
  }
  try {
    await db.query(
      `INSERT INTO transactions (tx_type, message, timestamp) VALUES (?, ?, datetime('now'))`,
      [type, message]
    );
    res.status(201).json({ success: true });
  } catch (error) {
    handleError(res, 'Failed to log message. Please try again.');
  }
});

// Transfer funds between wallets (simulation).
app.post('/transfer', async (req, res) => {
  const { from, to, amount } = req.body;
  if (!from || !to || !amount) {
    return res.status(400).json({
      type: 'error',
      message: 'From, To, and Amount fields are required.',
    });
  }
  try {
    const validFrom = await validateWallet(from);
    const validTo = await validateWallet(to);

    if (!validFrom.valid || !validTo.valid) {
      return res.status(400).json({
        type: 'error',
        message: `Invalid wallet/ENS: ${!validFrom.valid ? from : to}`,
      });
    }
  const tx = await contractWithSigner.transferToken(
  validFrom.address, // user
  tokenAddress,
  amount
);
await tx.wait(); // wait for confirmation

// Then log to DB
await db.query(
  `INSERT INTO transactions (tx_type, message, timestamp, tx_hash) VALUES (?, ?, datetime('now'), ?)`,
  ['transfer', `Transferred ${amount} from ${validFrom.address} to ${validTo.address}`, tx.hash]
);
res.status(200).json({
  type: 'success',
  message: `Successfully transferred ${amount}.`,
  txHash: tx.hash
});
  } catch (error) {
    handleError(res, 'Failed to transfer funds. Please try again.');
  }
});

// --- Advanced Watcher API (from previous server.js) ---

const activeWatchers = new Map();
const { ALCHEMY_BASE, WARPCAST_API } = process.env;
const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 15000;

// Start Watching (real-time, for advanced use)
app.post("/start-watching", async (req, res) => {
  const { walletAddress, destinationAddress, warpcastFid } = req.body;
  if (!walletAddress || !destinationAddress) {
    return res.status(400).json({ error: "Missing wallet or destination address" });
  }
  if (!ethers.isAddress(walletAddress) || !ethers.isAddress(destinationAddress)) {
    return res.status(400).json({ error: "Invalid Ethereum address provided" });
  }
  let isGasSponsored = false;
  if (warpcastFid) {
    try {
      const isValidFid = await validateWarpcastFid(warpcastFid, walletAddress);
      if (isValidFid) isGasSponsored = true;
    } catch (error) {
      return res.status(400).json({ error: "Invalid Warpcast FID." });
    }
  }
  const startedAt = new Date().toISOString();
  db.query(
    `INSERT INTO watch_sessions (watched_wallet, destination_wallet, started_at, is_gas_sponsored) VALUES (?, ?, ?, ?)`,
    [walletAddress, destinationAddress, startedAt, isGasSponsored],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const sessionId = this.lastID;
      startWatcher(walletAddress, sessionId, isGasSponsored);
      res.json({ sessionId, isGasSponsored });
    }
  );
});

// Stop Watching (real-time, for advanced use)
app.post("/stop-watching", (req, res) => {
  const { walletAddress, revoke } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ error: "Missing wallet address" });
  }
  db.get(
    `SELECT id FROM watch_sessions WHERE watched_wallet = ? ORDER BY started_at DESC LIMIT 1`,
    [walletAddress],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ error: "No active session found" });
      }
      const sessionId = row.id;
      const stoppedAt = new Date().toISOString();
      if (revoke) {
        stopWatcher(sessionId, true, res);
        return;
      }
      db.query(
        `UPDATE watch_sessions SET stopped_at = ? WHERE id = ?`,
        [stoppedAt, sessionId],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          stopWatcher(sessionId, false, res);
        }
      );
    }
  );
});

// Get advanced logs
app.get("/log", (req, res) => {
  db.all(`SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 1000`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ logs: rows });
  });
});

// -- Helpers --

async function validateWarpcastFid(warpcastFid, walletAddress) {
  const response = await axios.get(
    `${WARPCAST_API}/fc/primary-address?fid=${warpcastFid}&protocol=ethereum`
  );
  const primaryAddress = response.data.result.address.address.toLowerCase();
  return primaryAddress === walletAddress.toLowerCase();
}

function stopWatcher(sessionId, revoke, res) {
  const interval = activeWatchers.get(sessionId);
  if (interval) clearInterval(interval);
  activeWatchers.delete(sessionId);
  if (revoke) {
    db.query(`DELETE FROM watch_sessions WHERE id = ?`, [sessionId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ revoked: true });
    });
    return;
  }
  res.json({ stopped: true });
}

function startWatcher(walletAddress, sessionId, isGasSponsored) {
  if (activeWatchers.has(sessionId)) return;
  const interval = setInterval(async () => {
    try {
      const res = await axios.post(`${ALCHEMY_BASE}/alchemy_getAssetTransfers`, {
        fromBlock: "latest",
        toAddress: walletAddress,
        excludeZeroValue: true,
        category: ["external", "erc20"],
        maxCount: 100,
      });
      const transfers = res.data.transfers || [];
      for (const tx of transfers) {
        // insertIfNew() needs to be defined or imported if used!
      }
    } catch (err) {
      console.error("[WATCH ERROR]:", err.message);
    }
  }, POLLING_INTERVAL);
  activeWatchers.set(sessionId, interval);
}

/**
 * Revoke endpoint: generates PDF, sends it, and deletes user data.
 * Expects { walletAddress, farcasterFid (optional) }
 */
app.post('/revoke', async (req, res) => {
  const { walletAddress, farcasterFid } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ error: "walletAddress is required" });
  }
  try {
    // 1. Fetch user's data from DB
    const userSessions = await db.all(`SELECT * FROM watch_sessions WHERE watched_wallet = ?`, [walletAddress]);
    const userTxs = await db.all(`SELECT * FROM transactions WHERE from_address = ? OR to_address = ?`, [walletAddress, walletAddress]);

    // 2. Generate a PDF with user's data
    const doc = new PDFDocument();
    const pdfPath = path.join("/tmp", `user_data_${walletAddress}.pdf`);
    doc.pipe(fs.createWriteStream(pdfPath));
    doc.fontSize(18).text("Your Wally the Wallet Watcher Data", { underline: true });
    doc.moveDown();
    doc.fontSize(14).text("Sessions:");
    userSessions.forEach(session => doc.text(JSON.stringify(session)));
    doc.moveDown();
    doc.fontSize(14).text("Transactions:");
    userTxs.forEach(tx => doc.text(JSON.stringify(tx)));
    doc.end();

    // Wait for PDF to finish writing
    await new Promise(resolve => doc.on("finish", resolve));

    // 3. If Farcaster user, send programmable direct cast (pseudo-code)
    if (farcasterFid) {
      // TODO: Replace with real Farcaster programmable cast implementation
      // e.g. await sendFarcasterDirectCast(farcasterFid, pdfPath);
      // For now, just respond success
      // Clean up temp PDF after sending
      fs.unlinkSync(pdfPath);
      // 4. Delete user data from DB
      await db.run(`DELETE FROM watch_sessions WHERE watched_wallet = ?`, [walletAddress]);
      await db.run(`DELETE FROM transactions WHERE from_address = ? OR to_address = ?`, [walletAddress, walletAddress]);
      return res.json({ success: true, farcaster: true });
    } else {
      // 3. Serve PDF as download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="wally_data_${walletAddress}.pdf"`);
      const filestream = fs.createReadStream(pdfPath);
      filestream.pipe(res);
      filestream.on("end", async () => {
        // Delete the file after download
        fs.unlinkSync(pdfPath);
        // 4. Delete user data from DB
        await db.run(`DELETE FROM watch_sessions WHERE watched_wallet = ?`, [walletAddress]);
        await db.run(`DELETE FROM transactions WHERE from_address = ? OR to_address = ?`, [walletAddress, walletAddress]);
      });
    }
  } catch (error) {
    console.error("[REVOKE ERROR]:", error);
    res.status(500).json({ error: "Failed to revoke and export user data." });
  }
});

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());
app.use(morgan("combined"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get("/log", getLogs);
app.post("/start-watching", startWatching);
app.post("/stop-watching", stopWatching);
app.post("/revoke", revokeUserData);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Secure backend live at http://localhost:${PORT}`);
});