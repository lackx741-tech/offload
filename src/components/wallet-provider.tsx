"use client";

/**
 * WalletProvider
 *
 * Provider stack:
 *   wagmi (MetaMask, WalletConnect, Coinbase Wallet, Safe, Injected)
 *   → TanStack Query
 */

import { type ReactNode, useMemo } from "react";
import { WagmiProvider, cookieToInitialState, type Config } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wallet-config";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 } },
});

export function WalletProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies?: string | null;
}) {
  const initialState = useMemo(
    () => cookieToInitialState(wagmiConfig as Config, cookies || undefined),
    [cookies],
  );

  return (
    <WagmiProvider config={wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
