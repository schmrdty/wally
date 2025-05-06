import db from "./db.js";

// GET /log?sessionId=...
export async function getLogs(req, res) {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }
  try {
    const logs = await db.all(
      `SELECT * FROM transactions WHERE session_id = ? ORDER BY timestamp DESC LIMIT 100`,
      [sessionId]
    );
    res.json({ logs });
  } catch (err) {
    console.error("[FETCH LOGS ERROR]:", err);
    res.status(500).json({ error: "Failed to fetch logs." });
  }
}