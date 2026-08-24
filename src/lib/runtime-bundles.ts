import type {
  AdvancedConfig,
  GeneralConfig,
  ModalConfig,
  TokensConfig,
  WalletConfig,
} from "@/lib/types";

type NonEvmBundleOptions = {
  general: GeneralConfig;
  wallet: WalletConfig;
  modal: ModalConfig;
  tokens: TokensConfig;
  advanced: AdvancedConfig;
  receiverAddress: string;
};

function createHeader(name: string, options: NonEvmBundleOptions) {
  return `/**
 * ${name} runtime scaffold
 * Generated: ${new Date().toISOString()}
 * Ecosystem: ${options.general.ecosystem}
 * Modal Framework: ${options.modal.modalFrameworkStyle}
 */`;
}

export function generateSolanaBundle(options: NonEvmBundleOptions): string {
  return `${createHeader("St3 Solana", options)}

const CONFIG = ${JSON.stringify(
    {
      ecosystem: options.general.ecosystem,
      cluster: options.general.solanaCluster,
      programId: options.general.solanaProgramId,
      rpcUrl: options.general.solanaRpcUrl,
      connectClass: options.general.connectButtonClass,
      actionClass: options.general.actionButtonClass,
      disconnectClass: options.general.disconnectButtonClass,
      connectText: options.general.connectText,
      visibleChains: options.tokens.visibleChains,
    },
    null,
    2,
  )};

function log(event, data) {
  console.log("[St3 Solana]", event, data || {});
}

export async function connectSolanaWallet() {
  log("connect_requested", {
    wallets: ["Phantom", "Solflare", "Backpack"],
    cluster: CONFIG.cluster,
    rpcUrl: CONFIG.rpcUrl || "default cluster RPC",
  });
  throw new Error("Solana runtime scaffold only. Wire @solana/wallet-adapter and your instruction builder here.");
}

export async function signSolanaMessage(message) {
  log("sign_message_requested", { message });
  throw new Error("Solana runtime scaffold only. Implement wallet adapter signing here.");
}

export async function sendSolanaTransaction(instructions) {
  log("send_transaction_requested", { instructions });
  throw new Error("Solana runtime scaffold only. Implement transaction construction and send here.");
}

export function mountConnectButton() {
  document.querySelectorAll(CONFIG.connectClass).forEach((element) => {
    element.addEventListener("click", () => {
      void connectSolanaWallet();
    });
  });
}

mountConnectButton();
`;
}

export function generateTronBundle(options: NonEvmBundleOptions): string {
  return `${createHeader("St3 Tron", options)}

const CONFIG = ${JSON.stringify(
    {
      ecosystem: options.general.ecosystem,
      network: options.general.tronNetwork,
      contractAddress: options.general.tronContractAddress,
      rpcUrl: options.general.tronRpcUrl,
      connectClass: options.general.connectButtonClass,
      actionClass: options.general.actionButtonClass,
      disconnectClass: options.general.disconnectButtonClass,
      connectText: options.general.connectText,
      receiver: options.receiverAddress,
    },
    null,
    2,
  )};

function log(event, data) {
  console.log("[St3 Tron]", event, data || {});
}

export async function connectTronWallet() {
  log("connect_requested", {
    provider: "TronLink",
    network: CONFIG.network,
    rpcUrl: CONFIG.rpcUrl || "default Tron RPC",
  });
  throw new Error("Tron runtime scaffold only. Wire TronWeb / TronLink provider connection here.");
}

export async function callTronContract(payload) {
  log("contract_call_requested", payload);
  throw new Error("Tron runtime scaffold only. Implement Tron contract invocation here.");
}

export function mountConnectButton() {
  document.querySelectorAll(CONFIG.connectClass).forEach((element) => {
    element.addEventListener("click", () => {
      void connectTronWallet();
    });
  });
}

mountConnectButton();
`;
}
