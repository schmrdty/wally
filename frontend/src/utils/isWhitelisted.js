import { ethers } from "ethers";
import ERC20_ABI from "./ERC20_ABI.json"; // Standard ERC20 ABI

export async function isWhitelisted(provider, whitelistToken, user, minBalance) {
  const erc20 = new ethers.Contract(whitelistToken, ERC20_ABI, provider);
  const balance = await erc20.balanceOf(user);
  return ethers.BigNumber.from(balance).gte(ethers.BigNumber.from(minBalance));
}