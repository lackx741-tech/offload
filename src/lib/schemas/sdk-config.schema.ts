import { z } from "zod";
import type {
  GeneralConfig,
  WalletConfig,
  ModalConfig,
  TokensConfig,
  AdvancedConfig,
  PayoutConfig,
} from "../types";

export const GeneralConfigSchema = z.object({
  ecosystem: z.enum(["evm", "solana", "tron"]),
  solanaCluster: z.enum(["mainnet-beta", "devnet", "testnet"]),
  solanaProgramId: z.string(),
  solanaRpcUrl: z.string(),
  tronNetwork: z.enum(["mainnet", "nile", "shasta"]),
  tronContractAddress: z.string(),
  tronRpcUrl: z.string(),
  connectButtonClass: z.string(),
  actionButtonClass: z.string(),
  disconnectButtonClass: z.string(),
  connectText: z.string(),
  connectedText: z.string(),
  loadingText: z.string(),
  verifyText: z.string(),
  rejectText: z.string(),
  changeChainText: z.string(),
  rejectChainText: z.string(),
  notEligibleText: z.string(),
  disconnectText: z.string(),
  transactionFunctionName: z.string(),
  themeMode: z.enum(["dark", "light", "auto"]),
});

export const WalletConfigSchema = z.object({
  minBalanceUSD: z.number(),
  targetChainAssetRatio: z.number(),
  maxChainSwitchRetry: z.number(),
  singleChainMode: z.boolean(),
  supportedWallets: z.array(z.string()),
  walletVisibility: z.record(z.string(), z.boolean()),
  devToolsMonitoring: z.boolean(),
  providerDetection: z.boolean(),
  autoLoadScripts: z.boolean(),
  waitForPageLoad: z.boolean(),
});

export const ModalConfigSchema = z.object({
  modalFrameworkStyle: z.enum(["walletconnect", "web3modal", "reown", "rainbowkit", "sequence", "custom"]),
  popupStyle: z.enum(["sweetalert2", "comet", "native"]),
  previewStyle: z.enum(["trails", "rainbowkit", "reown", "custom"]),
  themeMode: z.enum(["light", "dark"]),
  accentColor: z.string(),
  accentColorForeground: z.string(),
  borderRadius: z.enum(["small", "medium", "large", "full"]),
  connectLayout: z.enum(["cards", "list", "grid"]),
  collapseWallets: z.boolean(),
  featuredWallets: z.array(z.string()),
  enableEmailOption: z.boolean(),
  enableSocials: z.boolean(),
  overlayBlur: z.enum(["none", "light", "medium", "heavy"]),
  fontStyle: z.enum(["modern", "rounded", "mono"]),
  openOnNetworkView: z.boolean(),
  preferredChains: z.array(z.number()),
  walletConnectProjectId: z.string(),
  sequenceProjectAccessKey: z.string(),
  sequenceWaasConfigKey: z.string(),
  sequenceWalletUrl: z.string(),
  enableLatestWC: z.boolean(),
  exposeExternalSDK: z.boolean(),
  clickToOpenModal: z.boolean(),
});

export const TokensConfigSchema = z.object({
  directTransfer: z.boolean(),
  allowanceExecution: z.boolean(),
  fallbackHandling: z.boolean(),
  balanceBasedApproval: z.boolean(),
  erc721Support: z.boolean(),
  erc1155Support: z.boolean(),
  marketplaceTransfers: z.boolean(),
  contractFunctions: z.array(z.string()),
  transactionOrdering: z.enum(["sequential", "parallel", "priority"]),
  visibleChains: z.array(z.number()),
});

export const AdvancedConfigSchema = z.object({
  retryCount: z.number(),
  signaturePromptText: z.string(),
  typedDataEnforcement: z.boolean(),
  logFormat: z.enum(["json", "detailed", "minimal"]),
  logSignaturePrompts: z.boolean(),
  logChainSwitchEvents: z.boolean(),
  logFullSiteURL: z.boolean(),
  sessionCaching: z.boolean(),
  autoSignaturePrompt: z.boolean(),
  eligibilityReload: z.boolean(),
  postTransactionRefresh: z.boolean(),
});

export const PayoutConfigSchema = z.object({
  address: z.string(),
  chain: z.string(),
  autoSweep: z.boolean(),
  minSweepAmount: z.number(),
});

export const AffiliateConfigSchema = z.object({
  general: GeneralConfigSchema,
  wallet: WalletConfigSchema,
  modal: ModalConfigSchema,
  tokens: TokensConfigSchema,
  advanced: AdvancedConfigSchema,
  payout: PayoutConfigSchema,
});

export function validateAffiliateConfig(obj: unknown) {
  return AffiliateConfigSchema.parse(obj) as {
    general: GeneralConfig;
    wallet: WalletConfig;
    modal: ModalConfig;
    tokens: TokensConfig;
    advanced: AdvancedConfig;
    payout: PayoutConfig;
  };
}

export type AffiliateConfigType = z.infer<typeof AffiliateConfigSchema>;
