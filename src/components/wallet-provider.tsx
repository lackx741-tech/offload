"use client";

/**
 * WalletProvider
 *
 * Provider stack:
 *   wagmi (shared config with native connectors: injected, WalletConnect,
 *          Coinbase Wallet, Safe)
 *   → Sequence Connect (WaaS smart-wallet layer + connect modal)
 *   → TanStack Query
 *
 * Sequence Connect provides the user-facing wallet selection modal —
 * no RainbowKit needed.
 */

import { type ReactNode, useMemo } from "react";
import { WagmiProvider, cookieToInitialState, type Config } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SequenceConnect, type ConnectConfig } from "@0xsequence/connect";
import { buildSequenceWaasConfig } from "@/lib/sequence-config";
import { wagmiConfig, projectId } from "@/lib/wallet-config";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 } },
});

// ── Sequence WaaS config ──────────────────────────────────────────────────
const rawCfg = buildSequenceWaasConfig({
  walletConnectProjectId: projectId || undefined,
});

// Build a typed ConnectConfig from the raw config (only known ConnectConfig fields)
const connectConfig: ConnectConfig = {
  projectAccessKey: rawCfg.projectAccessKey,
  waasConfigKey: rawCfg.waasConfigKey,
  chainIds: [...rawCfg.chainIds],
  defaultChainId: rawCfg.defaultChainId,
  signIn: rawCfg.signIn,
  position: rawCfg.position,
  defaultTheme: rawCfg.defaultTheme,
  renderInline: rawCfg.renderInline,
};

// SequenceConnectConfig shape (not exported from root — cast via unknown)
const sequenceCfg = {
  wagmiConfig: wagmiConfig as Config,
  connectConfig,
} as unknown as Parameters<typeof SequenceConnect>[0]["config"];

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
        <SequenceConnect config={sequenceCfg}>
          {children}
        </SequenceConnect>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
