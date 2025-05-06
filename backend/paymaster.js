import { AlchemySmartAccountClient } from '@alchemy/aa-core';
import { createPaymasterClient } from '@alchemy/aa-backend';

const alchemyApiKey = process.env.ALCHEMY_API_KEY; // from .env
const paymasterUrl = process.env.ALCHEMY_PAYMASTER_URL; // from dashboard

export const smartAccountClient = new AlchemySmartAccountClient({
  chainId: 84532, // Base Sepolia
  rpcUrl: `https://base-sepolia.g.alchemy.com/v2/${alchemyApiKey}`,
  paymasterClient: createPaymasterClient({ url: paymasterUrl }),
});