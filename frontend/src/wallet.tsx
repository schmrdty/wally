import { createAppKit } from "@reown/appkit/react";
import { arbitrum, mainnet, optimism, base, baseSepolia, degen, abstract, zora } from "@reown/appkit/networks";
import { Ethers5Adapter } from "@reown/appkit-adapter-ethers5";

// List of supported chains
const chains = [arbitrum, base, mainnet, optimism, baseSepolia, zora, degen, abstract];

// App metadata for ReOwn AppKit
const appMetadata = {
  name: "Wally the Wallet Watcher",
  description: "Token Forwarding as a Service",
  url: window.location.origin,
  icons: ["https://wally.schmidtiest.xyz/logo.png"],
};

// No secrets or env vars here! (ProjectId can be PUBLIC if required by the SDK, but never use your private keys or Alchemy keys here)
const appKitConfig = createAppKit({
  adapters: [new Ethers5Adapter()],
  networks: chains,
  metadata: appMetadata,
  // If projectId is required and not sensitive, you can use it here as a string. Otherwise, REMOVE it!
  features: {
    analytics: true,
  },
});

// SSR opt-out as before
export const walletConfig = {
  ...appKitConfig,
  _internal: {
    ssr: false,
  },
};