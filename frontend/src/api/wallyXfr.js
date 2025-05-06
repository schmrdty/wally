export async function wallyTransfer({ contractAddress, token, to, amount, chainId }) {
  const res = await fetch("/api/wally/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contractAddress, token, to, amount, chainId })
  });
  return await res.json();
}