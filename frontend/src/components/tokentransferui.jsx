import { useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { startWatching, stopWatching } from "../api";

export default function TokenTransferUI({ sessionId, onSessionChange }) {
  const { address, isConnected } = useAccount();
  const [destination, setDestination] = useState("");
  const [warpcastFid, setWarpcastFid] = useState("");
  const [status, setStatus] = useState(null);
  const [tokenAddresses, setTokenAddresses] = useState([""]);
  const [minimumBalance, setMinimumBalance] = useState("");
  const [transferMode, setTransferMode] = useState("minimum");

  function isValidEthereumAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  const handleAddTokenAddress = () => {
    setTokenAddresses([...tokenAddresses, ""]);
  };

  const handleStart = async () => {
    if (!isConnected) {
      setStatus({ type: "error", message: "Please connect your wallet first." });
      return;
    }
    if (!destination) {
      setStatus({ type: "error", message: "Destination Wallet is required." });
      return;
    }
    if (!isValidEthereumAddress(destination)) {
      setStatus({ type: "error", message: "Invalid Ethereum address for Destination Wallet." });
      return;
    }
    setStatus({ type: "loading", message: "Starting wallet watcher..." });

    try {
      const response = await startWatching(
        address,
        destination,
        warpcastFid,
        tokenAddresses.filter(t => isValidEthereumAddress(t)),
        transferMode,
        minimumBalance
      );
      if (response.sessionId) {
        onSessionChange && onSessionChange(response.sessionId);
        setStatus({ type: "success", message: "Wallet watching started successfully!" });
      } else {
        setStatus({ type: "error", message: response.error || "Failed to start watching." });
      }
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Failed to start watching. Please try again." });
    }
  };

  const handleStop = async () => {
    if (!sessionId) {
      setStatus({ type: "error", message: "No active session to stop." });
      return;
    }
    setStatus({ type: "loading", message: "Stopping wallet watcher..." });
    try {
      await stopWatching(address);
      setStatus({ type: "success", message: "Wallet watching stopped successfully!" });
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Failed to stop watching. Please try again." });
    }
  };

  return (
    <div className="p-4 border rounded-xl bg-white dark:bg-zinc-900 shadow">
      <h2 className="text-lg font-bold mb-2">Wallet Watching Configuration</h2>
      {!isConnected ? (
        <p className="text-red-500 text-sm">Please connect your wallet to use this feature.</p>
      ) : (
        <>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Destination Wallet:</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter a valid Ethereum address"
            />
            {!isValidEthereumAddress(destination) && destination !== "" && (
              <p className="text-red-500 text-xs mt-1">Invalid Ethereum address.</p>
            )}
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Warpcast FID (Optional):</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={warpcastFid}
              onChange={(e) => setWarpcastFid(e.target.value)}
              placeholder="Only required for gas sponsorship"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Token Addresses:</label>
            {tokenAddresses.map((token, index) => (
              <input
                key={index}
                type="text"
                className="w-full p-2 border rounded mb-1"
                value={token}
                onChange={(e) => {
                  const updatedTokens = [...tokenAddresses];
                  updatedTokens[index] = e.target.value;
                  setTokenAddresses(updatedTokens);
                }}
                placeholder="Enter token contract address"
              />
            ))}
            <button
              onClick={handleAddTokenAddress}
              className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
            >
              Add Token
            </button>
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Transfer Mode:</label>
            <select
              className="w-full p-2 border rounded"
              value={transferMode}
              onChange={(e) => setTransferMode(e.target.value)}
            >
              <option value="minimum">Minimum Balance</option>
              <option value="zeroOut">Zero Out</option>
            </select>
            {transferMode === "zeroOut" && (
              <p className="text-red-500 text-xs mt-1">Note: Gas fees in native token may be required for transfers.</p>
            )}
          </div>
          {transferMode === "minimum" && (
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Minimum Balance:</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={minimumBalance}
                onChange={(e) => setMinimumBalance(e.target.value)}
                placeholder="Enter minimum balance threshold"
              />
            </div>
          )}
          <button
            className={`w-full py-2 rounded mb-2 ${
              status?.type === "loading" ? "bg-gray-400 text-gray-700" : "bg-blue-500 text-white"
            }`}
            onClick={handleStart}
            disabled={status?.type === "loading"}
          >
            {status?.type === "loading" ? "Starting..." : "Start Watching"}
          </button>
          <button
            className={`w-full py-2 rounded ${
              sessionId ? "bg-red-500 text-white" : "bg-gray-500 text-gray-200"
            }`}
            onClick={handleStop}
            disabled={!sessionId || status?.type === "loading"}
          >
            {status?.type === "loading" ? "Stopping..." : "Stop Watching"}
          </button>
          {status && (
            <div
              className={`mt-2 p-2 rounded text-sm ${
                status.type === "success"
                  ? "bg-green-100 text-green-700"
                  : status.type === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {status.message}
            </div>
          )}
        </>
      )}
    </div>
  );
}