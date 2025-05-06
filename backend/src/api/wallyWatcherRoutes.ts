import express from "express";
import { QuipEthereum, QuipABI } from "@quipus/ethereum-sdk";
import { ethers } from "ethers";

const router = express.Router();

// Quip init
const quip = new QuipEthereum({
  vaultId: process.env.QUIP_VAULT_ID!,
  apiKey: process.env.QUIP_API_KEY!,
});

const WALLY_ABI = [
  QuipABI.pqFunction("performTransfer", ["address", "address", "uint256"], "void"),
  QuipABI.pqFunction("batch", ["bytes[]"], "void"),
];

// POST /api/wally/transfer
router.post("/transfer", async (req, res) => {
  try {
    const { contractAddress, token, to, amount, chainId } = req.body;
    const iface = new ethers.utils.Interface(WALLY_ABI as any);
    const data = iface.encodeFunctionData("performTransfer", [token, to, amount]);
    const tx = {
      to: contractAddress,
      data,
      value: "0x0",
      gasLimit: "0x100000",
      chainId,
    };
    const result = await quip.sendTransaction(tx);
    res.json({ success: true, tx: result });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/wally/batch
router.post("/batch", async (req, res) => {
  try {
    const { contractAddress, calls, chainId } = req.body;
    // calls: [{functionName, args}]
    const mainIface = new ethers.utils.Interface(WALLY_ABI as any);
    const callDatas = calls.map((call: any) =>
      mainIface.encodeFunctionData(call.functionName, call.args)
    );
    const batchIface = new ethers.utils.Interface([
      QuipABI.pqFunction("batch", ["bytes[]"], "void"),
    ]);
    const data = batchIface.encodeFunctionData("batch", [callDatas]);
    const tx = {
      to: contractAddress,
      data,
      value: "0x0",
      gasLimit: "0x200000",
      chainId,
    };
    const result = await quip.sendTransaction(tx);
    res.json({ success: true, tx: result });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;