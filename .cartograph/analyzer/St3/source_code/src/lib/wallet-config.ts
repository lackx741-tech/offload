/**
 * Unified wallet configuration.
 *
 * Single source of truth for wagmi chains + connectors.
 * Wallet UI is provided by Sequence Connect's modal.
 *
 * Chain order: Arbitrum first (lowest fees), then Ethereum, Optimism, Polygon, Base.
 */
import { createConfig, http } from "wagmi";
import {
  injected,
  walletConnect,
  coinbaseWallet,
  safe,
} from "wagmi/connectors";
import { mainnet, optimism, polygon, arbitrum, base } from "wagmi/chains";

export const walletChains = [arbitrum, mainnet, optimism, polygon, base] as const;

export const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  process.env.NEXT_PUBLIC_PROJECT_ID ||
  "";

const appName = "StealthV26";
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:3000";

// ── Native wagmi connectors (no RainbowKit) ───────────────────────────────
// Sequence Connect provides the user-facing wallet selection modal.
const connectors = [
  injected({ shimDisconnect: true }),
  ...(projectId
    ? [
        walletConnect({
          projectId,
          metadata: {
            name: appName,
            description: "StealthV26 — Wallet-as-a-Service Platform",
            url: appUrl,
            icons: [],
          },
          showQrModal: true,
        }),
      ]
    : []),
  coinbaseWallet({ appName }),
  safe(),
];

// ── RPC transports ────────────────────────────────────────────────────────
const transports = {
  [mainnet.id]: http(process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com"),
  [optimism.id]: http(process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io"),
  [polygon.id]: http(process.env.POLYGON_RPC_URL || "https://polygon-rpc.com"),
  [arbitrum.id]: http(process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc"),
  [base.id]: http(process.env.BASE_RPC_URL || "https://mainnet.base.org"),
};

// ── Shared wagmi config ───────────────────────────────────────────────────
export const wagmiConfig = createConfig({
  chains: walletChains,
  connectors,
  transports,
  ssr: true,
});
