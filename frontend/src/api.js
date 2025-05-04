const API_URL = import.meta.env.VITE_API_URL; // Backend API endpoint, e.g. https://your-vps-domain/api

// General API request function
async function apiRequest(endpoint, method = "GET", body = null) {
  const url = `${API_URL}/${endpoint}`;
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "API error");
    }
    return data;
  } catch (error) {
    throw error;
  }
}

export function generateIdempotencyKey() {
  // browser-safe UUID
  return crypto.randomUUID();
}

export async function startWatching({ walletAddress, ...otherParams }) {
  const idempotencyKey = generateIdempotencyKey();
  const res = await fetch(`${process.env.VITE_API_URL}/start-watching`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ walletAddress, ...otherParams }),
  });
  return res.json();
}

// Start watching a wallet
export async function startWatching(watchedWallet, destinationWallet) {
  if (!watchedWallet || !destinationWallet)
    throw new Error("Both watched and destination wallets are required.");
  return apiRequest("watch", "POST", { watched: watchedWallet, destination: destinationWallet });
}

// Stop watching a wallet
export async function stopWatching(watchedWallet) {
  if (!watchedWallet)
    throw new Error("Wallet address is required.");
  return apiRequest("unwatch", "POST", { watched: watchedWallet });
}

// Fetch logs for a wallet (now from backend, not Alchemy)
export async function fetchLogs() {
  // If you want to filter by wallet, add a query param and implement filtering in backend
  return apiRequest("logs", "GET");
}

// Transfer funds (call backend, which does validation and (simulated) transfer)
export async function transferFunds(from, to, amount) {
  return apiRequest("transfer", "POST", { from, to, amount });
}

export async function revoke(walletAddress, farcasterFid = null) {
  if (!walletAddress) throw new Error("Wallet address is required for revoke.");
  const payload = { walletAddress };
  if (farcasterFid) payload.farcasterFid = farcasterFid;

  const res = await fetch(`${API_URL}/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // If Farcaster, expect JSON { success: true, farcaster: true }
  // If not, backend will return a PDF file as "application/pdf"
  if (farcasterFid) {
    const json = await res.json();
    if (!json.success) throw new Error("Revoke failed.");
    return json;
  } else {
    // Download the PDF file
    if (res.headers.get("content-type") === "application/pdf") {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `wally_data_${walletAddress}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } else {
      const err = await res.json();
      throw new Error(err.error || "Failed to download PDF.");
    }
  }
}