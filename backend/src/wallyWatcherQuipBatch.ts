import { QuipEthereum, QuipABI } from "@quipus/ethereum-sdk";
import { ethers } from "ethers";

// Assuming your WallyWatcherV2 has a batch/multicall function
const WALLY_BATCH_ABI = [
  QuipABI.pqFunction("batch", ["bytes[]"], "void"),
];

// Prepare multiple encoded function calls
async function batchWallyActions({
  contractAddress,
  calls, // array of {functionName, args}
  chainId
}: {
  contractAddress: string;
  calls: { functionName: string; args: any[] }[];
  chainId: number;
}) {
  const iface = new ethers.utils.Interface(WALLY_BATCH_ABI as any);

  // For each call, encode using the main ABI
  const mainIface = new ethers.utils.Interface([
    QuipABI.pqFunction("setMinBalance", ["uint256"], "void"),
    QuipABI.pqFunction("performTransfer", ["address", "uint256"], "void"),
    // ...add more as needed
  ] as any);
  const callData = calls.map(call =>
    mainIface.encodeFunctionData(call.functionName, call.args)
  );

  const data = iface.encodeFunctionData("batch", [callData]);
  const tx = {
    to: contractAddress,
    data,
    value: "0x0",
    gasLimit: "0x100000", // adjust as needed
    chainId
  };
  return await quip.sendTransaction(tx);
}