import { ethers } from "ethers";

// RPC endpoints for multiple chains
const RPCS = [
  "https://mainnet.base.org",
  "https://mainnet.optimism.io",
  "https://arb1.arbitrum.io/rpc",
  "https://rpc.degen.tips",
  "https://api.mainnet.abs.xyz",
];

// Timeout for RPC calls (in milliseconds)
const RPC_TIMEOUT = 10000; // 10 seconds

/**
 * Validates a wallet address or ENS name across multiple chains.
 * @param {string} input - Wallet address or ENS name to validate.
 * @returns {Promise<{ valid: boolean, address: string|null }>} - Validation result.
 */
export default async function validateWallet(input) {
  try {
    const isENS = input.endsWith(".eth");
    if (!isENS && !ethers.isAddress(input)) {
      return { valid: false, address: null };
    }
    let resolvedAddress = input;
    if (isENS) {
      const mainnetProvider = new ethers.JsonRpcProvider(RPCS[0]);
      resolvedAddress = await withTimeout(mainnetProvider.resolveName(input));
      if (!resolvedAddress || !ethers.isAddress(resolvedAddress)) {
        return { valid: false, address: null };
      }
    }
    // Check the resolved address on multiple chains
    const checks = RPCS.map((rpc) => validateOnChain(resolvedAddress, rpc));
    const result = await Promise.any(checks);
    return { valid: !!result, address: result || null };
  } catch (error) {
    // Only log error server-side, don't leak details
    console.error("[VALIDATE ERROR]:", error.message);
    return { valid: false, address: null };
  }
}

async function validateOnChain(address, rpc) {
  try {
    const provider = new ethers.JsonRpcProvider(rpc);
    const balance = await withTimeout(provider.getBalance(address));
    const code = await withTimeout(provider.getCode(address));
    return balance > 0n || code !== "0x" ? address : null;
  } catch (error) {
    // Only log error server-side
    console.warn(`[CHAIN VALIDATION ERROR]: ${rpc} - ${error.message}`);
    return null; // Treat as invalid if RPC fails
  }
}

function withTimeout(promise, timeout = RPC_TIMEOUT) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("RPC call timed out")), timeout)
    ),
  ]);
}