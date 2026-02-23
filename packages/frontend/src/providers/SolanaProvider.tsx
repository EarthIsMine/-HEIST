import React, { useMemo, useEffect } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

function ConnectingTimeout({ children }: { children: React.ReactNode }) {
  const { connecting, disconnect } = useWallet();

  useEffect(() => {
    if (!connecting) return;
    const timer = setTimeout(() => {
      disconnect();
    }, 10000);
    return () => clearTimeout(timer);
  }, [connecting, disconnect]);

  return <>{children}</>;
}

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(
    () => clusterApiUrl('devnet'),
    [],
  );

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ConnectingTimeout>{children}</ConnectingTimeout>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
