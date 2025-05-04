import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fetchLogs } from "../api"; // Use your backend API abstraction

export default function ActivityLog({ sessionId }) {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setLogs([]);
      setError("No session selected.");
      return;
    }

    const getLogs = async () => {
      setLoading(true);
      try {
        const data = await fetchLogs(sessionId);
        if (data && Array.isArray(data.logs)) {
          setLogs(data.logs);
          setError(null);
        } else {
          setLogs([]);
          setError("Invalid log data.");
        }
      } catch (err) {
        setLogs([]);
        setError("Failed to fetch logs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    getLogs();
    const interval = setInterval(getLogs, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <div className="mt-6 p-4 bg-white dark:bg-zinc-800 rounded-xl shadow-md">
      <h3 className="text-lg font-bold mb-2">Activity Log</h3>
      {loading ? (
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full"></div>
          <p className="mt-2 text-gray-500">Loading logs...</p>
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center">
          <img
            src="/images/empty-state.svg"
            alt="No Activity"
            className="w-40 h-40 mb-4"
          />
          <p className="text-gray-500">No activity found. Start watching a wallet to see activity logs here.</p>
        </div>
      ) : (
        <ul className="space-y-2 text-sm">
          {logs.map((log) => (
            <li
              key={log.tx_hash + log.timestamp}
              className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded hover:shadow-lg transition-shadow"
            >
              <div><strong>Hash:</strong> <span className="text-blue-500">{log.tx_hash}</span></div>
              <div><strong>From:</strong> {log.from_address}</div>
              <div><strong>To:</strong> {log.to_address}</div>
              <div><strong>Token:</strong> {log.token_symbol || "N/A"}</div>
              <div><strong>Amount:</strong> {log.amount || "0"}</div>
              <div><strong>Time:</strong> {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}