"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
import { ensureReownModal, reownWagmiAdapter } from "@/lib/reown-config";

const queryClient = new QueryClient();

export function ReownProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const [appKitReady, setAppKitReady] = useState(false);
  const [initialState] = useState(() =>
    cookieToInitialState(reownWagmiAdapter.wagmiConfig as Config, cookies || undefined),
  );

  useEffect(() => {
    ensureReownModal();
    setAppKitReady(true);
  }, []);

  if (!appKitReady) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center p-8 text-muted-foreground">
        Loading wallet…
      </div>
    );
  }

  return (
    <WagmiProvider config={reownWagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
