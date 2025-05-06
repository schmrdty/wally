import { useState } from "react";
import { useWriteContract } from "wagmi"; // or useContractWrite

import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contract.js";

export function SetThresholdButton() {
  const [threshold, setThreshold] = useState("");
  const { write, isLoading, isSuccess } = useWriteContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "setMinBalance",
    args: [threshold],
  });

  return (
    <div>
      <input
        type="number"
        placeholder="Min balance (ETH, e.g. 0.01)"
        value={threshold}
        onChange={e => setThreshold(e.target.value)}
      />
      <button onClick={() => write()} disabled={isLoading || !threshold}>
        Set Min Balance
      </button>
      {isSuccess && <span>Threshold set!</span>}
    </div>
  );
}