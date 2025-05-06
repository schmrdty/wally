import db from "./db.js";
import fs from "fs/promises";
import path from "path";
import { sendDirectCast } from "./farcasterUtils.js";
import { Parser } from "json2csv"; // npm install json2csv


// POST /revoke
export async function revokeUserData(req, res) {
  const { walletAddress, farcasterFid } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ error: "walletAddress required" });
  }
  // Sanitize wallet address for filename (hex only)
  const safeWallet = walletAddress.replace(/[^a-fA-F0-9]/g, "");
  const pdfPath = path.join("/tmp", `user_data_${safeWallet}.pdf`);

  try {
    const userSessions = await db.all(
      `SELECT * FROM watch_sessions WHERE watched_wallet = ?`,
      [walletAddress]
    );
    const userTxs = await db.all(
      `SELECT * FROM transactions WHERE from_address = ? OR to_address = ?`,
      [walletAddress, walletAddress]
    );

let fileBuffer;
    if (format === "csv") {
      const parser = new Parser();
      const csvData = parser.parse([...userSessions, ...userTxs]);
      await fs.writeFile(filePath, csvData);
      fileBuffer = Buffer.from(csvData);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="wally_data_${safeWallet}.csv"`);
    } else {
      const jsonData = JSON.stringify({ sessions: userSessions, transactions: userTxs }, null, 2);
      await fs.writeFile(filePath, jsonData);
      fileBuffer = Buffer.from(jsonData);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="wally_data_${safeWallet}.json"`);
    }

    res.send(fileBuffer);
    await fs.unlink(filePath);
    await db.run(`DELETE FROM watch_sessions WHERE watched_wallet = ?`, [walletAddress]);
    await db.run(`DELETE FROM transactions WHERE from_address = ? OR to_address = ?`, [walletAddress, walletAddress]);
  } catch (error) {
    console.error("[REVOKE ERROR]:", error);
    res.status(500).json({ error: "Failed to revoke and export user data." });
  } finally {
    try { await fs.unlink(filePath); } catch (_) {}
  }
}

    // Send as programmable direct cast if FID provided, else return for download
    if (farcasterFid) {
      await sendDirectCast(farcasterFid, "Your data export from Wally the Wallet Watcher", pdfBuffer);
      // Clean up and delete user data from DB
      await fs.unlink(pdfPath);
      await db.run(`DELETE FROM watch_sessions WHERE watched_wallet = ?`, [walletAddress]);
      await db.run(`DELETE FROM transactions WHERE from_address = ? OR to_address = ?`, [walletAddress, walletAddress]);
      return res.json({ success: true, farcaster: true });
    } else {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="wally_data_${safeWallet}.pdf"`);
      res.send(pdfBuffer);
      await fs.unlink(pdfPath);
      await db.run(`DELETE FROM watch_sessions WHERE watched_wallet = ?`, [walletAddress]);
      await db.run(`DELETE FROM transactions WHERE from_address = ? OR to_address = ?`, [walletAddress, walletAddress]);
    }
  } catch (error) {
    console.error("[REVOKE ERROR]:", error);
    res.status(500).json({ error: "Failed to revoke and export user data." });
  } finally {
    // Ensure file is always deleted
    try { await fs.unlink(pdfPath); } catch (_) {}
  }
}