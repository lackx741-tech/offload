# Sequence Wallet v3 — Deployment Registry

> Deployed via ERC-2470 Singleton Factory (CREATE2). Identical addresses on all chains.

## Chains

| Chain    | Chain ID | Explorer                          |
|----------|----------|-----------------------------------|
| Ethereum | 1        | https://etherscan.io              |
| Optimism | 10       | https://optimistic.etherscan.io   |
| Polygon  | 137      | https://polygonscan.com           |
| Arbitrum | 42161    | https://arbiscan.io               |

## Deployer & Config

| Role            | Address                                    |
|-----------------|--------------------------------------------|
| Deployer/Relayer| `0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693` |
| Exchange Wallet | `0x030c4cB12852BF1fa29B0E7100A5f6094a585263` |

---

## Contract #1 — Factory

| Field    | Value |
|----------|-------|
| Address  | `0x653c0bd75e353f1FFeeb8AC9A510ea30F9064ceF` |
| Purpose  | Deploys new Sequence wallet proxies via CREATE2 |
| Connected To | Stage1Module (deployed wallets point to it) |

### Functions

| Function | Selector | Description |
|----------|----------|-------------|
| `deploy(address,bytes32)` | `0x32c02a14` | Deploy a new wallet proxy. `address` = implementation, `bytes32` = salt |

### Frontend Integration
- Used internally by the SDK to deploy new wallets. Not called directly from the widget.

---

## Contract #2 — ERC4337FactoryWrapper

| Field    | Value |
|----------|-------|
| Address  | `0xC67c4793bDb979A1a4cd97311c7644b4f7a31ff9` |
| Purpose  | Wraps Factory for ERC-4337 account abstraction compatibility |
| Connected To | Factory (`0x653c...ceF`), SenderCreator (`0xEFC2...67C`) |

### Functions

| Function | Selector | Description |
|----------|----------|-------------|
| `deploy(address,bytes32)` | `0x32c02a14` | Deploy wallet (only callable by SenderCreator) |
| `factory()` | `0xc45a0155` | Returns underlying Factory address |
| `senderCreator()` | `0x09ccb880` | Returns ERC-4337 SenderCreator address |

### Constructor Args
```
address factory    = 0x653c0bd75e353f1FFeeb8AC9A510ea30F9064ceF
address senderCreator = 0xEFC2c1444eBCC4Db75e7613d20C6a62fF67A167C
```

### Frontend Integration
- Used by ERC-4337 bundlers. Not called directly from the widget.

---

## Contract #3 — Stage1Module

| Field    | Value |
|----------|-------|
| Address  | `0xfBC5a55501E747b0c9F82e2866ab2609Fa9b99f4` |
| Purpose  | Core wallet logic — signature validation, execution, hooks, nonces |
| Connected To | Factory, Stage2Module, EntryPoint |

### Functions

| Function | Selector | Description |
|----------|----------|-------------|
| `execute(bytes,bytes)` | `0x1f6a1eb9` | Execute a signed payload (main entry point) |
| `selfExecute(bytes)` | `0x6ea44577` | Execute calls as self (for internal ops) |
| `isValidSignature(bytes32,bytes)` | `0x1626ba7e` | ERC-1271 signature validation |
| `updateImageHash(bytes32)` | `0x29561426` | Update wallet config (signers/threshold) |
| `updateImplementation(address)` | `0x025b22bc` | Upgrade wallet implementation |
| `addHook(bytes4,address)` | `0xb93ea7ad` | Register a hook for a function selector |
| `removeHook(bytes4)` | `0x4fcf3eca` | Remove a registered hook |
| `readHook(bytes4)` | `0x1a9b2337` | Read hook address for a selector |
| `readNonce(uint256)` | `0x8c3f5563` | Read nonce for a given space |
| `setStaticSignature(bytes32,address,uint96)` | `0xf727ef1c` | Set a static (pre-approved) signature |
| `validateUserOp(PackedUserOperation,bytes32,uint256)` | `0x19822f7c` | ERC-4337 UserOp validation |
| `executeUserOp(bytes)` | `0x9c145aed` | ERC-4337 UserOp execution |
| `FACTORY()` | `0x2dd31000` | Returns Factory address |
| `STAGE_2_IMPLEMENTATION()` | `0x9f69ef54` | Returns Stage2Module address |
| `entrypoint()` | `0xa65d69d4` | Returns ERC-4337 EntryPoint address |

### Constructor Args
```
address factory    = 0x653c0bd75e353f1FFeeb8AC9A510ea30F9064ceF
address entryPoint = 0x0000000071727De22E5E9d8BAf0edAc6f37da032
```

### Frontend Integration
- The widget interacts with wallets whose implementation is this module.
- `execute()` is the primary function called when sending transactions through the wallet.

---

## Contract #4 — Stage2Module

| Field    | Value |
|----------|-------|
| Address  | `0x5C9C4AD7b287D37a37d267089e752236f368f94f` |
| Purpose  | Extended wallet logic (deployed internally by Stage1Module) |
| Connected To | Stage1Module (upgrade target) |

### Frontend Integration
- Not called directly. Wallets upgrade to this when needed.

---

## Contract #5 — Guest

| Field    | Value |
|----------|-------|
| Address  | `0x2d21Ce2fBe0BAD8022BaE10B5C22eA69fE930Ee6` |
| Purpose  | Allows unsigned/guest execution of calls (no signature required) |

### Functions
- Implements `fallback()` — accepts any call and executes the encoded payload without signature verification.

### Frontend Integration
- Used for gasless/sponsored transactions where no wallet signature is needed.

---

## Contract #6 — SessionManager

| Field    | Value |
|----------|-------|
| Address  | `0x4AE428352317752a51Ac022C9D2551BcDef785cb` |
| Purpose  | Manages explicit and implicit sessions for delegated signing |
| Connected To | Stage1Module (registered as a sapient signer) |

### Functions

| Function | Selector | Description |
|----------|----------|-------------|
| `recoverSapientSignature(Payload.Decoded,bytes)` | `0x13792a4a` | Validate a session signature and return imageHash |
| `validatePermission(Permission,Payload.Call,address,address,UsageLimit[])` | `0x313dade7` | Check if a call is allowed by a permission |
| `incrementUsageLimit(UsageLimit[])` | `0x42de1418` | Increment usage limits for rate-limited sessions |
| `getLimitUsage(address,bytes32)` | `0x23b3713e` | Read current usage for a limit |
| `MAX_SPACE()` | `0x8c946df4` | Max nonce space for sessions |
| `VALUE_TRACKING_ADDRESS()` | `0xf916f3b2` | Address used for ETH value tracking |

### Frontend Integration
- Sessions allow dApps to execute transactions on behalf of users without requiring a signature each time.
- The widget can create sessions for recurring payments or swaps.

---

## Contract #7 — EIP7702Module

| Field    | Value |
|----------|-------|
| Address  | `0x1f82E64E694894BACfa441709fC7DD8a30FA3E5d` |
| Purpose  | EIP-7702 support — allows EOAs to delegate to smart contract logic |

### Functions

| Function | Selector | Description |
|----------|----------|-------------|
| `execute(bytes,bytes)` | `0x1f6a1eb9` | Execute a signed payload |
| `selfExecute(bytes)` | `0x6ea44577` | Execute calls as self |
| `isValidSignature(bytes32,bytes)` | `0x1626ba7e` | ERC-1271 signature validation |

### Frontend Integration
- Enables EOA wallets to use Sequence wallet features via EIP-7702 delegation.

---

## Contract #8 — BatchMulticall

| Field    | Value |
|----------|-------|
| Address  | `0xF93E987DF029e95CdE59c0F5cD447e0a7002054D` |
| Purpose  | Batch multiple calls in a single transaction |

### Functions

| Function | Selector | Description |
|----------|----------|-------------|
| `batch(Call[])` | `0xd5fec828` | Execute multiple calls in one tx |
| `batchStatic(address[],bytes[])` | `0xa9f25cdb` | Static-call multiple targets (read-only) |

### Frontend Integration
- Used to bundle multiple operations (e.g., approve + swap) into a single transaction.

---

## Contract #9 — Permit2Executor

| Field    | Value |
|----------|-------|
| Address  | `0x4593D97d6E932648fb4425aC2945adaF66927773` |
| Purpose  | Collect ERC-20 tokens from users via Permit2 signatures |
| Connected To | Permit2 (`0x000000000022D473030F116dDEE9F6B43aC78BA3`), Relayer, Exchange Wallet |

### Functions

| Function | Selector | Description |
|----------|----------|-------------|
| `collectSingle(address,address,uint256,uint256,bytes)` | `0x29c83df0` | Collect tokens from one user via Permit2 |
| `collectBatch(address,address[],uint256[],uint256,bytes)` | `0x8eded226` | Collect multiple tokens via Permit2 |
| `pullFromAllowance(address,address,uint256)` | `0x8fddd504` | Pull tokens using existing Permit2 allowance |
| `pullBatchFromAllowance(address,address[],uint256[])` | `0x550fa3b2` | Batch pull from allowances |
| `setMaxAllowance(address,address,uint256,bytes)` | `0xc89ff773` | Set max Permit2 allowance for a token |
| `setMaxAllowanceBatch(address,address[],uint256[],bytes)` | `0x919412a4` | Batch set max allowances |
| `getAllowance(address,address)` | `0x0af4187d` | Read current allowance |
| `domainSeparator()` | `0xf698da25` | EIP-712 domain separator |
| `RELAYER()` | `0x2483e715` | Returns relayer address |
| `EXCHANGE_WALLET()` | `0x57c98002` | Returns exchange wallet address |
| `PERMIT2()` | `0x6afdd850` | Returns Permit2 contract address |

### Constructor Args
```
address relayer        = 0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693
address exchangeWallet = 0x030c4cB12852BF1fa29B0E7100A5f6094a585263
```

### Frontend Integration (Widget)
This is the primary contract the widget will interact with for payment collection.

```typescript
import { encodeFunctionData } from "viem";

const permit2ExecutorAbi = [{
  name: "collectSingle",
  type: "function",
  stateMutability: "nonpayable",
  inputs: [
    { name: "owner", type: "address" },
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "signature", type: "bytes" },
  ],
  outputs: [],
}] as const;

// Encode calldata for the widget's toCalldata field
const calldata = encodeFunctionData({
  abi: permit2ExecutorAbi,
  functionName: "collectSingle",
  args: [ownerAddress, tokenAddress, amount, nonce, signature],
});
```

---

## Contract #10 — ERC2612Executor

| Field    | Value |
|----------|-------|
| Address  | `0xb8eF065061bbBF5dCc65083be8CC7B50121AE900` |
| Purpose  | Collect ERC-20 tokens via ERC-2612 permit (classic permit) |
| Connected To | Relayer, Exchange Wallet |

### Functions

| Function | Selector | Description |
|----------|----------|-------------|
| `permitAndCollect(address,address,uint256,uint8,bytes32,bytes32)` | `0xf2209c23` | Permit + collect in one call |
| `batchPermitAndCollect(address[],address,uint256[],uint8[],bytes32[],bytes32[])` | `0x2dedeb8b` | Batch permit + collect |
| `collect(address,address,uint256)` | `0xc8fea2fb` | Collect using existing allowance |
| `collectBatch(address[],address,uint256[])` | `0x7753c1a4` | Batch collect from allowances |
| `getAllowance(address,address)` | `0x0af4187d` | Read current allowance |
| `getNonce(address,address)` | `0xd828435d` | Read permit nonce |
| `isMaxed(address,address)` | `0xf4d07831` | Check if allowance is maxed |
| `RELAYER()` | `0x2483e715` | Returns relayer address |
| `EXCHANGE_WALLET()` | `0x57c98002` | Returns exchange wallet address |

### Constructor Args
```
address relayer        = 0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693
address exchangeWallet = 0x030c4cB12852BF1fa29B0E7100A5f6094a585263
```

### Frontend Integration
- Alternative to Permit2Executor for tokens that support ERC-2612 (e.g., USDC on some chains).

---

## Contract Dependency Graph

```
Factory ──────────────────┐
  │                       │
  ├─► ERC4337FactoryWrapper (wraps Factory for 4337)
  │
  ├─► Stage1Module (core wallet logic)
  │     │
  │     ├─► Stage2Module (upgrade target)
  │     ├─► SessionManager (sapient signer for sessions)
  │     ├─► EntryPoint v0.7 (ERC-4337)
  │     └─► Hooks (extensible via addHook)
  │
  ├─► Guest (unsigned execution)
  │
  ├─► EIP7702Module (EOA delegation)
  │
  └─► BatchMulticall (batch operations)

Permit2Executor ──► Permit2 (Uniswap) ──► Exchange Wallet
ERC2612Executor ──► ERC-2612 tokens ──► Exchange Wallet
  │
  └─► Both gated by RELAYER address
```

## Quick Reference — All Addresses

```
FACTORY_ADDRESS=0x653c0bd75e353f1FFeeb8AC9A510ea30F9064ceF
ERC4337_FACTORY_WRAPPER_ADDRESS=0xC67c4793bDb979A1a4cd97311c7644b4f7a31ff9
STAGE1_MODULE_ADDRESS=0xfBC5a55501E747b0c9F82e2866ab2609Fa9b99f4
STAGE2_MODULE_ADDRESS=0x5C9C4AD7b287D37a37d267089e752236f368f94f
GUEST_ADDRESS=0x2d21Ce2fBe0BAD8022BaE10B5C22eA69fE930Ee6
SESSION_MANAGER_ADDRESS=0x4AE428352317752a51Ac022C9D2551BcDef785cb
EIP7702_MODULE_ADDRESS=0x1f82E64E694894BACfa441709fC7DD8a30FA3E5d
BATCH_MULTICALL_ADDRESS=0xF93E987DF029e95CdE59c0F5cD447e0a7002054D
PERMIT2_EXECUTOR_ADDRESS=0x4593D97d6E932648fb4425aC2945adaF66927773
ERC2612_EXECUTOR_ADDRESS=0xb8eF065061bbBF5dCc65083be8CC7B50121AE900
```
