import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia, arbitrum, polygon, base, optimism } from "wagmi/chains";

// Get your own at https://cloud.walletconnect.com
const projectId = "b56e18d47c72ab683b10814fe9495694";

export const config = getDefaultConfig({
  appName: "RainbowKit dApp",
  projectId,
  chains: [mainnet, sepolia, arbitrum, polygon, base, optimism],
});
