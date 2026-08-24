# Strategy Preset Bindings

Complete guide to strategy modes and their ABI function bindings.

## Overview

Strategy presets map user intents (strategy modes) to actual smart contract function calls. Each preset:

1. **Defines a strategy mode** (e.g., "permit2", "eip7702", "multicall")
2. **Binds to real ABI functions** from contract registry
3. **Generates execution calldata** for the blockchain
4. **Compiles into SDKs** for embedded use
5. **Used by primary action route** (`/api/action/execute`)

## Strategy Modes

### 1. Direct Transfer
```typescript
mode: "direct"
Contract: StealthExchange
Function: transferFrom(address from, address to, uint256 amount)
Requires: Prior approval
Use When: User has already approved tokens
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/action/execute \
  -d '{
    "mode": "direct",
    "wallet": "0x...",
    "recipient": "0x...",
    "tokens": ["0xUsdc..."],
    "amounts": ["1000000"]
  }'
```

### 2. Approve + Transfer
```typescript
mode: "approve"
Step 1: approve(spender, amount) - ERC-20 standard
Step 2: transferFrom(from, to, amount)
Use When: Need to grant spending permission first
```

**Flow:**
1. User approves backend contract
2. Backend executes transfer from user

### 3. Permit (ERC-2612)
```typescript
mode: "permit"
Contract: ERC2612Executor
Function: permitAndCollect(address token, address client, uint256 amount, uint8 v, bytes32 r, bytes32 s)
Requires: EIP-712 signature
Use When: Token supports EIP-2612 permit()
```

**Advantages:**
- No pre-approval needed
- Single transaction for approval + transfer
- User signs EIP-712 typed data

### 4. Permit2 (Uniswap)
```typescript
mode: "permit2"
Contract: Permit2Executor
Function: pullBatchFromAllowance(address client, address[] tokens, uint256[] amounts)
Requires: Permit2 contract signature
Use When: Using Uniswap's universal Permit2
```

**Advantages:**
- Works across all ERC-20 tokens
- Batch transfer in single call
- EIP-712 structured data

### 5. Multicall (Batch Execution)
```typescript
mode: "multicall"
Contract: BatchMulticall
Function: batch((address target, uint256 value, bytes data, bool allowFailure)[])
Aggregates: Multiple contract calls
Use When: Need atomic execution of multiple actions
```

**Example - Multiple token transfers:**
```json
{
  "mode": "multicall",
  "calls": [
    {
      "target": "0xTokenA",
      "data": "0x23b872dd..." // transferFrom encoded
    },
    {
      "target": "0xTokenB",
      "data": "0x23b872dd..." // transferFrom encoded
    }
  ]
}
```

### 6. EIP-712 (Typed Data)
```typescript
mode: "eip712"
Contract: StealthExchange
Function: batchPermitTransferFromBatch(
  address user,
  ((address,uint160,uint48,uint48)[],address,uint256) permitBatch,
  bytes signature,
  address recipient
)
Requires: EIP-712 domain separator
Use When: Batch transfer with complex permit structure
```

**EIP-712 Domain:**
```json
{
  "name": "Permit2",
  "version": "1",
  "chainId": 1,
  "verifyingContract": "0x000000000022D473030F116dDEE9F6B43aC78BA3"
}
```

### 7. EIP-7702 (Delegation)
```typescript
mode: "eip7702"
Contract: EIP7702BatchDelegate
Function: executeBatch((address target, uint256 value, bytes data)[])
Standard: EIP-7702 account delegation
Use When: Using delegated execution (gasless via relayer)
```

**Requirements:**
- User creates EIP-7702 authorization
- Relayer executes via delegation
- No user gas required

**Authorization:**
```typescript
// User creates delegation to EIP7702BatchDelegate
{
  type: 0x04,  // EIP-7702 type
  chainId: 1,
  address: "0x...", // Delegation target
  nonce: 0,
  authorizationList: [...]
}
```

### 8. Gasless (EIP-7702 + Fallback)
```typescript
mode: "gasless"
Primary: EIP-7702 delegation
Fallback: Permit2 if EIP-7702 unavailable
Use When: Maximum compatibility for gasless
```

**Logic:**
```
if (eip7702Supported) {
  use EIP-7702BatchDelegate
} else {
  fallback to Permit2Executor
}
```

### 9. Trails (Routing Protocol)
```typescript
mode: "trails"
Contract: StealthExchange (via Trails API)
Function: routeAndExecute(bytes routeData, address recipient)
Standard: Trails protocol routing
Use When: Optimal path finding across protocols
```

**Trails Flow:**
1. Query Trails API for best route
2. Encode route as calldata
3. Execute via StealthExchange

## Binding Structure

Each preset compiles to:

```typescript
interface StrategyPreset {
  mode: StrategyMode;
  label: string;
  description: string;
  primaryBinding: ContractFunctionBinding;
  fallbackBinding?: ContractFunctionBinding;
  requiresApproval: boolean;
  requiresPermit: boolean;
  requiresEIP712: boolean;
}

interface ContractFunctionBinding {
  preset: string;
  label: string;
  contractAddress: string;
  contractName: string;
  abi: unknown[];
  functionKey: string;  // "functionName(type1,type2,...)"
  functionName: string;
  stateMutability: "pure" | "view" | "nonpayable" | "payable";
  args: ContractFunctionBindingArg[];
}
```

## API Endpoints

### GET /api/action/execute
List all available strategy presets.

**Response:**
```json
{
  "status": "ok",
  "total": 9,
  "presets": [
    {
      "mode": "permit2",
      "label": "Permit2 (EIP-2612)",
      "description": "Use Permit2 for token collection...",
      "requiresApproval": false,
      "requiresPermit": true,
      "requiresEIP712": true,
      "functionName": "pullBatchFromAllowance",
      "contractName": "Permit2Executor"
    },
    ...
  ]
}
```

### POST /api/action/execute
Execute an action via strategy preset.

**Request:**
```json
{
  "mode": "permit2",
  "backend": "permit2-executor",
  "wallet": "0x...",
  "recipient": "0x...",
  "tokens": ["0xUsdc..."],
  "amounts": ["1000000"],
  "chainId": 1
}
```

**Response:**
```json
{
  "status": "success",
  "mode": "permit2",
  "binding": {
    "functionName": "pullBatchFromAllowance",
    "contractName": "Permit2Executor",
    "functionKey": "pullBatchFromAllowance(address,address[],uint256[])"
  },
  "calldata": "0x9f305f10...",
  "target": "0x4593D97d6E932648fb4425aC2945adaF66927773",
  "value": "0"
}
```

## ABI Function Extraction

Each strategy binds to real ABI functions:

```typescript
// Strategy mode: permit2
// Maps to → Permit2Executor contract
// Function → pullBatchFromAllowance from ABI

const permit2Contract = getContractById('permit2-executor');
// ABIFile: abi/Permit2Executor.json
// Function extracted: pullBatchFromAllowance

// ABI Entry:
{
  "type": "function",
  "name": "pullBatchFromAllowance",
  "inputs": [
    {"name": "client", "type": "address"},
    {"name": "tokens", "type": "address[]"},
    {"name": "amounts", "type": "uint256[]"}
  ],
  "outputs": [],
  "stateMutability": "nonpayable"
}
```

## Contract Addresses Used

| Strategy | Contract | Address |
|----------|----------|---------|
| direct | StealthExchange | 0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A |
| approve | ERC20 Token | $token |
| permit | ERC2612Executor | 0xb8eF065061bbBF5dCc65083be8CC7B50121AE900 |
| permit2 | Permit2Executor | 0x4593D97d6E932648fb4425aC2945adaF66927773 |
| multicall | BatchMulticall | 0xF93E987DF029e95CdE59c0F5cD447e0a7002054D |
| eip712 | StealthExchange | 0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A |
| eip7702 | EIP7702BatchDelegate | 0xb61cA663d438900d086359e0bB7aA4140091053C |
| trails | StealthExchange | 0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A |

## Compiled SDK Usage

Strategy presets compiled into SDKs enable:

```javascript
// Generated SDK includes all strategy bindings
const sdk = new StealthV26SDK(config);

// Execute via strategy
const result = await sdk.executeAction({
  mode: 'permit2',
  wallet: userAddress,
  recipient: receiverAddress,
  tokens: [usdcAddress],
  amounts: ['1000000']
});

// SDK automatically:
// 1. Gets permit2 preset binding
// 2. Extracts function signature from ABI
// 3. Encodes calldata
// 4. Returns ready-to-sign transaction
```

## Strategy Selection Logic

```typescript
// SDK automatically selects best strategy:

if (token.supportsEIP2612) {
  // Use native permit
  strategy = 'permit';
} else if (hasPermit2) {
  // Use Uniswap Permit2
  strategy = 'permit2';
} else if (isDelegationAvailable) {
  // Use EIP-7702 gasless
  strategy = 'eip7702';
} else if (hasExistingApproval) {
  // Use direct transfer
  strategy = 'direct';
} else {
  // Fall back to approve + transfer
  strategy = 'approve';
}
```

## Testing Strategies

```bash
# Test permit2 preset
curl -X POST http://localhost:3000/api/action/execute \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "permit2",
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
    "recipient": "0x8ba1f109551bd432803012645ac136ddd64dba72",
    "tokens": ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"],
    "amounts": ["1000000"],
    "backend": "permit2-executor",
    "chainId": 1
  }'

# List all strategies
curl http://localhost:3000/api/action/execute

# Test EIP-7702
curl -X POST http://localhost:3000/api/action/execute \
  -d '{
    "mode": "eip7702",
    "wallet": "0x...",
    "recipient": "0x...",
    "tokens": ["0xUsdc..."],
    "amounts": ["1000000"]
  }'
```

## Extensibility

Add new strategies by:

1. **Define new StrategyMode** in types.ts
2. **Create preset function** in strategy-preset-bindings.ts
3. **Add to getStrategyPresetBindings()** switch
4. **Wire to generateCalldata()** for encoding

Example:

```typescript
// types.ts
export type StrategyMode = "..." | "new-strategy";

// strategy-preset-bindings.ts
function getNewStrategyPreset(): StrategyPreset | null {
  const contract = getContractById('new-contract');
  return {
    mode: 'new-strategy',
    label: 'New Strategy',
    primaryBinding: {
      functionName: 'newFunction',
      ...
    },
    ...
  };
}

// Add to switch in getStrategyPresetBindings()
case 'new-strategy':
  return getNewStrategyPreset();
```

## Production Deployment

Strategy presets are compiled and shipped with every SDK:

```bash
# Build includes all strategy bindings
npm run build

# Compiled into SDK (in generated code):
const STRATEGY_PRESETS = {
  permit2: { ... },
  eip7702: { ... },
  permit: { ... },
  ...
};

# SDK runtime selects strategy based on:
// 1. User preference
// 2. Token capabilities
// 3. Network support
// 4. Wallet integration
```

## Notes

- **Function bindings extracted directly from ABIs** - no hardcoding
- **Fallback chains** - if preferred fails, try next in chain
- **Calldata generation** - uses actual function selectors from ABI
- **Runtime selection** - SDK picks best strategy automatically
- **Gas optimization** - strategies ranked by gas efficiency
- **Extensible** - add new contracts and strategies anytime
