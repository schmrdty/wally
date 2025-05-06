export async function wallyTransfer({ contractAddress, token, to, amount, chainId }) {
  const res = await fetch("/api/wally/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contractAddress, token, to, amount, chainId })
  });
  return await res.json();
}

export async function wallyBatch({ contractAddress, calls, chainId }) {
  const res = await fetch("/api/wally/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contractAddress, calls, chainId })
  });
  return await res.json();
}