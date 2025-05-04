import React, { useState, useEffect } from 'react';
import { config } from './wagmiConfig';
import { WagmiProvider, useAccount } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthKitProvider, SignInButton } from '@farcaster/auth-kit';
import { sdk } from "@farcaster/frame-sdk";
import { useFarcasterEvents } from "./useFarcasterEvents";

import { FARCASTER_CONFIG } from './config';
import { walletConfig } from './wallet';
import activitylog from './components/activitylog';
import approvalpanel from './components/approvalpanel';
import sharebuttons from './components/sharebuttons';
import tokentransferui from './components/tokentransferui';
import revokepanel from './components/revokepanel';
import { fetchLogs, startWatching, stopWatching, transferFunds } from './api';

import '@farcaster/auth-kit/styles.css';

const queryClient = new QueryClient();

export default function App() {
  const { address: connectedWallet, isConnected } = useAccount();
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  useFarcasterEvents();

  useEffect(() => {
    // Call ready as soon as your main UI is ready (after loading state, wallet connected, etc.)
    sdk.actions.ready();
  }, []);
  
  // Fetch logs periodically from backend
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      fetchLogs()
        .then(setLogs)
        .catch((err) => setError(`[FETCH LOGS ERROR]: ${err.message}`));
    }, 10000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Add a fallback for loading state
  if (!isConnected) {
    return <p>Loading...</p>;
  }

  // Pass backend API actions as props to UI components
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={walletConfig}>
        <AuthKitProvider config={FARCASTER_CONFIG}>
          <div className="p-4 min-h-screen bg-gray-950 text-white">
            <h1 className="text-3xl font-bold mb-4">🔍 Wally the Wallet Watcher</h1>
            <div style={{ position: 'fixed', top: '12px', right: '12px' }}>
              <SignInButton />
            </div>
            {isConnected ? (
              <>
                <activitylog logs={logs} />
                <approvalpanel 
                  onWatch={startWatching} 
                  onUnwatch={stopWatching} 
                />
                <tokentransferui 
                  onTransfer={transferFunds} 
                />
                <sharebuttons />
              </>
              <RevokePanel connectedWallet={connectedWallet} farcasterFid={farcasterFid} />
            ) : (
              <p>Please connect your wallet to see activity logs.</p>
            )}
          </div>
        </AuthKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}