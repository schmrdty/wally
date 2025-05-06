import { useState } from "react";
import { useWriteContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contract.js";

export function SetThresholdButton({ tokenAddress }) {
  const [threshold, setThreshold] = useState("");
  const { write, isLoading, isSuccess } = useWriteContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "setMinBalance", // or setMinTokenBalance for ERC20
    args: tokenAddress
      ? [tokenAddress, threshold] // for ERC20: function setMinTokenBalance(address token, uint256 min)
      : [threshold], // for native: function setMinBalance(uint256 min)
  });

  return (
    <div>
      <input
        type="number"
        placeholder="Min balance"
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