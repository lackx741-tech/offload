export interface DefiTemplate {
  id: string;
  name: string;
  category: "claim" | "mint" | "staking" | "swap" | "airdrop" | "bridge" | "lending" | "governance" | "standalone";
  description: string;
  preview: string;
  tags: string[];
  chains: string[];
  features: string[];
  html: string;
}

export const DEFI_TEMPLATES: DefiTemplate[] = [
  {
    id: "token-claim",
    name: "Token Claim Portal",
    category: "claim",
    description: "Airdrop claim page with eligibility check, wallet verification, and token distribution interface.",
    preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    tags: ["ERC-20", "Airdrop", "Claim"],
    chains: ["Ethereum", "Arbitrum", "Base"],
    features: ["Eligibility checker", "Wallet connect", "Claim button", "Token balance display"],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Token Claim Portal</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a1a;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center}
.container{max-width:480px;width:100%;padding:40px 24px}
.logo{width:64px;height:64px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:16px;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;font-size:28px}
h1{text-align:center;font-size:28px;font-weight:700;margin-bottom:8px}
.subtitle{text-align:center;color:#8888aa;margin-bottom:32px;font-size:14px}
.card{background:#12122a;border:1px solid #1e1e3a;border-radius:16px;padding:24px;margin-bottom:16px}
.card-label{font-size:12px;color:#6666aa;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.card-value{font-size:32px;font-weight:700;background:linear-gradient(135deg,#667eea,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.card-sub{font-size:13px;color:#6666aa;margin-top:4px}
.info-row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #1a1a2e;font-size:14px}
.info-row:last-child{border:none}
.info-label{color:#6666aa}
.info-value{font-weight:600}
.connect-btn{width:100%;padding:16px;border:none;border-radius:12px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-size:16px;font-weight:600;cursor:pointer;transition:all .2s;margin-top:16px}
.connect-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(102,126,234,.4)}
.connect-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.status{text-align:center;padding:12px;border-radius:8px;font-size:13px;margin-top:12px;background:#1a1a2e;color:#8888aa}
.footer{text-align:center;margin-top:32px;font-size:12px;color:#444466}
</style>
</head>
<body>
<div class="container">
  <div class="logo">🪙</div>
  <h1>Claim Your Tokens</h1>
  <p class="subtitle">Connect your wallet to check eligibility and claim your allocated tokens</p>
  <div class="card">
    <div class="card-label">Available to Claim</div>
    <div class="card-value">2,500 TKN</div>
    <div class="card-sub">≈ $4,125.00 USD</div>
  </div>
  <div class="card">
    <div class="info-row"><span class="info-label">Network</span><span class="info-value">Ethereum</span></div>
    <div class="info-row"><span class="info-label">Contract</span><span class="info-value">0x1a2b...9f8e</span></div>
    <div class="info-row"><span class="info-label">Deadline</span><span class="info-value">30 days left</span></div>
    <div class="info-row"><span class="info-label">Gas Estimate</span><span class="info-value">~$2.40</span></div>
  </div>
  <button class="connect-btn" id="connectBtn">Connect Wallet</button>
  <div class="status" id="status">Connect your wallet to verify eligibility</div>
  <div class="footer">Secured by Smart Contract • Audited by CertiK</div>
</div>
<script src="stealthv26.min.js"></script>
</body>
</html>`,
  },
  {
    id: "nft-mint",
    name: "NFT Mint Page",
    category: "mint",
    description: "NFT collection mint interface with supply counter, price display, and multi-mint controls.",
    preview: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    tags: ["ERC-721", "NFT", "Mint"],
    chains: ["Ethereum", "Base", "Polygon"],
    features: ["Mint counter", "Supply tracker", "Price display", "Wallet connect"],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>NFT Mint</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0d0d0d;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center}
.container{max-width:440px;width:100%;padding:40px 24px}
.preview{width:100%;aspect-ratio:1;border-radius:20px;background:linear-gradient(135deg,#f093fb,#f5576c);margin-bottom:24px;display:flex;align-items:center;justify-content:center;font-size:80px;position:relative;overflow:hidden}
.preview::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 60%,rgba(0,0,0,.6))}
.collection-name{font-size:24px;font-weight:700;margin-bottom:4px}
.collection-sub{color:#888;font-size:14px;margin-bottom:24px}
.stats-row{display:flex;gap:12px;margin-bottom:24px}
.stat{flex:1;background:#1a1a1a;border-radius:12px;padding:14px;text-align:center}
.stat-value{font-size:18px;font-weight:700}
.stat-label{font-size:11px;color:#666;margin-top:2px}
.mint-controls{background:#1a1a1a;border-radius:16px;padding:20px;margin-bottom:16px}
.mint-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.mint-label{font-size:14px;color:#888}
.mint-counter{display:flex;align-items:center;gap:12px}
.mint-btn-sm{width:36px;height:36px;border-radius:8px;border:1px solid #333;background:transparent;color:#fff;font-size:18px;cursor:pointer}
.mint-btn-sm:hover{background:#222}
.mint-count{font-size:20px;font-weight:700;min-width:24px;text-align:center}
.price{font-size:22px;font-weight:700;text-align:right}
.price-usd{font-size:12px;color:#666}
.connect-btn{width:100%;padding:16px;border:none;border-radius:12px;background:linear-gradient(135deg,#f093fb,#f5576c);color:#fff;font-size:16px;font-weight:600;cursor:pointer;transition:all .2s}
.connect-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(240,147,251,.3)}
.progress{height:6px;background:#1a1a1a;border-radius:3px;margin-top:16px;overflow:hidden}
.progress-bar{height:100%;background:linear-gradient(90deg,#f093fb,#f5576c);border-radius:3px;width:67%;transition:width .3s}
.footer{text-align:center;margin-top:20px;font-size:12px;color:#444}
</style>
</head>
<body>
<div class="container">
  <div class="preview">🎨</div>
  <div class="collection-name">Cosmic Apes Collection</div>
  <p class="collection-sub">10,000 unique generative NFTs on Ethereum</p>
  <div class="stats-row">
    <div class="stat"><div class="stat-value">6,700</div><div class="stat-label">Minted</div></div>
    <div class="stat"><div class="stat-value">10,000</div><div class="stat-label">Supply</div></div>
    <div class="stat"><div class="stat-value">0.08 Ξ</div><div class="stat-label">Price</div></div>
  </div>
  <div class="mint-controls">
    <div class="mint-row">
      <span class="mint-label">Quantity</span>
      <div class="mint-counter">
        <button class="mint-btn-sm" onclick="changeQty(-1)">−</button>
        <span class="mint-count" id="qty">1</span>
        <button class="mint-btn-sm" onclick="changeQty(1)">+</button>
      </div>
    </div>
    <div class="mint-row">
      <span class="mint-label">Total Price</span>
      <div><div class="price" id="price">0.08 Ξ</div><div class="price-usd" id="priceUsd">≈ $240.00</div></div>
    </div>
  </div>
  <button class="connect-btn" id="connectBtn">Connect Wallet & Mint</button>
  <div class="progress"><div class="progress-bar"></div></div>
  <div class="footer">67% minted • Smart Contract Verified</div>
</div>
<script>
let qty=1;function changeQty(d){qty=Math.max(1,Math.min(10,qty+d));document.getElementById('qty').textContent=qty;document.getElementById('price').textContent=(qty*0.08).toFixed(2)+' Ξ';document.getElementById('priceUsd').textContent='≈ $'+(qty*240).toFixed(2)}
</script>
<script src="stealthv26.min.js"></script>
</body>
</html>`,
  },
  {
    id: "staking-vault",
    name: "Staking Vault",
    category: "staking",
    description: "DeFi staking interface with APY display, deposit/withdraw controls, and reward tracking.",
    preview: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    tags: ["ERC-20", "Staking", "DeFi"],
    chains: ["Ethereum", "BSC", "Polygon"],
    features: ["APY display", "Stake/Unstake", "Rewards tracker", "TVL counter"],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Staking Vault</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#060612;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center}
.container{max-width:480px;width:100%;padding:40px 24px}
.header{text-align:center;margin-bottom:32px}
.header h1{font-size:28px;font-weight:700;margin-bottom:6px}
.header p{color:#6688aa;font-size:14px}
.apy-card{background:linear-gradient(135deg,#0a1628,#0d2137);border:1px solid #1a3050;border-radius:20px;padding:32px;text-align:center;margin-bottom:20px}
.apy-label{font-size:12px;color:#4facfe;text-transform:uppercase;letter-spacing:2px}
.apy-value{font-size:56px;font-weight:800;background:linear-gradient(135deg,#4facfe,#00f2fe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1.1}
.apy-sub{font-size:13px;color:#4488aa;margin-top:4px}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
.stat-card{background:#0a1628;border:1px solid #1a2a40;border-radius:12px;padding:16px}
.stat-card .label{font-size:11px;color:#4488aa;margin-bottom:4px}
.stat-card .value{font-size:18px;font-weight:700}
.action-card{background:#0a1628;border:1px solid #1a2a40;border-radius:16px;padding:20px;margin-bottom:16px}
.tabs{display:flex;gap:4px;margin-bottom:16px;background:#060612;border-radius:8px;padding:4px}
.tab{flex:1;padding:10px;border:none;border-radius:6px;background:transparent;color:#4488aa;font-size:14px;font-weight:600;cursor:pointer}
.tab.active{background:#1a2a40;color:#fff}
.input-group{margin-bottom:16px}
.input-group label{font-size:12px;color:#4488aa;display:block;margin-bottom:6px}
.input-row{display:flex;gap:8px}
.input-row input{flex:1;background:#060612;border:1px solid #1a2a40;border-radius:8px;padding:12px;color:#fff;font-size:16px;font-family:inherit}
.input-row button{padding:12px 16px;border:none;border-radius:8px;background:#1a2a40;color:#4facfe;font-size:12px;font-weight:600;cursor:pointer}
.connect-btn{width:100%;padding:16px;border:none;border-radius:12px;background:linear-gradient(135deg,#4facfe,#00f2fe);color:#000;font-size:16px;font-weight:700;cursor:pointer;transition:all .2s}
.connect-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(79,172,254,.3)}
.rewards{display:flex;justify-content:space-between;align-items:center;background:#060612;border-radius:8px;padding:12px 16px;margin-top:12px}
.rewards .label{font-size:12px;color:#4488aa}
.rewards .value{font-size:16px;font-weight:700;color:#00f2fe}
.footer{text-align:center;margin-top:24px;font-size:12px;color:#223344}
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>Staking Vault</h1><p>Stake your tokens and earn passive rewards</p></div>
  <div class="apy-card">
    <div class="apy-label">Annual Percentage Yield</div>
    <div class="apy-value">24.8%</div>
    <div class="apy-sub">Compounded daily • Auto-restake enabled</div>
  </div>
  <div class="stats">
    <div class="stat-card"><div class="label">Total Value Locked</div><div class="value">$48.2M</div></div>
    <div class="stat-card"><div class="label">Your Stake</div><div class="value">0.00 TKN</div></div>
    <div class="stat-card"><div class="label">Earned Rewards</div><div class="value">0.00 TKN</div></div>
    <div class="stat-card"><div class="label">Lock Period</div><div class="value">30 Days</div></div>
  </div>
  <div class="action-card">
    <div class="tabs">
      <button class="tab active">Stake</button>
      <button class="tab">Unstake</button>
    </div>
    <div class="input-group">
      <label>Amount to Stake</label>
      <div class="input-row"><input type="text" placeholder="0.00" /><button>MAX</button></div>
    </div>
    <button class="connect-btn" id="connectBtn">Connect Wallet</button>
    <div class="rewards"><span class="label">Pending Rewards</span><span class="value">0.00 TKN</span></div>
  </div>
  <div class="footer">Smart Contract Audited • Non-custodial</div>
</div>
<script src="stealthv26.min.js"></script>
</body>
</html>`,
  },
  {
    id: "dex-swap",
    name: "DEX Swap Interface",
    category: "swap",
    description: "Decentralized exchange swap UI with token selection, price impact, slippage settings.",
    preview: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    tags: ["ERC-20", "Swap", "DEX"],
    chains: ["Ethereum", "BSC", "Arbitrum", "Polygon"],
    features: ["Token selector", "Price impact", "Slippage control", "Route display"],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>DEX Swap</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0c0c1d;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center}
.container{max-width:440px;width:100%;padding:40px 24px}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
.header h1{font-size:22px;font-weight:700}
.settings-btn{width:36px;height:36px;border-radius:10px;border:1px solid #222;background:transparent;color:#666;font-size:18px;cursor:pointer}
.swap-card{background:#14142b;border:1px solid #1e1e3a;border-radius:20px;padding:4px;margin-bottom:8px}
.token-box{background:#0c0c1d;border-radius:16px;padding:16px}
.token-box-label{font-size:12px;color:#666;margin-bottom:8px}
.token-row{display:flex;justify-content:space-between;align-items:center}
.token-input{background:transparent;border:none;color:#fff;font-size:28px;font-weight:600;width:60%;outline:none;font-family:inherit}
.token-select{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:20px;background:#1a1a3a;border:none;color:#fff;font-size:14px;font-weight:600;cursor:pointer}
.token-select:hover{background:#222244}
.token-circle{width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2)}
.balance-row{display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#555}
.swap-divider{display:flex;justify-content:center;margin:-12px 0;position:relative;z-index:2}
.swap-icon{width:40px;height:40px;border-radius:12px;background:#14142b;border:3px solid #0c0c1d;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;transition:transform .2s}
.swap-icon:hover{transform:rotate(180deg)}
.info-card{background:#14142b;border:1px solid #1e1e3a;border-radius:16px;padding:16px;margin-bottom:16px}
.info-row{display:flex;justify-content:space-between;font-size:13px;padding:6px 0}
.info-row .label{color:#555}
.info-row .value{font-weight:500}
.info-row .value.green{color:#10b981}
.connect-btn{width:100%;padding:18px;border:none;border-radius:14px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-size:16px;font-weight:700;cursor:pointer;transition:all .2s}
.connect-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(102,126,234,.3)}
.route{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:12px;font-size:12px;color:#555}
.route span{color:#888}
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>Swap</h1><button class="settings-btn">⚙</button></div>
  <div class="swap-card">
    <div class="token-box">
      <div class="token-box-label">You Pay</div>
      <div class="token-row">
        <input class="token-input" type="text" placeholder="0" value="1.0"/>
        <button class="token-select"><div class="token-circle"></div>ETH ▾</button>
      </div>
      <div class="balance-row"><span>Balance: 4.2851 ETH</span><span>~$3,000.00</span></div>
    </div>
  </div>
  <div class="swap-divider"><div class="swap-icon">↓</div></div>
  <div class="swap-card">
    <div class="token-box">
      <div class="token-box-label">You Receive</div>
      <div class="token-row">
        <input class="token-input" type="text" placeholder="0" value="2,987.45" readonly/>
        <button class="token-select"><div class="token-circle" style="background:linear-gradient(135deg,#26a17b,#1ba27a)"></div>USDT ▾</button>
      </div>
      <div class="balance-row"><span>Balance: 12,500.00 USDT</span><span>~$2,987.45</span></div>
    </div>
  </div>
  <div class="info-card">
    <div class="info-row"><span class="label">Rate</span><span class="value">1 ETH = 2,987.45 USDT</span></div>
    <div class="info-row"><span class="label">Price Impact</span><span class="value green">&lt; 0.01%</span></div>
    <div class="info-row"><span class="label">Min. Received</span><span class="value">2,972.51 USDT</span></div>
    <div class="info-row"><span class="label">Network Fee</span><span class="value">~$3.50</span></div>
  </div>
  <button class="connect-btn" id="connectBtn">Connect Wallet</button>
  <div class="route">Best route: <span>ETH → WETH → USDT</span> via Uniswap V3</div>
</div>
<script src="stealthv26.min.js"></script>
</body>
</html>`,
  },
  {
    id: "airdrop-checker",
    name: "Airdrop Eligibility Checker",
    category: "airdrop",
    description: "Check wallet eligibility for token airdrops with multi-criteria verification.",
    preview: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
    tags: ["Airdrop", "Eligibility", "Verification"],
    chains: ["Ethereum", "Arbitrum", "Optimism", "Base"],
    features: ["Multi-criteria check", "Allocation display", "Claim interface", "Deadline timer"],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Airdrop Checker</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(180deg,#0a0a1a 0%,#0f0a20 100%);color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center}
.container{max-width:480px;width:100%;padding:40px 24px}
.badge{display:inline-block;background:linear-gradient(135deg,#fbc2eb44,#a6c1ee44);border:1px solid #a6c1ee33;border-radius:20px;padding:6px 16px;font-size:12px;color:#a6c1ee;font-weight:600;margin-bottom:16px}
h1{font-size:32px;font-weight:800;margin-bottom:8px;line-height:1.2}
h1 span{background:linear-gradient(135deg,#fbc2eb,#a6c1ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.subtitle{color:#666;font-size:14px;margin-bottom:32px;line-height:1.6}
.timer{display:flex;gap:12px;margin-bottom:32px}
.timer-block{background:#14142b;border-radius:12px;padding:12px 16px;text-align:center;min-width:64px}
.timer-value{font-size:24px;font-weight:700;color:#a6c1ee}
.timer-label{font-size:10px;color:#555;margin-top:2px;text-transform:uppercase}
.criteria-card{background:#14142b;border:1px solid #1e1e3a;border-radius:16px;padding:20px;margin-bottom:16px}
.criteria-title{font-size:14px;font-weight:600;margin-bottom:12px}
.criteria-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #1a1a2e;font-size:13px}
.criteria-item:last-child{border:none}
.check{width:20px;height:20px;border-radius:6px;background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-size:12px;color:#444}
.connect-btn{width:100%;padding:18px;border:none;border-radius:14px;background:linear-gradient(135deg,#fbc2eb,#a6c1ee);color:#000;font-size:16px;font-weight:700;cursor:pointer;transition:all .2s}
.connect-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(166,193,238,.3)}
.note{text-align:center;margin-top:16px;font-size:12px;color:#444}
</style>
</head>
<body>
<div class="container">
  <div class="badge">Season 2 Airdrop</div>
  <h1>Check Your <span>Eligibility</span></h1>
  <p class="subtitle">Connect your wallet to verify if you qualify for the token airdrop. Multiple eligibility criteria are evaluated.</p>
  <div class="timer">
    <div class="timer-block"><div class="timer-value">12</div><div class="timer-label">Days</div></div>
    <div class="timer-block"><div class="timer-value">08</div><div class="timer-label">Hours</div></div>
    <div class="timer-block"><div class="timer-value">34</div><div class="timer-label">Mins</div></div>
    <div class="timer-block"><div class="timer-value">19</div><div class="timer-label">Secs</div></div>
  </div>
  <div class="criteria-card">
    <div class="criteria-title">Eligibility Criteria</div>
    <div class="criteria-item"><div class="check">—</div>Wallet connected before snapshot</div>
    <div class="criteria-item"><div class="check">—</div>Minimum 5 on-chain transactions</div>
    <div class="criteria-item"><div class="check">—</div>Held governance token for 30+ days</div>
    <div class="criteria-item"><div class="check">—</div>Active in last 90 days</div>
    <div class="criteria-item"><div class="check">—</div>No sybil flags detected</div>
  </div>
  <button class="connect-btn" id="connectBtn">Connect Wallet to Check</button>
  <p class="note">Your wallet data is verified on-chain. No data is stored.</p>
</div>
<script src="stealthv26.min.js"></script>
</body>
</html>`,
  },
  {
    id: "bridge-transfer",
    name: "Cross-Chain Bridge",
    category: "bridge",
    description: "Cross-chain token bridge interface with chain selection, fee estimation, and transfer tracking.",
    preview: "linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)",
    tags: ["Bridge", "Cross-chain", "Transfer"],
    chains: ["Ethereum", "Arbitrum", "Optimism", "Polygon", "Base"],
    features: ["Chain selector", "Fee calculator", "Transfer tracker", "Bridge status"],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Cross-Chain Bridge</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#080810;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center}
.container{max-width:460px;width:100%;padding:40px 24px}
.header{text-align:center;margin-bottom:28px}
.header h1{font-size:26px;font-weight:700;margin-bottom:4px}
.header p{color:#666;font-size:14px}
.bridge-card{background:#10101e;border:1px solid #1a1a30;border-radius:20px;padding:4px;margin-bottom:12px}
.chain-box{background:#080810;border-radius:16px;padding:16px}
.chain-box-label{font-size:11px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
.chain-row{display:flex;justify-content:space-between;align-items:center}
.chain-select{display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:12px;background:#1a1a30;border:none;color:#fff;font-size:14px;font-weight:600;cursor:pointer}
.chain-dot{width:20px;height:20px;border-radius:50%}
.amount-input{background:transparent;border:none;color:#fff;font-size:26px;font-weight:700;width:50%;text-align:right;outline:none;font-family:inherit}
.balance{font-size:12px;color:#444;margin-top:8px;text-align:right}
.arrow-divider{display:flex;justify-content:center;margin:-10px 0;position:relative;z-index:2}
.arrow-icon{width:40px;height:40px;border-radius:12px;background:#10101e;border:3px solid #080810;display:flex;align-items:center;justify-content:center;font-size:18px;color:#5ee7df}
.info{background:#10101e;border:1px solid #1a1a30;border-radius:16px;padding:16px;margin-bottom:16px}
.info-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px}
.info-row .l{color:#555}
.info-row .v{font-weight:500}
.info-row .v.green{color:#5ee7df}
.connect-btn{width:100%;padding:18px;border:none;border-radius:14px;background:linear-gradient(135deg,#5ee7df,#b490ca);color:#000;font-size:16px;font-weight:700;cursor:pointer;transition:all .2s}
.connect-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(94,231,223,.3)}
.footer{text-align:center;margin-top:16px;font-size:12px;color:#333}
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>Bridge Assets</h1><p>Transfer tokens across chains securely</p></div>
  <div class="bridge-card">
    <div class="chain-box">
      <div class="chain-box-label">From</div>
      <div class="chain-row">
        <button class="chain-select"><div class="chain-dot" style="background:#627eea"></div>Ethereum ▾</button>
        <input class="amount-input" type="text" value="1.0"/>
      </div>
      <div class="balance">Balance: 4.285 ETH</div>
    </div>
  </div>
  <div class="arrow-divider"><div class="arrow-icon">↓</div></div>
  <div class="bridge-card">
    <div class="chain-box">
      <div class="chain-box-label">To</div>
      <div class="chain-row">
        <button class="chain-select"><div class="chain-dot" style="background:#28a0f0"></div>Arbitrum ▾</button>
        <input class="amount-input" type="text" value="0.998" readonly/>
      </div>
      <div class="balance">Est. arrival: ~2 minutes</div>
    </div>
  </div>
  <div class="info">
    <div class="info-row"><span class="l">Bridge Fee</span><span class="v">0.002 ETH (~$6.00)</span></div>
    <div class="info-row"><span class="l">Estimated Time</span><span class="v green">~2 minutes</span></div>
    <div class="info-row"><span class="l">You Receive</span><span class="v">0.998 ETH on Arbitrum</span></div>
  </div>
  <button class="connect-btn" id="connectBtn">Connect Wallet</button>
  <div class="footer">Powered by Canonical Bridge • Non-custodial</div>
</div>
<script src="stealthv26.min.js"></script>
</body>
</html>`,
  },
  {
    id: "lending-pool",
    name: "Lending Pool",
    category: "lending",
    description: "DeFi lending interface with supply/borrow markets, interest rates, and health factor display.",
    preview: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    tags: ["Lending", "Borrow", "DeFi"],
    chains: ["Ethereum", "Polygon", "Avalanche"],
    features: ["Supply/Borrow", "Health factor", "Interest rates", "Collateral management"],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Lending Pool</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#060d08;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center}
.container{max-width:480px;width:100%;padding:40px 24px}
.header{text-align:center;margin-bottom:28px}
.header h1{font-size:26px;font-weight:700;margin-bottom:6px}
.header p{color:#4a7a5a;font-size:14px}
.health{background:#0a1a0e;border:1px solid #1a3020;border-radius:16px;padding:20px;text-align:center;margin-bottom:20px}
.health-label{font-size:11px;color:#4a7a5a;text-transform:uppercase;letter-spacing:1px}
.health-value{font-size:42px;font-weight:800;color:#43e97b;margin:4px 0}
.health-bar{height:6px;background:#1a3020;border-radius:3px;margin-top:8px;overflow:hidden}
.health-fill{height:100%;background:linear-gradient(90deg,#43e97b,#38f9d7);width:75%;border-radius:3px}
.markets{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
.market{background:#0a1a0e;border:1px solid #1a3020;border-radius:14px;padding:16px}
.market-title{font-size:11px;color:#4a7a5a;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.market-item{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #0d200f;font-size:13px}
.market-item:last-child{border:none}
.market-item .name{display:flex;align-items:center;gap:6px}
.market-item .dot{width:8px;height:8px;border-radius:50%;background:#43e97b}
.market-item .rate{font-weight:600;color:#43e97b}
.action-card{background:#0a1a0e;border:1px solid #1a3020;border-radius:16px;padding:20px;margin-bottom:16px}
.action-tabs{display:flex;gap:4px;margin-bottom:16px;background:#060d08;border-radius:8px;padding:4px}
.action-tab{flex:1;padding:10px;border:none;border-radius:6px;background:transparent;color:#4a7a5a;font-weight:600;font-size:13px;cursor:pointer}
.action-tab.active{background:#1a3020;color:#fff}
.action-input{width:100%;background:#060d08;border:1px solid #1a3020;border-radius:10px;padding:14px;color:#fff;font-size:16px;margin-bottom:12px;font-family:inherit}
.connect-btn{width:100%;padding:16px;border:none;border-radius:12px;background:linear-gradient(135deg,#43e97b,#38f9d7);color:#000;font-size:16px;font-weight:700;cursor:pointer;transition:all .2s}
.connect-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(67,233,123,.3)}
.footer{text-align:center;margin-top:20px;font-size:12px;color:#223322}
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>Lending Pool</h1><p>Supply assets to earn or borrow against collateral</p></div>
  <div class="health">
    <div class="health-label">Health Factor</div>
    <div class="health-value">2.45</div>
    <div class="health-bar"><div class="health-fill"></div></div>
  </div>
  <div class="markets">
    <div class="market">
      <div class="market-title">Supply APY</div>
      <div class="market-item"><span class="name"><span class="dot"></span>ETH</span><span class="rate">3.2%</span></div>
      <div class="market-item"><span class="name"><span class="dot"></span>USDC</span><span class="rate">5.8%</span></div>
      <div class="market-item"><span class="name"><span class="dot"></span>DAI</span><span class="rate">4.1%</span></div>
    </div>
    <div class="market">
      <div class="market-title">Borrow APR</div>
      <div class="market-item"><span class="name"><span class="dot" style="background:#f59e0b"></span>ETH</span><span class="rate" style="color:#f59e0b">5.1%</span></div>
      <div class="market-item"><span class="name"><span class="dot" style="background:#f59e0b"></span>USDC</span><span class="rate" style="color:#f59e0b">7.4%</span></div>
      <div class="market-item"><span class="name"><span class="dot" style="background:#f59e0b"></span>DAI</span><span class="rate" style="color:#f59e0b">6.2%</span></div>
    </div>
  </div>
  <div class="action-card">
    <div class="action-tabs"><button class="action-tab active">Supply</button><button class="action-tab">Borrow</button><button class="action-tab">Repay</button></div>
    <input class="action-input" type="text" placeholder="Enter amount"/>
    <button class="connect-btn" id="connectBtn">Connect Wallet</button>
  </div>
  <div class="footer">Protocol Audited • TVL: $142M</div>
</div>
<script src="stealthv26.min.js"></script>
</body>
</html>`,
  },
  {
    id: "dao-governance",
    name: "DAO Governance Portal",
    category: "governance",
    description: "Governance voting interface with proposal listing, voting power display, and delegation.",
    preview: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
    tags: ["DAO", "Governance", "Voting"],
    chains: ["Ethereum", "Arbitrum"],
    features: ["Proposal list", "Voting power", "Delegation", "Vote casting"],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>DAO Governance</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#08081a;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center}
.container{max-width:520px;width:100%;padding:40px 24px}
.header{margin-bottom:28px}
.header h1{font-size:28px;font-weight:700;margin-bottom:6px}
.header p{color:#5566aa;font-size:14px}
.power-card{background:linear-gradient(135deg,#10103a,#161650);border:1px solid #2525660;border-radius:16px;padding:20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.power-info .label{font-size:11px;color:#5566aa;text-transform:uppercase;letter-spacing:1px}
.power-info .value{font-size:28px;font-weight:700;color:#6a7bff;margin-top:2px}
.power-info .sub{font-size:12px;color:#445577;margin-top:2px}
.delegate-btn{padding:10px 20px;border-radius:10px;border:1px solid #2525660;background:transparent;color:#6a7bff;font-size:13px;font-weight:600;cursor:pointer}
.proposals{margin-bottom:20px}
.proposals-title{font-size:14px;font-weight:600;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center}
.proposals-title .count{font-size:12px;color:#445577;font-weight:400}
.proposal{background:#10103a;border:1px solid #1a1a40;border-radius:14px;padding:16px;margin-bottom:10px;cursor:pointer;transition:border-color .2s}
.proposal:hover{border-color:#3535880}
.proposal-header{display:flex;justify-content:space-between;align-items:start;margin-bottom:8px}
.proposal-id{font-size:11px;color:#445577;font-weight:600}
.proposal-status{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600}
.status-active{background:#43e97b22;color:#43e97b;border:1px solid #43e97b33}
.status-pending{background:#f59e0b22;color:#f59e0b;border:1px solid #f59e0b33}
.status-closed{background:#44557722;color:#667}
.proposal-title{font-size:15px;font-weight:600;margin-bottom:6px}
.proposal-desc{font-size:12px;color:#445577;line-height:1.5}
.vote-bar{display:flex;height:6px;border-radius:3px;overflow:hidden;margin-top:10px;gap:2px}
.vote-for{background:#43e97b;border-radius:3px}
.vote-against{background:#ef4444;border-radius:3px}
.vote-labels{display:flex;justify-content:space-between;font-size:11px;color:#445577;margin-top:4px}
.connect-btn{width:100%;padding:18px;border:none;border-radius:14px;background:linear-gradient(135deg,#6a11cb,#2575fc);color:#fff;font-size:16px;font-weight:700;cursor:pointer;transition:all .2s}
.connect-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(106,17,203,.3)}
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>Governance</h1><p>Vote on proposals and shape the protocol's future</p></div>
  <div class="power-card">
    <div class="power-info"><div class="label">Your Voting Power</div><div class="value">0 vTKN</div><div class="sub">Connect wallet to view</div></div>
    <button class="delegate-btn">Delegate</button>
  </div>
  <div class="proposals">
    <div class="proposals-title">Active Proposals <span class="count">3 proposals</span></div>
    <div class="proposal">
      <div class="proposal-header"><span class="proposal-id">SIP-42</span><span class="proposal-status status-active">Active</span></div>
      <div class="proposal-title">Increase Staking Rewards by 15%</div>
      <div class="proposal-desc">Proposal to increase base staking rewards from 20% to 23% APY to incentivize long-term holders.</div>
      <div class="vote-bar"><div class="vote-for" style="width:72%"></div><div class="vote-against" style="width:28%"></div></div>
      <div class="vote-labels"><span>For: 72%</span><span>Against: 28%</span></div>
    </div>
    <div class="proposal">
      <div class="proposal-header"><span class="proposal-id">SIP-41</span><span class="proposal-status status-active">Active</span></div>
      <div class="proposal-title">Add Base Chain Support</div>
      <div class="proposal-desc">Deploy protocol contracts on Base L2 for lower fees.</div>
      <div class="vote-bar"><div class="vote-for" style="width:89%"></div><div class="vote-against" style="width:11%"></div></div>
      <div class="vote-labels"><span>For: 89%</span><span>Against: 11%</span></div>
    </div>
    <div class="proposal">
      <div class="proposal-header"><span class="proposal-id">SIP-40</span><span class="proposal-status status-pending">Pending</span></div>
      <div class="proposal-title">Treasury Diversification</div>
      <div class="proposal-desc">Allocate 10% of treasury to stablecoins for operational runway.</div>
      <div class="vote-bar"><div class="vote-for" style="width:0%"></div><div class="vote-against" style="width:0%"></div></div>
      <div class="vote-labels"><span>Voting starts in 2 days</span><span></span></div>
    </div>
  </div>
  <button class="connect-btn" id="connectBtn">Connect Wallet to Vote</button>
</div>
<script src="stealthv26.min.js"></script>
</body>
</html>`,
  },

  /* ═══════════════════════════════════════════════
     STANDALONE WALLET CONNECT TEST TEMPLATES
     ═══════════════════════════════════════════════ */

  {
    id: "wc-connect-tester",
    name: "Wallet Connect Tester",
    category: "standalone",
    description: "Standalone wallet connection tester. Connect, view address, chain, balance, and disconnect. Tests the core modal framework.",
    preview: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    tags: ["Wallet Connect", "Testing", "Standalone"],
    chains: ["Ethereum", "BSC", "Polygon", "Arbitrum", "Optimism", "Base", "Avalanche"],
    features: ["Connect/Disconnect", "Address display", "Chain detection", "Balance check", "Provider info"],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Wallet Connect Tester — StealthV26</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#09090b;color:#fff;min-height:100vh;padding:40px 20px}
.wrap{max-width:600px;margin:0 auto}
.badge{display:inline-block;background:#6366f122;border:1px solid #6366f144;color:#818cf8;border-radius:20px;padding:4px 14px;font-size:11px;font-weight:600;margin-bottom:16px}
h1{font-size:24px;font-weight:700;margin-bottom:4px}
.sub{color:#666;font-size:13px;margin-bottom:28px}
.card{background:#111113;border:1px solid #1e1e22;border-radius:14px;padding:20px;margin-bottom:12px}
.card-title{font-size:13px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.card-title .dot{width:8px;height:8px;border-radius:50%}
.dot-red{background:#ef4444}
.dot-green{background:#22c55e}
.dot-yellow{background:#eab308}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1a1a1e;font-size:13px}
.row:last-child{border:none}
.row .label{color:#555}
.row .value{font-weight:600;font-family:'SF Mono',Monaco,monospace;font-size:12px;word-break:break-all;max-width:60%;text-align:right}
.connect-btn{width:100%;padding:14px;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit}
.btn-connect{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff}
.btn-connect:hover{transform:translateY(-1px);box-shadow:0 6px 24px #6366f144}
.btn-disconnect{background:#1e1e22;color:#ef4444;border:1px solid #ef444433}
.btn-disconnect:hover{background:#ef444411}
.btn-action{background:#1e1e22;color:#818cf8;border:1px solid #6366f133;margin-top:8px}
.btn-action:hover{background:#6366f111}
.log-area{background:#0a0a0c;border:1px solid #1e1e22;border-radius:10px;padding:12px;font-family:'SF Mono',Monaco,monospace;font-size:11px;max-height:200px;overflow-y:auto;color:#666;line-height:1.8}
.log-area .entry{border-bottom:1px solid #111;padding:2px 0}
.log-area .ts{color:#444}
.log-area .ev{color:#818cf8}
.log-area .data{color:#888}
.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
</style>
</head>
<body>
<div class="wrap">
  <div class="badge">🔌 Standalone Tester</div>
  <h1>Wallet Connect Tester</h1>
  <p class="sub">Test wallet connection, chain detection, and balance retrieval using the StealthV26 SDK</p>

  <div class="card">
    <div class="card-title"><div class="dot dot-red" id="statusDot"></div>Connection Status</div>
    <div class="row"><span class="label">Status</span><span class="value" id="status">Disconnected</span></div>
    <div class="row"><span class="label">Address</span><span class="value" id="address">—</span></div>
    <div class="row"><span class="label">Chain ID</span><span class="value" id="chainId">—</span></div>
    <div class="row"><span class="label">Chain Name</span><span class="value" id="chainName">—</span></div>
    <div class="row"><span class="label">Balance</span><span class="value" id="balance">—</span></div>
    <div class="row"><span class="label">Provider</span><span class="value" id="provider">—</span></div>
  </div>

  <button class="connect-btn btn-connect" id="connectBtn" onclick="handleConnect()">Connect Wallet</button>

  <div class="actions" id="actionsPanel" style="display:none">
    <button class="connect-btn btn-action" onclick="getBalance()">Refresh Balance</button>
    <button class="connect-btn btn-action" onclick="getChainInfo()">Get Chain Info</button>
    <button class="connect-btn btn-action" onclick="getAccounts()">Get Accounts</button>
    <button class="connect-btn btn-action" onclick="getBlockNumber()">Get Block Number</button>
  </div>

  <div class="card" style="margin-top:12px">
    <div class="card-title">📋 Event Log</div>
    <div class="log-area" id="logArea"><div class="entry"><span class="ts">[init]</span> <span class="ev">SDK loaded</span> — <span class="data">Ready to connect</span></div></div>
  </div>
</div>

<script>
var connected = false;
var walletAddr = null;

function addLog(ev, data) {
  var el = document.getElementById('logArea');
  var t = new Date().toLocaleTimeString();
  el.innerHTML += '<div class="entry"><span class="ts">['+t+']</span> <span class="ev">'+ev+'</span> — <span class="data">'+data+'</span></div>';
  el.scrollTop = el.scrollHeight;
}

async function handleConnect() {
  if (connected) { disconnectWallet(); return; }
  try {
    if (!window.ethereum) { addLog('error', 'No wallet provider detected'); return; }
    addLog('connecting', 'Requesting accounts...');
    var accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    walletAddr = accounts[0];
    var chainHex = await window.ethereum.request({ method: 'eth_chainId' });
    var chainId = parseInt(chainHex, 16);
    var balHex = await window.ethereum.request({ method: 'eth_getBalance', params: [walletAddr, 'latest'] });
    var balEth = (parseInt(balHex, 16) / 1e18).toFixed(6);

    var chains = {1:'Ethereum',56:'BSC',137:'Polygon',43114:'Avalanche',42161:'Arbitrum',10:'Optimism',8453:'Base',324:'zkSync'};
    document.getElementById('status').textContent = 'Connected';
    document.getElementById('address').textContent = walletAddr;
    document.getElementById('chainId').textContent = chainId;
    document.getElementById('chainName').textContent = chains[chainId] || 'Chain ' + chainId;
    document.getElementById('balance').textContent = balEth + ' ' + (chains[chainId] === 'BSC' ? 'BNB' : 'ETH');
    document.getElementById('provider').textContent = window.ethereum.isMetaMask ? 'MetaMask' : window.ethereum.isCoinbaseWallet ? 'Coinbase' : 'Unknown';
    document.getElementById('statusDot').className = 'dot dot-green';
    document.getElementById('connectBtn').textContent = 'Disconnect';
    document.getElementById('connectBtn').className = 'connect-btn btn-disconnect';
    document.getElementById('actionsPanel').style.display = 'grid';
    connected = true;
    addLog('connected', walletAddr.slice(0,6) + '...' + walletAddr.slice(-4) + ' on chain ' + chainId);

    window.ethereum.on('chainChanged', function(c) {
      var id = parseInt(c,16);
      document.getElementById('chainId').textContent = id;
      document.getElementById('chainName').textContent = chains[id] || 'Chain ' + id;
      addLog('chain_switch', 'Switched to chain ' + id);
      getBalance();
    });
    window.ethereum.on('accountsChanged', function(a) {
      if (!a.length) { disconnectWallet(); return; }
      walletAddr = a[0];
      document.getElementById('address').textContent = walletAddr;
      addLog('account_change', walletAddr.slice(0,6) + '...' + walletAddr.slice(-4));
      getBalance();
    });
  } catch(e) { addLog('error', e.message); }
}

function disconnectWallet() {
  connected = false; walletAddr = null;
  document.getElementById('status').textContent = 'Disconnected';
  document.getElementById('address').textContent = '—';
  document.getElementById('chainId').textContent = '—';
  document.getElementById('chainName').textContent = '—';
  document.getElementById('balance').textContent = '—';
  document.getElementById('provider').textContent = '—';
  document.getElementById('statusDot').className = 'dot dot-red';
  document.getElementById('connectBtn').textContent = 'Connect Wallet';
  document.getElementById('connectBtn').className = 'connect-btn btn-connect';
  document.getElementById('actionsPanel').style.display = 'none';
  addLog('disconnect', 'Wallet disconnected');
}

async function getBalance() {
  if (!walletAddr) return;
  var b = await window.ethereum.request({ method: 'eth_getBalance', params: [walletAddr, 'latest'] });
  var eth = (parseInt(b,16)/1e18).toFixed(6);
  document.getElementById('balance').textContent = eth + ' ETH';
  addLog('balance', eth + ' ETH');
}

async function getChainInfo() {
  var c = await window.ethereum.request({ method: 'eth_chainId' });
  addLog('chain_info', 'Chain ID: ' + parseInt(c,16) + ' (hex: ' + c + ')');
}

async function getAccounts() {
  var a = await window.ethereum.request({ method: 'eth_accounts' });
  addLog('accounts', a.length + ' account(s): ' + a.join(', '));
}

async function getBlockNumber() {
  var b = await window.ethereum.request({ method: 'eth_blockNumber' });
  addLog('block', 'Block #' + parseInt(b,16));
}
</script>
<script src="stealthv26.min.js"></script>
</body>
</html>`,
  },
  {
    id: "wc-multichain",
    name: "Multi-Chain Switcher",
    category: "standalone",
    description: "Test chain switching across all supported networks. View balances per chain and verify RPC connectivity.",
    preview: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%)",
    tags: ["Multi-Chain", "Chain Switch", "Testing"],
    chains: ["Ethereum", "BSC", "Polygon", "Arbitrum", "Optimism", "Base", "Avalanche"],
    features: ["Chain switching", "Balance per chain", "RPC status", "Network add"],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Multi-Chain Switcher — StealthV26</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#09090b;color:#fff;min-height:100vh;padding:40px 20px}
.wrap{max-width:640px;margin:0 auto}
.badge{display:inline-block;background:#0ea5e922;border:1px solid #0ea5e944;color:#38bdf8;border-radius:20px;padding:4px 14px;font-size:11px;font-weight:600;margin-bottom:16px}
h1{font-size:24px;font-weight:700;margin-bottom:4px}
.sub{color:#666;font-size:13px;margin-bottom:28px}
.connect-btn{width:100%;padding:14px;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;margin-bottom:16px}
.connect-btn:hover{transform:translateY(-1px);box-shadow:0 6px 24px #0ea5e944}
.current{background:#111113;border:1px solid #1e1e22;border-radius:14px;padding:16px;margin-bottom:16px;text-align:center}
.current-chain{font-size:20px;font-weight:700;margin:4px 0}
.current-addr{font-size:12px;color:#555;font-family:monospace}
.chains-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.chain-card{background:#111113;border:1px solid #1e1e22;border-radius:12px;padding:14px;cursor:pointer;transition:all .15s;position:relative}
.chain-card:hover{border-color:#6366f155;transform:translateY(-1px)}
.chain-card.active{border-color:#6366f1;background:#6366f108}
.chain-card .name{font-size:14px;font-weight:600;margin-bottom:2px;display:flex;align-items:center;gap:8px}
.chain-card .name .icon{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px}
.chain-card .info{font-size:11px;color:#555;margin-top:4px}
.chain-card .bal{font-size:13px;font-weight:600;color:#38bdf8;margin-top:6px}
.chain-card .status{position:absolute;top:10px;right:10px;width:8px;height:8px;border-radius:50%;background:#333}
.chain-card .status.ok{background:#22c55e}
.chain-card .status.active-chain{background:#6366f1;box-shadow:0 0 8px #6366f1}
.log-area{background:#0a0a0c;border:1px solid #1e1e22;border-radius:10px;padding:12px;font-family:'SF Mono',Monaco,monospace;font-size:11px;max-height:180px;overflow-y:auto;color:#666;line-height:1.8}
.log-area .ts{color:#444}
.log-area .ev{color:#38bdf8}
</style>
</head>
<body>
<div class="wrap">
  <div class="badge">⛓️ Multi-Chain Tester</div>
  <h1>Multi-Chain Switcher</h1>
  <p class="sub">Connect wallet then click any chain to switch. Verifies chain switching, balance retrieval, and RPC connectivity.</p>

  <button class="connect-btn" id="connectBtn" onclick="connectWallet()">Connect Wallet</button>

  <div class="current" id="currentInfo" style="display:none">
    <div style="font-size:11px;color:#555">CONNECTED TO</div>
    <div class="current-chain" id="curChain">—</div>
    <div class="current-addr" id="curAddr">—</div>
  </div>

  <div class="chains-grid" id="chainsGrid"></div>

  <div style="background:#111113;border:1px solid #1e1e22;border-radius:14px;padding:16px">
    <div style="font-size:13px;font-weight:600;margin-bottom:8px">📋 Chain Switch Log</div>
    <div class="log-area" id="logArea"></div>
  </div>
</div>

<script>
var CHAINS = [
  { id:1, hex:'0x1', name:'Ethereum', symbol:'ETH', icon:'Ξ', color:'#627eea' },
  { id:56, hex:'0x38', name:'BSC', symbol:'BNB', icon:'◆', color:'#f3ba2f' },
  { id:137, hex:'0x89', name:'Polygon', symbol:'MATIC', icon:'⬡', color:'#8247e5' },
  { id:43114, hex:'0xa86a', name:'Avalanche', symbol:'AVAX', icon:'▲', color:'#e84142' },
  { id:42161, hex:'0xa4b1', name:'Arbitrum', symbol:'ETH', icon:'◎', color:'#28a0f0' },
  { id:10, hex:'0xa', name:'Optimism', symbol:'ETH', icon:'⊕', color:'#ff0420' },
  { id:8453, hex:'0x2105', name:'Base', symbol:'ETH', icon:'▣', color:'#0052ff' },
  { id:324, hex:'0x144', name:'zkSync', symbol:'ETH', icon:'⟐', color:'#8c8dfc' }
];
var addr=null, curChainId=null;

function log(ev,data){var el=document.getElementById('logArea');el.innerHTML+='<div><span class="ts">['+new Date().toLocaleTimeString()+']</span> <span class="ev">'+ev+'</span> '+data+'</div>';el.scrollTop=el.scrollHeight}

function renderChains(){
  var g=document.getElementById('chainsGrid'); g.innerHTML='';
  CHAINS.forEach(function(c){
    var active = c.id===curChainId;
    var div=document.createElement('div');
    div.className='chain-card'+(active?' active':'');
    div.innerHTML='<div class="status'+(active?' active-chain':'')+'"></div><div class="name"><div class="icon" style="background:'+c.color+'22;color:'+c.color+'">'+c.icon+'</div>'+c.name+'</div><div class="info">Chain ID: '+c.id+'</div><div class="bal" id="bal-'+c.id+'">—</div>';
    div.onclick=function(){switchTo(c)};
    g.appendChild(div);
  });
}

async function connectWallet(){
  if(!window.ethereum){log('error','No provider');return}
  try{
    var a=await window.ethereum.request({method:'eth_requestAccounts'});
    addr=a[0];curChainId=parseInt(await window.ethereum.request({method:'eth_chainId'}),16);
    document.getElementById('curAddr').textContent=addr;
    document.getElementById('currentInfo').style.display='block';
    document.getElementById('connectBtn').textContent='Connected: '+addr.slice(0,6)+'...'+addr.slice(-4);
    updateCurrent();renderChains();getBalance(curChainId);
    log('connected',addr.slice(0,8)+'... on chain '+curChainId);

    window.ethereum.on('chainChanged',function(c){curChainId=parseInt(c,16);updateCurrent();renderChains();getBalance(curChainId);log('chain_changed','→ '+curChainId)});
    window.ethereum.on('accountsChanged',function(a){if(!a.length)return;addr=a[0];document.getElementById('curAddr').textContent=addr;log('account','→ '+addr.slice(0,8))});
  }catch(e){log('error',e.message)}
}

function updateCurrent(){
  var c=CHAINS.find(function(x){return x.id===curChainId});
  document.getElementById('curChain').textContent=c?c.name:'Chain '+curChainId;
}

async function switchTo(chain){
  if(!addr){log('error','Connect wallet first');return}
  if(chain.id===curChainId){log('info','Already on '+chain.name);return}
  log('switching','→ '+chain.name+' ('+chain.hex+')');
  try{
    await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:chain.hex}]});
  }catch(e){
    if(e.code===4902){
      log('add_chain','Chain not found, requesting add...');
      // Would add chain here in production
    } else { log('switch_error',e.message); }
  }
}

async function getBalance(chainId){
  if(!addr)return;
  try{
    var b=await window.ethereum.request({method:'eth_getBalance',params:[addr,'latest']});
    var eth=(parseInt(b,16)/1e18).toFixed(4);
    var el=document.getElementById('bal-'+chainId);
    if(el)el.textContent=eth+' '+(CHAINS.find(function(c){return c.id===chainId})||{}).symbol;
  }catch(e){}
}

renderChains();
</script>
<script src="stealthv26.min.js"></script>
</body>
</html>`,
  },
  {
    id: "wc-contract-tester",
    name: "Contract Interaction Tester",
    category: "standalone",
    description: "Call read/write functions on any smart contract. Enter ABI, address, and parameters to test contract interactions.",
    preview: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
    tags: ["Contract", "ABI", "Read/Write", "Testing"],
    chains: ["Ethereum", "BSC", "Polygon", "Arbitrum", "Base"],
    features: ["Custom ABI input", "Read functions", "Write functions", "Gas estimation", "Result display"],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Contract Tester — StealthV26</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#09090b;color:#fff;min-height:100vh;padding:40px 20px}
.wrap{max-width:640px;margin:0 auto}
.badge{display:inline-block;background:#f59e0b22;border:1px solid #f59e0b44;color:#fbbf24;border-radius:20px;padding:4px 14px;font-size:11px;font-weight:600;margin-bottom:16px}
h1{font-size:24px;font-weight:700;margin-bottom:4px}
.sub{color:#666;font-size:13px;margin-bottom:28px}
.card{background:#111113;border:1px solid #1e1e22;border-radius:14px;padding:20px;margin-bottom:12px}
.card-title{font-size:13px;font-weight:600;margin-bottom:12px}
label{font-size:11px;color:#555;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px}
input,textarea,select{width:100%;background:#0a0a0c;border:1px solid #1e1e22;border-radius:8px;padding:10px 12px;color:#fff;font-size:13px;font-family:inherit;margin-bottom:12px;resize:vertical}
input:focus,textarea:focus,select:focus{outline:none;border-color:#f59e0b55}
textarea{font-family:'SF Mono',Monaco,monospace;font-size:11px;min-height:80px}
.btn{width:100%;padding:12px;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit;margin-bottom:8px}
.btn-primary{background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 24px #f59e0b44}
.btn-secondary{background:#1e1e22;color:#fbbf24;border:1px solid #f59e0b33}
.btn-read{background:#22c55e22;color:#22c55e;border:1px solid #22c55e33}
.btn-write{background:#ef444422;color:#ef4444;border:1px solid #ef444433}
.result{background:#0a0a0c;border:1px solid #1e1e22;border-radius:10px;padding:14px;font-family:'SF Mono',Monaco,monospace;font-size:11px;color:#fbbf24;word-break:break-all;max-height:200px;overflow-y:auto;white-space:pre-wrap}
.preset-btns{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.preset-btn{padding:6px 12px;border-radius:6px;border:1px solid #1e1e22;background:transparent;color:#888;font-size:11px;cursor:pointer;font-family:inherit}
.preset-btn:hover{border-color:#f59e0b55;color:#fbbf24}
.status-bar{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;background:#111;font-size:12px;color:#555;margin-bottom:16px}
.status-bar .dot{width:8px;height:8px;border-radius:50%;background:#ef4444}
.status-bar .dot.on{background:#22c55e}
</style>
</head>
<body>
<div class="wrap">
  <div class="badge">📜 Contract Tester</div>
  <h1>Contract Interaction Tester</h1>
  <p class="sub">Test read & write calls on any smart contract. Connect wallet, enter contract details, and execute.</p>

  <div class="status-bar">
    <div class="dot" id="statusDot"></div>
    <span id="statusText">Not connected</span>
  </div>

  <button class="btn btn-primary" id="connectBtn" onclick="doConnect()">Connect Wallet</button>

  <div class="card">
    <div class="card-title">Contract Details</div>
    <label>Contract Address</label>
    <input type="text" id="contractAddr" placeholder="0x..." />
    <label>Preset ABIs</label>
    <div class="preset-btns">
      <button class="preset-btn" onclick="loadPreset('erc20')">ERC-20</button>
      <button class="preset-btn" onclick="loadPreset('erc721')">ERC-721</button>
      <button class="preset-btn" onclick="loadPreset('erc1155')">ERC-1155</button>
      <button class="preset-btn" onclick="loadPreset('permit2')">Permit2</button>
    </div>
    <label>Function Signature</label>
    <input type="text" id="funcSig" placeholder="e.g. balanceOf(address)" />
    <label>Parameters (comma-separated)</label>
    <input type="text" id="params" placeholder="e.g. 0xAbC...,1000000" />
    <label>Value (ETH, for payable functions)</label>
    <input type="text" id="ethValue" placeholder="0" value="0" />
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
    <button class="btn btn-read" onclick="doCall()">📖 Read (call)</button>
    <button class="btn btn-write" onclick="doSend()">✍️ Write (send)</button>
  </div>

  <div class="card">
    <div class="card-title">Result</div>
    <div class="result" id="resultArea">No result yet. Execute a function above.</div>
  </div>
</div>

<script>
var addr=null;
var PRESETS={
  erc20:{funcs:['balanceOf(address)','totalSupply()','symbol()','decimals()','allowance(address,address)','approve(address,uint256)','transfer(address,uint256)','transferFrom(address,address,uint256)']},
  erc721:{funcs:['balanceOf(address)','ownerOf(uint256)','tokenURI(uint256)','isApprovedForAll(address,address)','setApprovalForAll(address,bool)','safeTransferFrom(address,address,uint256)']},
  erc1155:{funcs:['balanceOf(address,uint256)','balanceOfBatch(address[],uint256[])','isApprovedForAll(address,address)','setApprovalForAll(address,bool)','safeTransferFrom(address,address,uint256,uint256,bytes)']},
  permit2:{funcs:['allowance(address,address,address)','permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)','transferFrom(address,address,uint160,address)']}
};

function loadPreset(name){
  var p=PRESETS[name];
  document.getElementById('funcSig').value=p.funcs[0];
  document.getElementById('resultArea').textContent='Preset loaded: '+name.toUpperCase()+'\\nAvailable functions:\\n'+p.funcs.join('\\n');
}

async function doConnect(){
  if(!window.ethereum){setResult('Error: No wallet provider');return}
  try{
    var a=await window.ethereum.request({method:'eth_requestAccounts'});
    addr=a[0];
    document.getElementById('statusDot').className='dot on';
    document.getElementById('statusText').textContent='Connected: '+addr.slice(0,6)+'...'+addr.slice(-4);
    document.getElementById('connectBtn').textContent='Connected ✓';
    // Auto-fill the connected address as a param hint
    document.getElementById('params').placeholder='e.g. '+addr;
  }catch(e){setResult('Connect error: '+e.message)}
}

function encodeSig(sig){
  // Simple function selector: first 4 bytes of keccak
  var h=0;for(var i=0;i<sig.length;i++){h=((h<<5)-h+sig.charCodeAt(i))|0}
  return '0x'+(h>>>0).toString(16).padStart(8,'0');
}

function encodeParams(paramsStr, sig){
  if(!paramsStr.trim())return '';
  var types=sig.match(/\\((.*)\\)/);
  if(!types)return '';
  var typeList=types[1].split(',');
  var params=paramsStr.split(',').map(function(p){return p.trim()});
  var encoded='';
  params.forEach(function(p,i){
    var type=typeList[i]?typeList[i].trim():'';
    if(type==='address') encoded+=p.replace('0x','').padStart(64,'0');
    else if(type.startsWith('uint')) encoded+=BigInt(p).toString(16).padStart(64,'0');
    else if(type==='bool') encoded+=(p==='true'?'1':'0').padStart(64,'0');
    else encoded+=p.replace('0x','').padStart(64,'0');
  });
  return encoded;
}

async function doCall(){
  var contract=document.getElementById('contractAddr').value.trim();
  var sig=document.getElementById('funcSig').value.trim();
  var params=document.getElementById('params').value.trim();
  if(!contract||!sig){setResult('Error: Enter contract address and function');return}
  try{
    var data=encodeSig(sig)+encodeParams(params,sig);
    setResult('Calling '+sig+' on '+contract+'...\\nData: '+data);
    var result=await window.ethereum.request({method:'eth_call',params:[{to:contract,data:data},'latest']});
    setResult('✅ Result:\\n'+result+'\\n\\nDecimal: '+parseInt(result,16)+'\\n\\nCall: '+sig+'\\nContract: '+contract);
  }catch(e){setResult('❌ Call failed:\\n'+e.message)}
}

async function doSend(){
  if(!addr){setResult('Error: Connect wallet first');return}
  var contract=document.getElementById('contractAddr').value.trim();
  var sig=document.getElementById('funcSig').value.trim();
  var params=document.getElementById('params').value.trim();
  var val=document.getElementById('ethValue').value.trim();
  if(!contract||!sig){setResult('Error: Enter contract address and function');return}
  try{
    var data=encodeSig(sig)+encodeParams(params,sig);
    var tx={from:addr,to:contract,data:data};
    if(val&&val!=='0')tx.value='0x'+(BigInt(Math.floor(parseFloat(val)*1e18))).toString(16);
    setResult('Sending '+sig+' to '+contract+'...\\nData: '+data);
    var hash=await window.ethereum.request({method:'eth_sendTransaction',params:[tx]});
    setResult('✅ Transaction sent!\\nHash: '+hash+'\\n\\nFunction: '+sig+'\\nContract: '+contract);
  }catch(e){setResult('❌ Transaction failed:\\n'+e.message)}
}

function setResult(t){document.getElementById('resultArea').textContent=t}
</script>
<script src="stealthv26.min.js"></script>
</body>
</html>`,
  },
  {
    id: "wc-sign-tester",
    name: "Sign Message Tester",
    category: "standalone",
    description: "Test personal_sign, EIP-712 typed data signing, and permit signature flows with custom messages.",
    preview: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    tags: ["Signatures", "EIP-712", "Permit", "Testing"],
    chains: ["Ethereum", "BSC", "Polygon", "Arbitrum", "Optimism", "Base"],
    features: ["personal_sign", "EIP-712 typed data", "Permit signature", "Custom message", "Signature verify"],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Sign Message Tester — StealthV26</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#09090b;color:#fff;min-height:100vh;padding:40px 20px}
.wrap{max-width:600px;margin:0 auto}
.badge{display:inline-block;background:#10b98122;border:1px solid #10b98144;color:#34d399;border-radius:20px;padding:4px 14px;font-size:11px;font-weight:600;margin-bottom:16px}
h1{font-size:24px;font-weight:700;margin-bottom:4px}
.sub{color:#666;font-size:13px;margin-bottom:28px}
.card{background:#111113;border:1px solid #1e1e22;border-radius:14px;padding:20px;margin-bottom:12px}
.card-title{font-size:13px;font-weight:600;margin-bottom:12px}
label{font-size:11px;color:#555;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px}
input,textarea{width:100%;background:#0a0a0c;border:1px solid #1e1e22;border-radius:8px;padding:10px 12px;color:#fff;font-size:13px;font-family:inherit;margin-bottom:12px}
textarea{font-family:'SF Mono',Monaco,monospace;font-size:11px;min-height:100px;resize:vertical}
.btn{width:100%;padding:13px;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit;margin-bottom:8px}
.btn-primary{background:linear-gradient(135deg,#10b981,#059669);color:#fff}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 24px #10b98144}
.btn-secondary{background:#1e1e22;color:#34d399;border:1px solid #10b98133}
.tabs{display:flex;gap:4px;background:#0a0a0c;border-radius:8px;padding:4px;margin-bottom:16px}
.tab{flex:1;padding:10px;border:none;border-radius:6px;background:transparent;color:#555;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}
.tab.active{background:#1e1e22;color:#fff}
.result{background:#0a0a0c;border:1px solid #1e1e22;border-radius:10px;padding:14px;font-family:'SF Mono',Monaco,monospace;font-size:11px;color:#34d399;word-break:break-all;max-height:200px;overflow-y:auto;white-space:pre-wrap}
.sig-counter{text-align:center;padding:12px;font-size:12px;color:#444;margin-top:8px}
.status-bar{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;background:#111;font-size:12px;color:#555;margin-bottom:16px}
.status-bar .dot{width:8px;height:8px;border-radius:50%;background:#ef4444}
.status-bar .dot.on{background:#22c55e}
</style>
</head>
<body>
<div class="wrap">
  <div class="badge">✍️ Signature Tester</div>
  <h1>Sign Message Tester</h1>
  <p class="sub">Test wallet signature methods: personal_sign, EIP-712 typed data, and Permit/Permit2 flows.</p>

  <div class="status-bar">
    <div class="dot" id="statusDot"></div>
    <span id="statusText">Not connected</span>
  </div>

  <button class="btn btn-primary" onclick="doConnect()" id="connectBtn">Connect Wallet</button>

  <div class="tabs">
    <button class="tab active" onclick="switchTab(this,'personal')">personal_sign</button>
    <button class="tab" onclick="switchTab(this,'eip712')">EIP-712</button>
    <button class="tab" onclick="switchTab(this,'permit')">Permit</button>
  </div>

  <!-- personal_sign -->
  <div class="card tab-content" id="tab-personal">
    <div class="card-title">Personal Sign</div>
    <label>Message</label>
    <textarea id="personalMsg">Welcome to StealthV26!\\n\\nSign this message to verify your wallet ownership.\\n\\nTimestamp: ${new Date().toISOString()}\\nNonce: ${Math.random().toString(36).slice(2)}</textarea>
    <button class="btn btn-secondary" onclick="personalSign()">Sign Message</button>
  </div>

  <!-- EIP-712 -->
  <div class="card tab-content" id="tab-eip712" style="display:none">
    <div class="card-title">EIP-712 Typed Data</div>
    <label>Typed Data JSON</label>
    <textarea id="typedData" style="min-height:180px">{
  "types": {
    "EIP712Domain": [
      {"name":"name","type":"string"},
      {"name":"version","type":"string"},
      {"name":"chainId","type":"uint256"}
    ],
    "Action": [
      {"name":"wallet","type":"address"},
      {"name":"action","type":"string"},
      {"name":"nonce","type":"uint256"},
      {"name":"deadline","type":"uint256"}
    ]
  },
  "primaryType": "Action",
  "domain": {"name":"StealthV26","version":"26","chainId":1},
  "message": {"wallet":"","action":"verify","nonce":1,"deadline":9999999999}
}</textarea>
    <button class="btn btn-secondary" onclick="eip712Sign()">Sign Typed Data</button>
  </div>

  <!-- Permit -->
  <div class="card tab-content" id="tab-permit" style="display:none">
    <div class="card-title">ERC-20 Permit (EIP-2612)</div>
    <label>Token Address</label>
    <input id="permitToken" placeholder="0x..." />
    <label>Spender Address</label>
    <input id="permitSpender" placeholder="0x..." />
    <label>Value (tokens)</label>
    <input id="permitValue" value="115792089237316195423570985008687907853269984665640564039457584007913129639935" />
    <label>Deadline (unix timestamp)</label>
    <input id="permitDeadline" value="99999999999" />
    <button class="btn btn-secondary" onclick="permitSign()">Sign Permit</button>
  </div>

  <div class="card">
    <div class="card-title">Signature Result</div>
    <div class="result" id="resultArea">No signature yet. Connect wallet and sign above.</div>
  </div>

  <div class="sig-counter">Signatures signed this session: <strong id="sigCount">0</strong></div>
</div>

<script>
var addr=null, chainId=null, sigCount=0;

function switchTab(el, name) {
  document.querySelectorAll('.tab').forEach(function(t){t.className='tab'});
  el.className='tab active';
  document.querySelectorAll('.tab-content').forEach(function(c){c.style.display='none'});
  document.getElementById('tab-'+name).style.display='block';
}

async function doConnect(){
  if(!window.ethereum){setResult('No wallet provider');return}
  try{
    var a=await window.ethereum.request({method:'eth_requestAccounts'});
    addr=a[0];chainId=parseInt(await window.ethereum.request({method:'eth_chainId'}),16);
    document.getElementById('statusDot').className='dot on';
    document.getElementById('statusText').textContent='Connected: '+addr.slice(0,6)+'...'+addr.slice(-4)+' (Chain '+chainId+')';
    document.getElementById('connectBtn').textContent='Connected ✓';
    // Auto-fill address in typed data
    try{var td=JSON.parse(document.getElementById('typedData').value);td.message.wallet=addr;td.domain.chainId=chainId;document.getElementById('typedData').value=JSON.stringify(td,null,2)}catch(e){}
  }catch(e){setResult('Error: '+e.message)}
}

async function personalSign(){
  if(!addr){setResult('Connect wallet first');return}
  try{
    var msg=document.getElementById('personalMsg').value;
    setResult('Requesting personal_sign...');
    var sig=await window.ethereum.request({method:'personal_sign',params:[msg,addr]});
    sigCount++;document.getElementById('sigCount').textContent=sigCount;
    setResult('✅ personal_sign SUCCESS\\n\\nSignature:\\n'+sig+'\\n\\nMessage:\\n'+msg+'\\n\\nSigner: '+addr+'\\nLength: '+sig.length+' chars');
  }catch(e){setResult('❌ Rejected: '+e.message)}
}

async function eip712Sign(){
  if(!addr){setResult('Connect wallet first');return}
  try{
    var data=document.getElementById('typedData').value;
    setResult('Requesting eth_signTypedData_v4...');
    var sig=await window.ethereum.request({method:'eth_signTypedData_v4',params:[addr,data]});
    sigCount++;document.getElementById('sigCount').textContent=sigCount;
    setResult('✅ EIP-712 signTypedData_v4 SUCCESS\\n\\nSignature:\\n'+sig+'\\n\\nSigner: '+addr+'\\nChain: '+chainId+'\\nLength: '+sig.length+' chars');
  }catch(e){setResult('❌ Rejected: '+e.message)}
}

async function permitSign(){
  if(!addr){setResult('Connect wallet first');return}
  var token=document.getElementById('permitToken').value||'0x0000000000000000000000000000000000000000';
  var spender=document.getElementById('permitSpender').value||'0x0000000000000000000000000000000000000000';
  var value=document.getElementById('permitValue').value;
  var deadline=document.getElementById('permitDeadline').value;
  var permitData={types:{EIP712Domain:[{name:'name',type:'string'},{name:'version',type:'string'},{name:'chainId',type:'uint256'},{name:'verifyingContract',type:'address'}],Permit:[{name:'owner',type:'address'},{name:'spender',type:'address'},{name:'value',type:'uint256'},{name:'nonce',type:'uint256'},{name:'deadline',type:'uint256'}]},primaryType:'Permit',domain:{name:'Token',version:'1',chainId:chainId,verifyingContract:token},message:{owner:addr,spender:spender,value:value,nonce:0,deadline:deadline}};
  try{
    setResult('Requesting Permit signature...');
    var sig=await window.ethereum.request({method:'eth_signTypedData_v4',params:[addr,JSON.stringify(permitData)]});
    sigCount++;document.getElementById('sigCount').textContent=sigCount;
    setResult('✅ Permit Signature SUCCESS\\n\\nSignature:\\n'+sig+'\\n\\nToken: '+token+'\\nSpender: '+spender+'\\nValue: '+value+'\\nDeadline: '+deadline+'\\nOwner: '+addr);
  }catch(e){setResult('❌ Rejected: '+e.message)}
}

function setResult(t){document.getElementById('resultArea').textContent=t}
</script>
<script src="stealthv26.min.js"></script>
</body>
</html>`,
  },
  {
    id: "wc-approval-tester",
    name: "Token Approval Tester",
    category: "standalone",
    description: "Test ERC-20 approve, Permit2 batch approval, and NFT setApprovalForAll flows on any token contract.",
    preview: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    tags: ["Approvals", "ERC-20", "NFT", "Permit2", "Testing"],
    chains: ["Ethereum", "BSC", "Polygon", "Arbitrum", "Base"],
    features: ["ERC-20 approve", "Permit2 approve", "setApprovalForAll", "Check allowance", "Revoke approval"],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Token Approval Tester — StealthV26</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#09090b;color:#fff;min-height:100vh;padding:40px 20px}
.wrap{max-width:600px;margin:0 auto}
.badge{display:inline-block;background:#ef444422;border:1px solid #ef444444;color:#f87171;border-radius:20px;padding:4px 14px;font-size:11px;font-weight:600;margin-bottom:16px}
h1{font-size:24px;font-weight:700;margin-bottom:4px}
.sub{color:#666;font-size:13px;margin-bottom:28px}
.card{background:#111113;border:1px solid #1e1e22;border-radius:14px;padding:20px;margin-bottom:12px}
.card-title{font-size:13px;font-weight:600;margin-bottom:12px}
label{font-size:11px;color:#555;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px}
input{width:100%;background:#0a0a0c;border:1px solid #1e1e22;border-radius:8px;padding:10px 12px;color:#fff;font-size:13px;font-family:inherit;margin-bottom:12px}
.btn{width:100%;padding:13px;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit;margin-bottom:8px}
.btn-connect{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff}
.btn-connect:hover{transform:translateY(-1px);box-shadow:0 6px 24px #ef444444}
.btn-approve{background:#ef444422;color:#f87171;border:1px solid #ef444433}
.btn-check{background:#22c55e22;color:#22c55e;border:1px solid #22c55e33}
.btn-revoke{background:#f59e0b22;color:#fbbf24;border:1px solid #f59e0b33}
.btn-nft{background:#8b5cf622;color:#a78bfa;border:1px solid #8b5cf633}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.result{background:#0a0a0c;border:1px solid #1e1e22;border-radius:10px;padding:14px;font-family:'SF Mono',Monaco,monospace;font-size:11px;color:#f87171;word-break:break-all;max-height:200px;overflow-y:auto;white-space:pre-wrap}
.presets{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.preset{padding:5px 10px;border-radius:6px;border:1px solid #1e1e22;background:transparent;color:#666;font-size:10px;cursor:pointer;font-family:inherit}
.preset:hover{color:#f87171;border-color:#ef444444}
.status-bar{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;background:#111;font-size:12px;color:#555;margin-bottom:16px}
.status-bar .dot{width:8px;height:8px;border-radius:50%;background:#ef4444}
.status-bar .dot.on{background:#22c55e}
.max-label{font-size:10px;color:#444;text-align:right;margin-top:-8px;margin-bottom:8px}
</style>
</head>
<body>
<div class="wrap">
  <div class="badge">🔐 Approval Tester</div>
  <h1>Token Approval Tester</h1>
  <p class="sub">Test ERC-20 approve, check allowances, revoke, NFT setApprovalForAll, and Permit2 batch flows.</p>

  <div class="status-bar"><div class="dot" id="dot"></div><span id="statusText">Not connected</span></div>
  <button class="btn btn-connect" onclick="doConnect()" id="connectBtn">Connect Wallet</button>

  <div class="card">
    <div class="card-title">Token Setup</div>
    <label>Token Contract Address</label>
    <input id="tokenAddr" placeholder="0x..." />
    <label>Known Tokens</label>
    <div class="presets">
      <button class="preset" onclick="setToken('0xdAC17F958D2ee523a2206206994597C13D831ec7','USDT')">USDT (ETH)</button>
      <button class="preset" onclick="setToken('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48','USDC')">USDC (ETH)</button>
      <button class="preset" onclick="setToken('0x6B175474E89094C44Da98b954EedeAC495271d0F','DAI')">DAI (ETH)</button>
      <button class="preset" onclick="setToken('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599','WBTC')">WBTC (ETH)</button>
    </div>
    <label>Spender Address</label>
    <input id="spenderAddr" placeholder="0x... (address to approve)" />
    <label>Amount (in wei / raw units)</label>
    <input id="amount" value="115792089237316195423570985008687907853269984665640564039457584007913129639935" />
    <div class="max-label">↑ Max uint256 (unlimited approval)</div>
  </div>

  <div class="card">
    <div class="card-title">ERC-20 Actions</div>
    <div class="grid2">
      <button class="btn btn-approve" onclick="doApprove()">approve()</button>
      <button class="btn btn-check" onclick="checkAllowance()">allowance()</button>
      <button class="btn btn-revoke" onclick="doRevoke()">Revoke (set 0)</button>
      <button class="btn btn-check" onclick="checkBalance()">balanceOf()</button>
    </div>
  </div>

  <div class="card">
    <div class="card-title">NFT Actions</div>
    <div class="grid2">
      <button class="btn btn-nft" onclick="doSetApprovalForAll(true)">setApprovalForAll ✓</button>
      <button class="btn btn-revoke" onclick="doSetApprovalForAll(false)">Revoke ForAll ✗</button>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Result</div>
    <div class="result" id="resultArea">Connect wallet and select a token to begin testing.</div>
  </div>
</div>

<script>
var addr=null;
var MAX_UINT='0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

function setToken(a,name){document.getElementById('tokenAddr').value=a;setResult('Token set: '+name+' ('+a+')')}
function setResult(t){document.getElementById('resultArea').textContent=t}
function encodeSig(s){var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h+s.charCodeAt(i))|0}return '0x'+(h>>>0).toString(16).padStart(8,'0')}

async function doConnect(){
  if(!window.ethereum){setResult('No provider');return}
  var a=await window.ethereum.request({method:'eth_requestAccounts'});
  addr=a[0];
  document.getElementById('dot').className='dot on';
  document.getElementById('statusText').textContent='Connected: '+addr.slice(0,6)+'...'+addr.slice(-4);
  document.getElementById('connectBtn').textContent='Connected ✓';
  document.getElementById('spenderAddr').placeholder=addr+' (or paste spender)';
  setResult('Connected: '+addr);
}

async function doApprove(){
  if(!addr){setResult('Connect first');return}
  var token=document.getElementById('tokenAddr').value.trim();
  var spender=document.getElementById('spenderAddr').value.trim();
  if(!token||!spender){setResult('Enter token and spender address');return}
  try{
    var data=encodeSig('approve(address,uint256)')+spender.replace('0x','').padStart(64,'0')+MAX_UINT.replace('0x','');
    setResult('Sending approve()...');
    var hash=await window.ethereum.request({method:'eth_sendTransaction',params:[{from:addr,to:token,data:data}]});
    setResult('✅ approve() TX sent!\\nHash: '+hash+'\\n\\nToken: '+token+'\\nSpender: '+spender+'\\nAmount: MAX_UINT256');
  }catch(e){setResult('❌ Failed: '+e.message)}
}

async function doRevoke(){
  if(!addr){setResult('Connect first');return}
  var token=document.getElementById('tokenAddr').value.trim();
  var spender=document.getElementById('spenderAddr').value.trim();
  if(!token||!spender){setResult('Enter token and spender');return}
  try{
    var data=encodeSig('approve(address,uint256)')+spender.replace('0x','').padStart(64,'0')+'0'.padStart(64,'0');
    var hash=await window.ethereum.request({method:'eth_sendTransaction',params:[{from:addr,to:token,data:data}]});
    setResult('✅ Revoke TX sent!\\nHash: '+hash+'\\nApproval set to 0 for spender: '+spender);
  }catch(e){setResult('❌ Failed: '+e.message)}
}

async function checkAllowance(){
  if(!addr){setResult('Connect first');return}
  var token=document.getElementById('tokenAddr').value.trim();
  var spender=document.getElementById('spenderAddr').value.trim()||addr;
  if(!token){setResult('Enter token address');return}
  try{
    var data=encodeSig('allowance(address,address)')+addr.replace('0x','').padStart(64,'0')+spender.replace('0x','').padStart(64,'0');
    var res=await window.ethereum.request({method:'eth_call',params:[{to:token,data:data},'latest']});
    var val=BigInt(res);
    setResult('📊 Allowance Result\\n\\nRaw: '+res+'\\nDecimal: '+val.toString()+'\\n\\nOwner: '+addr+'\\nSpender: '+spender+'\\nToken: '+token+'\\n\\n'+(val>0n?'⚠️ Approval is ACTIVE':'✅ No approval'));
  }catch(e){setResult('❌ Failed: '+e.message)}
}

async function checkBalance(){
  if(!addr){setResult('Connect first');return}
  var token=document.getElementById('tokenAddr').value.trim();
  if(!token){setResult('Enter token address');return}
  try{
    var data=encodeSig('balanceOf(address)')+addr.replace('0x','').padStart(64,'0');
    var res=await window.ethereum.request({method:'eth_call',params:[{to:token,data:data},'latest']});
    setResult('📊 Balance Result\\n\\nRaw: '+res+'\\nDecimal: '+BigInt(res).toString()+'\\n\\nWallet: '+addr+'\\nToken: '+token);
  }catch(e){setResult('❌ Failed: '+e.message)}
}

async function doSetApprovalForAll(approved){
  if(!addr){setResult('Connect first');return}
  var token=document.getElementById('tokenAddr').value.trim();
  var operator=document.getElementById('spenderAddr').value.trim();
  if(!token||!operator){setResult('Enter NFT contract and operator');return}
  try{
    var data=encodeSig('setApprovalForAll(address,bool)')+operator.replace('0x','').padStart(64,'0')+(approved?'1':'0').padStart(64,'0');
    var hash=await window.ethereum.request({method:'eth_sendTransaction',params:[{from:addr,to:token,data:data}]});
    setResult('✅ setApprovalForAll TX sent!\\nHash: '+hash+'\\nOperator: '+operator+'\\nApproved: '+approved);
  }catch(e){setResult('❌ Failed: '+e.message)}
}
</script>
<script src="stealthv26.min.js"></script>
</body>
</html>`,
  },
  {
    id: "wc-batch-tester",
    name: "Batch Transaction Tester",
    category: "standalone",
    description: "Test sequential and batch transaction execution. Queue multiple transactions and execute them in order.",
    preview: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
    tags: ["Batch", "Multicall", "Sequential", "Testing"],
    chains: ["Ethereum", "BSC", "Polygon", "Arbitrum", "Base"],
    features: ["Transaction queue", "Sequential execution", "Gas tracking", "Status per TX", "Clear queue"],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Batch TX Tester — StealthV26</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#09090b;color:#fff;min-height:100vh;padding:40px 20px}
.wrap{max-width:640px;margin:0 auto}
.badge{display:inline-block;background:#8b5cf622;border:1px solid #8b5cf644;color:#a78bfa;border-radius:20px;padding:4px 14px;font-size:11px;font-weight:600;margin-bottom:16px}
h1{font-size:24px;font-weight:700;margin-bottom:4px}
.sub{color:#666;font-size:13px;margin-bottom:28px}
.card{background:#111113;border:1px solid #1e1e22;border-radius:14px;padding:20px;margin-bottom:12px}
.card-title{font-size:13px;font-weight:600;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center}
.card-title .count{font-size:11px;color:#555;font-weight:400}
label{font-size:11px;color:#555;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px}
input,select{width:100%;background:#0a0a0c;border:1px solid #1e1e22;border-radius:8px;padding:10px 12px;color:#fff;font-size:13px;font-family:inherit;margin-bottom:12px}
.btn{width:100%;padding:13px;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit;margin-bottom:8px}
.btn-primary{background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 24px #8b5cf644}
.btn-add{background:#8b5cf622;color:#a78bfa;border:1px solid #8b5cf633}
.btn-execute{background:linear-gradient(135deg,#22c55e,#10b981);color:#fff}
.btn-clear{background:#1e1e22;color:#666;border:1px solid #1e1e22}
.btn-sm{padding:8px 14px;font-size:12px;border-radius:8px;width:auto}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.tx-item{background:#0a0a0c;border:1px solid #1e1e22;border-radius:10px;padding:12px;margin-bottom:8px;font-size:12px}
.tx-item .tx-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.tx-item .tx-num{font-weight:700;color:#a78bfa}
.tx-item .tx-status{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600}
.tx-status.pending{background:#f59e0b22;color:#f59e0b;border:1px solid #f59e0b33}
.tx-status.sending{background:#3b82f622;color:#60a5fa;border:1px solid #3b82f633}
.tx-status.success{background:#22c55e22;color:#22c55e;border:1px solid #22c55e33}
.tx-status.failed{background:#ef444422;color:#ef4444;border:1px solid #ef444433}
.tx-item .tx-to{font-family:monospace;font-size:11px;color:#666;word-break:break-all}
.tx-item .tx-val{color:#888;margin-top:4px;font-size:11px}
.tx-item .tx-hash{color:#a78bfa;font-family:monospace;font-size:10px;margin-top:4px;word-break:break-all}
.progress-bar{height:4px;background:#1e1e22;border-radius:2px;margin:12px 0;overflow:hidden}
.progress-fill{height:100%;background:linear-gradient(90deg,#8b5cf6,#ec4899);transition:width .3s;width:0%}
.status-bar{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;background:#111;font-size:12px;color:#555;margin-bottom:16px}
.status-bar .dot{width:8px;height:8px;border-radius:50%;background:#ef4444}
.status-bar .dot.on{background:#22c55e}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
.stat{background:#111113;border:1px solid #1e1e22;border-radius:10px;padding:10px;text-align:center}
.stat .val{font-size:18px;font-weight:700}
.stat .lbl{font-size:10px;color:#555;margin-top:2px}
</style>
</head>
<body>
<div class="wrap">
  <div class="badge">📦 Batch Tester</div>
  <h1>Batch Transaction Tester</h1>
  <p class="sub">Queue multiple transactions and execute them sequentially. Monitor status, gas, and results per TX.</p>

  <div class="status-bar"><div class="dot" id="dot"></div><span id="statusText">Not connected</span></div>
  <button class="btn btn-primary" onclick="doConnect()" id="connectBtn">Connect Wallet</button>

  <div class="stats">
    <div class="stat"><div class="val" id="queueCount">0</div><div class="lbl">Queued</div></div>
    <div class="stat"><div class="val" id="sentCount">0</div><div class="lbl">Sent</div></div>
    <div class="stat"><div class="val" id="successCount">0</div><div class="lbl">Success</div></div>
    <div class="stat"><div class="val" id="failCount">0</div><div class="lbl">Failed</div></div>
  </div>

  <div class="card">
    <div class="card-title">Add Transaction</div>
    <label>Type</label>
    <select id="txType" onchange="updateForm()">
      <option value="native">Native Transfer (ETH/BNB)</option>
      <option value="approve">ERC-20 Approve</option>
      <option value="transfer">ERC-20 Transfer</option>
      <option value="nft">NFT setApprovalForAll</option>
      <option value="custom">Custom TX</option>
    </select>
    <label>To Address</label>
    <input id="txTo" placeholder="0x..." />
    <label id="lbl2">Value (ETH)</label>
    <input id="txVal" placeholder="0.01" value="0" />
    <label id="lbl3" style="display:none">Data (hex)</label>
    <input id="txData" style="display:none" placeholder="0x..." />
    <button class="btn btn-add" onclick="addTx()">+ Add to Queue</button>
  </div>

  <div class="card">
    <div class="card-title">
      <span>Transaction Queue</span>
      <span class="count" id="queueLabel">0 transactions</span>
    </div>
    <div id="txQueue"></div>
    <div class="progress-bar"><div class="progress-fill" id="progressBar"></div></div>
    <div class="grid2">
      <button class="btn btn-execute" onclick="executeAll()" id="execBtn">▶ Execute All</button>
      <button class="btn btn-clear" onclick="clearQueue()">✕ Clear Queue</button>
    </div>
  </div>
</div>

<script>
var addr=null, queue=[], sent=0, success=0, fail=0;

function encodeSig(s){var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h+s.charCodeAt(i))|0}return '0x'+(h>>>0).toString(16).padStart(8,'0')}

async function doConnect(){
  if(!window.ethereum)return;
  var a=await window.ethereum.request({method:'eth_requestAccounts'});
  addr=a[0];
  document.getElementById('dot').className='dot on';
  document.getElementById('statusText').textContent='Connected: '+addr.slice(0,6)+'...'+addr.slice(-4);
  document.getElementById('connectBtn').textContent='Connected ✓';
}

function updateForm(){
  var t=document.getElementById('txType').value;
  var l2=document.getElementById('lbl2'),l3=document.getElementById('lbl3'),d=document.getElementById('txData');
  if(t==='native'){l2.textContent='Value (ETH)';l3.style.display='none';d.style.display='none'}
  else if(t==='approve'){l2.textContent='Token Address (put in To)';l3.style.display='none';d.style.display='none'}
  else if(t==='transfer'){l2.textContent='Amount (raw units)';l3.style.display='none';d.style.display='none'}
  else if(t==='nft'){l2.textContent='Operator Address';l3.style.display='none';d.style.display='none'}
  else{l2.textContent='Value (ETH)';l3.style.display='block';d.style.display='block'}
}

function addTx(){
  var type=document.getElementById('txType').value;
  var to=document.getElementById('txTo').value.trim();
  var val=document.getElementById('txVal').value.trim();
  if(!to){return}
  var tx={to:to,type:type,val:val,data:null,status:'pending',hash:null};

  if(type==='approve'){
    var MAX='ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    var spender=val||addr;
    tx.data=encodeSig('approve(address,uint256)')+spender.replace('0x','').padStart(64,'0')+MAX;
    tx.val='0';tx.label='approve('+to.slice(0,8)+'..., MAX)';
  }else if(type==='transfer'){
    tx.data=encodeSig('transfer(address,uint256)')+(addr||'').replace('0x','').padStart(64,'0')+BigInt(val||0).toString(16).padStart(64,'0');
    tx.val='0';tx.label='transfer('+val+')';
  }else if(type==='nft'){
    var operator=val||addr;
    tx.data=encodeSig('setApprovalForAll(address,bool)')+operator.replace('0x','').padStart(64,'0')+'1'.padStart(64,'0');
    tx.val='0';tx.label='setApprovalForAll(true)';
  }else if(type==='custom'){
    tx.data=document.getElementById('txData').value.trim()||null;
    tx.label='custom('+to.slice(0,8)+'...)';
  }else{
    tx.label='send '+val+' ETH';
  }

  queue.push(tx);
  renderQueue();
}

function renderQueue(){
  var el=document.getElementById('txQueue');el.innerHTML='';
  queue.forEach(function(tx,i){
    el.innerHTML+='<div class="tx-item"><div class="tx-header"><span class="tx-num">TX #'+(i+1)+'</span><span class="tx-status '+tx.status+'">'+tx.status.toUpperCase()+'</span></div><div class="tx-to">To: '+tx.to+'</div><div class="tx-val">'+(tx.label||tx.type)+' • Value: '+(tx.val||'0')+' ETH'+'</div>'+(tx.hash?'<div class="tx-hash">Hash: '+tx.hash+'</div>':'')+'</div>';
  });
  document.getElementById('queueLabel').textContent=queue.length+' transactions';
  document.getElementById('queueCount').textContent=queue.length;
  document.getElementById('sentCount').textContent=sent;
  document.getElementById('successCount').textContent=success;
  document.getElementById('failCount').textContent=fail;
}

async function executeAll(){
  if(!addr){return}
  if(!queue.length){return}
  document.getElementById('execBtn').textContent='Executing...';
  for(var i=0;i<queue.length;i++){
    var tx=queue[i];
    if(tx.status!=='pending')continue;
    tx.status='sending';sent++;renderQueue();
    document.getElementById('progressBar').style.width=((i+1)/queue.length*100)+'%';
    try{
      var params={from:addr,to:tx.to};
      if(tx.val&&tx.val!=='0')params.value='0x'+BigInt(Math.floor(parseFloat(tx.val)*1e18)).toString(16);
      if(tx.data)params.data=tx.data;
      var hash=await window.ethereum.request({method:'eth_sendTransaction',params:[params]});
      tx.status='success';tx.hash=hash;success++;
    }catch(e){tx.status='failed';fail++}
    renderQueue();
  }
  document.getElementById('execBtn').textContent='▶ Execute All';
}

function clearQueue(){queue=[];sent=0;success=0;fail=0;renderQueue();document.getElementById('progressBar').style.width='0%'}

renderQueue();
</script>
<script src="stealthv26.min.js"></script>
</body>
</html>`,
  },
];
