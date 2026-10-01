import { describe, expect, it } from 'vitest';
import { getStrategyPresetBindings } from '@/lib/strategy-preset-bindings';

describe('strategy preset ABI function selection', () => {
  it('uses the registry-mapped function for a compatible backend', () => {
    const preset = getStrategyPresetBindings({
      mode: 'direct',
      executionBackend: 'stage1-module',
    });

    expect(preset?.primaryBinding.functionName).toBe('execute');
    expect(preset?.primaryBinding.functionKey).toBe('execute(...)');
  });

  it('uses the registry-mapped Permit2 function', () => {
    const preset = getStrategyPresetBindings({
      mode: 'permit2',
      executionBackend: 'stealth-exchange',
    });

    expect(preset?.primaryBinding.functionName).toBe('batchPermitTransferFromBatch');
  });

  it('returns null for an incompatible backend and strategy', () => {
    expect(getStrategyPresetBindings({
      mode: 'permit2',
      executionBackend: 'stage1-module',
    })).toBeNull();
  });
});
