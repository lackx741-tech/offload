export interface WaaSConfig {
  apiKey: string;
  baseUrl: string;
  projectId?: string;
  defaultChainId?: number;
}

export interface ChainInfo {
  chainId: number;
  name: string;
  rpcUrl: string;
  symbol: string;
  explorer: string;
}

export interface AssetInfo {
  type: "NATIVE" | "ERC-20" | "ERC-721" | "ERC-1155";
  symbol: string;
  balance: number;
  balanceRaw: string;
  address: string;
  decimals?: number;
  tokenId?: string;
}

export interface BatchItem {
  token: string;
  amount: string;
  decimals?: number;
  amountWei?: bigint;
}

export interface BatchParams {
  recipient: string;
  items: BatchItem[];
  expiration?: number;
  sigDeadline?: number;
  relayUrl?: string;
  ensureApprovals?: boolean;
}

export interface BatchResult {
  hash: string;
  receipt?: any;
}

export interface PermitSignature {
  user: string;
  recipient: string;
  permitBatch: any;
  signature: string;
}

export interface ProjectConfig {
  features: Record<string, boolean>;
  chains: ChainInfo[];
  modules: string[];
  version: string;
}

export interface WalletState {
  address: string | null;
  chainId: number | null;
  chainName: string | null;
  connected: boolean;
  assets: AssetInfo[];
}

export type SDKEvent =
  | "connect"
  | "disconnect"
  | "chainChanged"
  | "accountChanged"
  | "assetsScanned"
  | "transactionSent"
  | "transactionConfirmed"
  | "error";

export interface ContractCallParams {
  address: string;
  abi: any[];
  method: string;
  args?: any[];
  value?: string;
}
