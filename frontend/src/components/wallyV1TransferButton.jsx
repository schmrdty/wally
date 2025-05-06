import React, { useState } from "react";
import { wallyTransfer } from "../api/wallyv1"; // Make sure the API points to /api/wallyv1/transfer

export function WallyV1TransferButton({ contractAddress, token, to, amount, chainId }) {
  const [error, setError] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [min, setMin] = useState(""); // For user input if threshold needs update

  const executeTransfer = async (gasless = true) => {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await wallyTransfer({
        contractAddress,
        token,
        to,
        amount,
        gasless,
        chainId
      });
      if (res.error && res.error.toLowerCase().includes("below threshold")) {
        setError(
          "Gasless transfer is currently unavailable, please try updating the native token minimum balance and try again."
        );
      } else if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || "Unknown error");
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleRetry = async () => {
    // Call backend to update threshold before retry (implement /api/wallyv1/setMinNativeThreshold)
    await fetch("/api/wallyv1/setMinNativeThreshold", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ min })
    });
    await executeTransfer(false); // Retry as paid transfer if gasless failed
  };

  return (
    <div>
      <button onClick={() => executeTransfer(true)} disabled={isLoading}>
        {isLoading ? "Transferring..." : "Transfer (Try Gasless)"}
      </button>
      {error && (
        <div>
          <p style={{ color: "red" }}>{error}</p>
          <input
            type="number"
            placeholder="New Minimum"
            value={min}
            onChange={e => setMin(e.target.value)}
          />
          <button onClick={handleRetry}>Update Minimum & Retry</button>
        </div>
      )}
      {success && <p style={{ color: "green" }}>Transfer successful!</p>}
    </div>
  );
}