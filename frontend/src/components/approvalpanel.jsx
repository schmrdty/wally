import React, { useState } from "react";
import { ethers } from "ethers";
import { startWatching, stopWatching } from "../api";

export default function ApprovalPanel({ connectedWallet }) {
  const [destination, setDestination] = useState("");
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  function isValidEthereumAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  const handleStartWatching = async () => {
    if (!connectedWallet || !destination) {
      setStatus("Please connect a wallet and provide a destination address.");
      return;
    }
    if (!isValidEthereumAddress(destination)) {
      setStatus("Invalid Ethereum address for the destination.");
      return;
    }
    setStatus("Sending approval...");
    setIsLoading(true);
    try {
      const res = await startWatching(connectedWallet, destination);
      setStatus(res.message || "Approval granted and watching started!");
    } catch (err) {
      setStatus(err.message || "Failed to start watching.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopWatching = async () => {
    if (!connectedWallet) {
      setStatus("Please connect a wallet first.");
      return;
    }
    setStatus("Revoking approval and stopping watcher...");
    setIsLoading(true);
    try {
      const res = await stopWatching(connectedWallet);
      setStatus(res.message || "Approval revoked and watcher stopped.");
    } catch (err) {
      setStatus(err.message || "Failed to stop watching.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-xl bg-white dark:bg-zinc-900 shadow">
      <h2 className="text-lg font-bold mb-2">Approval Panel</h2>
      <div className="mb-4">
        {connectedWallet ? (
          <div>
            <p>Connected Wallet: {connectedWallet}</p>
          </div>
        ) : (
          <p>Please connect a wallet to use this feature.</p>
        )}
      </div>
      <input
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Enter Destination Wallet Address"
        className="w-full mb-2 p-2 border rounded"
        disabled={isLoading}
      />
      {!isValidEthereumAddress(destination) && destination !== "" && (
        <p className="text-red-500 text-sm">Invalid Ethereum address.</p>
      )}
      <div className="flex space-x-4">
        <button
          onClick={handleStartWatching}
          className={`px-4 py-2 rounded shadow text-white ${
            isLoading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Start Watching"}
        </button>
        <button
          onClick={handleStopWatching}
          className={`px-4 py-2 rounded shadow text-white ${
            isLoading ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Stop Watching"}
        </button>
      </div>
      {status && (
        <div
          className={`mt-4 p-2 rounded text-sm ${
            status.toLowerCase().includes("error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {status}
        </div>
      )}
    </div>
  );
}