import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { mainnet, optimism, polygon, arbitrum } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";

export const reownProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  process.env.NEXT_PUBLIC_PROJECT_ID ||
  "";

// Mainnets only — matches the v3 contracts deployed on Ethereum, Optimism,
// Polygon and Arbitrum One (see ProductionDeployment.supportedChainIds).
export const reownNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  optimism,
  polygon,
  arbitrum,
];

export const reownMetadata = {
  name: "StealthV26",
  description: "StealthV26 in-house wallet shell powered by Reown AppKit",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  icons: [
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/favicon.ico`,
  ],
};

export const reownWagmiAdapter = new WagmiAdapter({
  networks: reownNetworks,
  projectId: reownProjectId,
  ssr: true,
});

let reownModalInitialized = false;

export function ensureReownModal() {
  if (reownModalInitialized) return;
  createAppKit({
    adapters: [reownWagmiAdapter],
    networks: reownNetworks,
    projectId: reownProjectId,
    metadata: reownMetadata,
    features: {
      analytics: false,
    },
    themeMode: "dark",
    themeVariables: {
      "--w3m-accent": "#7C73FF",
      "--w3m-border-radius-master": "24px",
    },
  });
  reownModalInitialized = true;
}
