// ============================================================
//  CUSTOM WALLET MODAL — Light theme, raw wallet detection
//  No Reown SDK. Uses EIP-6963 + window.ethereum directly.
//  Edit onConnected() to run your own script after connect.
// ============================================================

// ─── YOUR CUSTOM SCRIPT — runs after wallet connects ─────────
async function onConnected({ address, chainId, provider }) {
  console.log("✅ Connected:", address, "chain:", chainId);
  document.getElementById("status").textContent =
    `✅ Connected\nAddress: ${address}\nChain: ${chainId}`;
  // TODO: Add your own logic here
  // const signer = await provider.getSigner();
  // await signer.signMessage("hello");
}

async function onDisconnected() {
  console.log("Disconnected");
  document.getElementById("status").textContent = "Disconnected.";
}

// ─── WALLET DETECTION (EIP-6963) ─────────────────────────────
const detectedWallets = [];

const KNOWN_WALLETS = [
  { rdns: "io.metamask", name: "MetaMask", icon: "🦊" },
  { rdns: "com.okex.wallet", name: "OKX Wallet", icon: "⬛" },
  { rdns: "com.ambire.wallet", name: "Ambire", icon: "⚡" },
  { rdns: "com.coinbase.wallet", name: "Coinbase Wallet", icon: "🔵" },
  { rdns: "com.trustwallet.app", name: "Trust Wallet", icon: "🛡️" },
  { rdns: "io.rabby", name: "Rabby", icon: "🐰" },
  { rdns: "app.phantom", name: "Phantom", icon: "👻" },
  { rdns: "com.brave.wallet", name: "Brave Wallet", icon: "🦁" },
];

// Listen for EIP-6963 wallet announcements
window.addEventListener("eip6963:announceProvider", (e) => {
  const { info, provider } = e.detail;
  if (!detectedWallets.find(w => w.info.rdns === info.rdns)) {
    detectedWallets.push({ info, provider });
    renderModal();
  }
});
window.dispatchEvent(new Event("eip6963:requestProvider"));

// Fallback: check window.ethereum
setTimeout(() => {
  if (window.ethereum && detectedWallets.length === 0) {
    detectedWallets.push({
      info: { rdns: "browser", name: "Browser Wallet", icon: "" },
      provider: window.ethereum,
    });
    renderModal();
  }
}, 500);

// ─── MODAL UI ────────────────────────────────────────────────
let modalEl = null;
let overlayEl = null;

function injectModalStyles() {
  if (document.getElementById("cwm-styles")) return;
  const s = document.createElement("style");
  s.id = "cwm-styles";
  s.textContent = `
    .cwm-overlay {
      position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99998;
      display:flex;align-items:center;justify-content:center;
      opacity:0;transition:opacity 0.2s;pointer-events:none;
    }
    .cwm-overlay.open { opacity:1;pointer-events:auto; }
    .cwm-modal {
      background:#fff;border-radius:20px;width:360px;max-height:80vh;
      overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);
      transform:scale(0.95);transition:transform 0.25s cubic-bezier(0.16,1,0.3,1);
      color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    }
    .cwm-overlay.open .cwm-modal { transform:scale(1); }
    .cwm-header {
      display:flex;justify-content:space-between;align-items:center;
      padding:20px 24px 12px;
    }
    .cwm-header h2 { font-size:1.1rem;font-weight:700; }
    .cwm-close {
      width:32px;height:32px;border-radius:50%;border:none;
      background:#f0f0f0;cursor:pointer;font-size:1rem;
      display:flex;align-items:center;justify-content:center;
      color:#888;transition:background 0.15s;
    }
    .cwm-close:hover { background:#e0e0e0; }
    .cwm-section { padding:4px 24px 8px;font-size:0.78rem;font-weight:600;color:#3b82f6; }
    .cwm-list { padding:0 12px 12px; }
    .cwm-wallet {
      display:flex;align-items:center;gap:14px;padding:12px 14px;
      border-radius:12px;cursor:pointer;transition:background 0.12s;
    }
    .cwm-wallet:hover { background:#f5f5f5; }
    .cwm-wallet-icon {
      width:40px;height:40px;border-radius:10px;display:flex;
      align-items:center;justify-content:center;font-size:1.4rem;
      background:#f0f0f5;overflow:hidden;flex-shrink:0;
    }
    .cwm-wallet-icon img { width:100%;height:100%;object-fit:cover;border-radius:10px; }
    .cwm-wallet-name { font-size:0.95rem;font-weight:600; }
    .cwm-wallet-tag { font-size:0.72rem;color:#3b82f6;font-weight:500; }
    .cwm-footer {
      padding:16px 24px;border-top:1px solid #f0f0f0;
      display:flex;justify-content:space-between;align-items:center;
      font-size:0.82rem;color:#999;
    }
    .cwm-footer a { color:#3b82f6;text-decoration:none;font-weight:600; }
    .cwm-footer a:hover { text-decoration:underline; }
    .cwm-divider { height:1px;background:#f0f0f0;margin:4px 24px; }
  `;
  document.head.appendChild(s);
}

function createModal() {
  injectModalStyles();
  overlayEl = document.createElement("div");
  overlayEl.className = "cwm-overlay";
  overlayEl.addEventListener("click", (e) => {
    if (e.target === overlayEl) closeModal();
  });

  modalEl = document.createElement("div");
  modalEl.className = "cwm-modal";
  overlayEl.appendChild(modalEl);
  document.body.appendChild(overlayEl);
  renderModal();
}

function openModal() {
  if (!overlayEl) createModal();
  renderModal();
  requestAnimationFrame(() => overlayEl.classList.add("open"));
}

function closeModal() {
  if (overlayEl) overlayEl.classList.remove("open");
}

function renderModal() {
  if (!modalEl) return;

  const installed = detectedWallets.filter(w => w.info.rdns !== "browser");
  const browser = detectedWallets.find(w => w.info.rdns === "browser");

  // Recommended wallets that aren't installed
  const installedRdns = new Set(installed.map(w => w.info.rdns));
  const recommended = KNOWN_WALLETS.filter(w => !installedRdns.has(w.rdns));

  let html = `
    <div class="cwm-header">
      <h2>Connect a Wallet</h2>
      <button class="cwm-close" id="cwm-close">✕</button>
    </div>
  `;

  if (installed.length > 0) {
    html += `<div class="cwm-section">Installed</div><div class="cwm-list">`;
    installed.forEach((w, i) => {
      const icon = w.info.icon
        ? `<img src="${w.info.icon}" alt="${w.info.name}"/>`
        : (KNOWN_WALLETS.find(k => k.rdns === w.info.rdns)?.icon || "💎");
      const tag = i === 0 ? `<div class="cwm-wallet-tag">Recent</div>` : "";
      html += `
        <div class="cwm-wallet" data-wallet-idx="${detectedWallets.indexOf(w)}">
          <div class="cwm-wallet-icon">${icon}</div>
          <div>
            <div class="cwm-wallet-name">${w.info.name}</div>
            ${tag}
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  if (browser) {
    if (installed.length === 0) {
      html += `<div class="cwm-section">Detected</div><div class="cwm-list">`;
      html += `
        <div class="cwm-wallet" data-wallet-idx="${detectedWallets.indexOf(browser)}">
          <div class="cwm-wallet-icon">🌐</div>
          <div><div class="cwm-wallet-name">Browser Wallet</div></div>
        </div>
      `;
      html += `</div>`;
    }
  }

  if (recommended.length > 0) {
    html += `<div class="cwm-divider"></div>`;
    html += `<div class="cwm-section">Recommended</div><div class="cwm-list">`;
    recommended.slice(0, 5).forEach((w) => {
      html += `
        <div class="cwm-wallet cwm-wallet-disabled" style="opacity:0.6;cursor:default;">
          <div class="cwm-wallet-icon">${w.icon}</div>
          <div><div class="cwm-wallet-name">${w.name}</div></div>
        </div>
      `;
    });
    html += `</div>`;
  }

  html += `
    <div class="cwm-footer">
      <span>New to Ethereum wallets?</span>
      <a href="https://ethereum.org/wallets" target="_blank">Learn More</a>
    </div>
  `;

  modalEl.innerHTML = html;

  // Bind close
  modalEl.querySelector("#cwm-close")?.addEventListener("click", closeModal);

  // Bind wallet clicks
  modalEl.querySelectorAll("[data-wallet-idx]").forEach((el) => {
    el.addEventListener("click", async () => {
      const idx = parseInt(el.getAttribute("data-wallet-idx"));
      const wallet = detectedWallets[idx];
      if (!wallet) return;
      try {
        const accounts = await wallet.provider.request({ method: "eth_requestAccounts" });
        const chainHex = await wallet.provider.request({ method: "eth_chainId" });
        const address = accounts[0];
        const chainId = parseInt(chainHex, 16);
        closeModal();
        onConnected({ address, chainId, provider: wallet.provider });
      } catch (err) {
        console.error("Connection failed:", err);
      }
    });
  });
}

// ─── BIND OPEN BUTTON ────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("open-modal")?.addEventListener("click", openModal);
  // Also bind any button with data-wallet-connect
  document.querySelectorAll("[data-wallet-connect]").forEach(b =>
    b.addEventListener("click", openModal)
  );
});

// Listen for account/chain changes
if (window.ethereum) {
  window.ethereum.on?.("accountsChanged", (accounts) => {
    if (accounts.length === 0) onDisconnected();
    else {
      window.ethereum.request({ method: "eth_chainId" }).then(hex => {
        onConnected({ address: accounts[0], chainId: parseInt(hex, 16), provider: window.ethereum });
      });
    }
  });
  window.ethereum.on?.("chainChanged", (hex) => {
    window.ethereum.request({ method: "eth_accounts" }).then(accounts => {
      if (accounts[0]) onConnected({ address: accounts[0], chainId: parseInt(hex, 16), provider: window.ethereum });
    });
  });
}

export { openModal, closeModal };
