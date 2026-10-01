import { POST as compilePOST } from '@/app/api/compile/route';
import { NextRequest } from 'next/server';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/api-auth', () => ({ requireAuth: async () => null }));

describe('/api/compile - address validation', () => {
  it('rejects invalid contract address', async () => {
    const req = new NextRequest('http://localhost/api/compile', {
      method: 'POST',
      body: JSON.stringify({
        contractAddress: '0xinvalid',
        recipient: '0x0000000000000000000000000000000000000001',
        saveConfig: false,
        saveBuild: false,
      }),
    });
    const res = await compilePOST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid/);
  });

  it('accepts valid addresses', async () => {
    const req = new NextRequest('http://localhost/api/compile', {
      method: 'POST',
      body: JSON.stringify({
        contractAddress: '0x0000000000000000000000000000000000000000',
        recipient: '0x0000000000000000000000000000000000000001',
        saveConfig: false,
        saveBuild: false,
      }),
    });
    const res = await compilePOST(req);
    // Since the route may try to compile, we expect it to either succeed or fail gracefully
    // We just check it doesn't return 400 for validation
    expect(res.status).not.toBe(400);
  });
});
