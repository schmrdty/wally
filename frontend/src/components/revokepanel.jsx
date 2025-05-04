import { useState } from "react";
import { revokeUserData } from "../api";

export default function RevokePanel({ connectedWallet, farcasterFid }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRevoke = async () => {
    if (!connectedWallet) {
      setStatus({ type: "error", message: "Please connect your wallet." });
      return;
    }
    setStatus(null);
    setLoading(true);

    try {
      const result = await revokeUserData(connectedWallet, farcasterFid);
      if (result && result.farcaster) {
        setStatus({ type: "success", message: "Your data was sent to you via Warpcast direct cast and deleted." });
      } else if (result && result.pdfDownloaded) {
        setStatus({ type: "success", message: "Your data was downloaded as a PDF and deleted." });
      } else {
        setStatus({ type: "success", message: "Your data was processed for revoke." });
      }
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Failed to revoke and export user data." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-xl bg-white dark:bg-zinc-900 shadow mt-4">
      <h2 className="text-lg font-bold mb-2">Revoke & Export Data</h2>
      <p className="mb-2 text-sm text-gray-600">
        Export your activity and erase all your data from Wally. 
        {farcasterFid
          ? " Your Farcaster account will receive a direct PDF via Warpcast."
          : " You will download a PDF of your data."}
      </p>
      <button
        className={`px-4 py-2 rounded shadow text-white ${
          loading ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
        }`}
        disabled={loading}
        onClick={handleRevoke}
      >
        {loading ? "Processing..." : "Revoke & Export"}
      </button>
      {status && (
        <div
          className={`mt-4 p-2 rounded text-sm ${
            status.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}