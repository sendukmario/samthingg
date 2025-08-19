"use client";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { useMemo } from "react";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";

export function SolanaProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const solNetwork = WalletAdapterNetwork.Mainnet;
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  const endpoint = useMemo(() => {
    // return "http://45.152.160.38:9999";
    return "https://mainnet.helius-rpc.com/?api-key=0f803376-0189-4d72-95f6-a5f41cef157d";
    // return "https://api.devnet.solana.com";
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
