export async function wallyBatch({ contractAddress, calls, chainId }) {
  const res = await fetch("/api/wally/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contractAddress, calls, chainId })
  });
  return await res.json();
}