# StealthV26 (St3) — Complete Architecture

## 1. High-Level Overview

**St3** is a **Wallet-as-a-Service (WaaS) platform** — a multi-tenant SaaS that lets operators configure, compile, and deploy customizable Web3 wallet-connection SDK scripts. Operators control wallet behavior, execution strategy, branding, and monitoring through an admin dashboard, then export a self-contained JS bundle to embed on any domain.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN DASHBOARD (Next.js)                    │
│  /compile  /frontpage  /contract  /strategy  /settings  /analytics  │
│  /domains  /logs  /templates  /affiliate  /affiliates               │
└────────────────────────────┬────────────────────────────────────────┘
                             │ API Routes (/api/*)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES LAYER                         │
│   Redis (session/cache)  ·  Kafka (event bus)  ·  Indexer (chain)   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     GENERATED SDK BUNDLE (JS)                       │
│   Wallet Modal  ·  Chain Router  ·  Asset Scanner  ·  Execution     │
│   Deployed on operator domains via <script> embed                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ON-CHAIN CONTRACTS (EVM)                        │
│   Stage1Module · Stage2Module · SessionManager · Factory            │
│   Permit2Executor · ERC2612Executor · EIP7702Module · BatchMulticall│
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router, React Compiler) | SSR, API routes, standalone output |
| **UI** | React 19 + TailwindCSS 4 + shadcn/ui + Lucide | Admin dashboard |
| **State** | Zustand 5 | Client-side config & session state |
| **Web3** | viem 2.x + wagmi 3.x + ethers 6.x | Chain interaction, wallet clients |
| **Wallet Modals** | Reown AppKit, Sequence Connect, RainbowKit, Web3Modal, Custom | Operator-selectable modal framework |
| **Charts** | Recharts 3 | Analytics visualizations |
| **Event Bus** | Kafka (kafkajs) / in-memory fallback | Async event streaming |
| **Cache / Sessions** | Redis (ioredis) / in-memory fallback | Session store, rate limiting, caching |
| **Indexer** | Node.js service (ethers + ioredis + kafkajs) | On-chain event indexing |
| **Deployment** | Docker Compose, Nginx, standalone Next.js | Containerized prod deploy |
| **Obfuscation** | javascript-obfuscator + terser | SDK output protection |
| **Validation** | Zod 4 | Schema validation |

---

## 3. Layered Architecture

### Layer 1 — Control Layer (Admin UI)

The admin dashboard for configuring all aspects of the platform:

| Route | File | Purpose |
|-------|------|---------|
| `/` | `src/app/page.tsx` | Dashboard — stats, sessions, charts |
| `/compile` | `src/app/compile/page.tsx` | SDK compiler workspace (6 tabs) |
| `/frontpage` | `src/app/frontpage/page.tsx` | Public action page builder |
| `/frontpage/runtime` | `src/app/frontpage/runtime/page.tsx` | Live preview of frontpage config |
| `/contract` | `src/app/contract/page.tsx` | ABI management, contract pairing |
| `/strategy` | `src/app/strategy/page.tsx` | Execution strategy rules engine |
| `/templates` | `src/app/templates/page.tsx` | DeFi + Standalone template library (13 templates) |
| `/settings` | `src/app/settings/page.tsx` | Payout, Telegram, Cloaking |
| `/domains` | `src/app/domains/page.tsx` | Domain management |
| `/analytics` | `src/app/analytics/page.tsx` | Conversion funnels, chain perf, radar charts |
| `/logs` | `src/app/logs/page.tsx` | Filterable log viewer |
| `/embed-tool` | `src/app/embed-tool/page.tsx` | Embed snippet generator |
| `/permit2` | `src/app/permit2/page.tsx` | Permit2 config |
| `/affiliate` | `src/app/affiliate/page.tsx` | Affiliate portal (separate login) |
| `/affiliates` | `src/app/affiliates/page.tsx` | Internal affiliate management |

### Layer 2 — Shared Config Layer

Central configuration model stored and synced across control surfaces:

- **Operational Config** — `src/lib/operational-config-store.ts` → contracts + strategy + appKit
- **Compile Config** — `src/lib/compile-config-store.ts` → General / Wallet / Modal / Tokens / Advanced
- **Frontpage Config** — `src/lib/frontpage-config-store.ts` → hero/CTA/actions
- **Frontpage→Compile Sync** — `src/lib/frontpage-compile-sync.ts` → bridges frontpage to compile
- **Script Build Store** — `src/lib/script-build-store.ts` → build artifact state
- **Global Zustand Store** — `src/lib/store.ts` → 13 slices (configs + sessions + logs + domains + stats + strategy rules)

### Layer 3 — Compile Layer (SDK Generator)

Transforms normalized config into a deployable JavaScript bundle:

- **SDK Generator** — `src/lib/sdk-generator.ts` (46KB) — core bundle emitter
- **Runtime Bundles** — `src/lib/runtime-bundles.ts` — EVM / Solana / Tron scaffold output
- **Template Library** — `src/lib/templates.ts` (94KB) — 8 DeFi + 5 Standalone templates
- **Obfuscator** — `src/lib/obfuscator.ts` — javascript-obfuscator + terser pipeline
- **Compile Output UI** — `src/components/compile/compile-output.tsx`

**Compile tabs** (in `src/components/compile/`):

| File | Purpose |
|------|---------|
| `general-tab.tsx` | Ecosystem, CSS classes, theme, UI text |
| `wallet-tab.tsx` | Min balance, chain ratio, wallet visibility |
| `modal-tab.tsx` | Framework selector (Reown/Web3Modal/RainbowKit/Sequence/Custom), WC project ID, styling |
| `tokens-tab.tsx` | ERC-20/721/1155 handling, chain visibility |
| `advanced-tab.tsx` | Retry, signatures, EIP-712, logging, caching |

**Live modal preview builders:**

| File | Purpose |
|------|---------|
| `reown-live-trigger.tsx` | Live Reown AppKit preview |
| `sequence-modal-sandbox.tsx` | Live Sequence modal sandbox |
| `trails-live-builder.tsx` | Trails widget builder |
| `shared-modal-renderer.tsx` | Shared modal rendering |

### Layer 4 — Wallet / Modal Layer

Generated SDK supports multiple modal frameworks (operator-selected):

| Framework | Integration |
|-----------|-------------|
| **Reown AppKit** | `@reown/appkit` + `@reown/appkit-adapter-wagmi` |
| **Web3Modal** | `@web3modal/cdn@5.1.11` via CDN |
| **RainbowKit** | Compiled into bundle |
| **Sequence** | `@0xsequence/connect` + `@0xsequence/wallet-widget` |
| **Custom** | Operator-defined |

Config in `src/lib/reown-config.ts` and `src/components/reown-provider.tsx`.

### Layer 5 — Execution Layer

Four distinct execution paths:

| Path | Use Case | Status |
|------|----------|--------|
| **Direct** | Normal contract writes/reads | ✅ Implemented |
| **Delegate** | Module-based delegatecall through router | ✅ Config + ABI ready |
| **EIP-7702** | Wallet-authorized code delegation | ⚙️ Config ready, runtime pending |
| **Trails** | Cross-chain swap+bridge+execute orchestration | ⚙️ Widget URL helper, deeper integration pending |

Strategy modes defined in types: `direct | approve | permit | permit2 | multicall | gasless | eip712 | eip7702 | trails`

---

## 4. API Routes

| Route | Purpose |
|-------|---------|
| `/api/auth/nonce` | SIWE nonce generation |
| `/api/auth/verify` | Wallet signature verification → session cookie |
| `/api/auth/me` | Current session / role |
| `/api/auth/logout` | Session destruction |
| `/api/config` | Platform config CRUD |
| `/api/compile-config` | Compile config persistence |
| `/api/compile` | Server-side SDK compilation + publish |
| `/api/operational-config` | Contracts + strategy + appKit config |
| `/api/contracts` + `/api/contracts/[id]` | ABI artifact management |
| `/api/projects` + `/api/projects/[id]` | Multi-project management |
| `/api/projects/[id]/compile` | Per-project compilation |
| `/api/projects/[id]/config` | Per-project config |
| `/api/projects/[id]/stats` | Per-project stats |
| `/api/domains` | Domain CRUD |
| `/api/logs` | Log retrieval / recording |
| `/api/analytics` | Platform statistics |
| `/api/telegram` | Telegram Bot notifications |
| `/api/script` | Published script hosting |
| `/api/sdk` | SDK endpoint |
| `/api/relay/batch` | Batch relay execution |
| `/api/indexer` | Indexer status / control |
| `/api/admin` | Admin operations |
| `/api/affiliate/access` | Affiliate access management |
| `/api/affiliate/compile` | Affiliate-scoped compilation |
| `/api/affiliate/config` | Affiliate config |
| `/api/affiliate/onboard` | Affiliate onboarding |

---

## 5. Auth & RBAC

### Authentication (`src/lib/auth.ts`)

- SIWE-like wallet signature flow: nonce → sign → verify
- HMAC-SHA256 session tokens in cookies (`s26_session`)
- Timing-safe signature verification (`crypto.timingSafeEqual`)
- Admin panel password fallback via env vars
- Nonce cookie (`s26_nonce`) for replay protection

### Role-Based Access Control (`src/lib/rbac.ts`)

4 roles with hierarchical permissions:

| Role | Level | Key Permissions |
|------|-------|----------------|
| **owner** | 100 | Everything, including `users:manage` |
| **admin** | 75 | Config write, deploy, logs delete, settings write, users read |
| **operator** | 50 | Config write, deploy, relay execute, domains manage, SDK compile |
| **viewer** | 25 | Read-only across config, contracts, analytics, logs, domains |

16 granular permissions: `config:read`, `config:write`, `contracts:read`, `contracts:deploy`, `relay:execute`, `analytics:read`, `logs:read`, `logs:delete`, `domains:read`, `domains:manage`, `settings:read`, `settings:write`, `users:read`, `users:manage`, `sdk:compile`, `sdk:download`

Role resolution via env vars: `OWNER_ADDRESS`, `ADMIN_ADDRESSES`, `OPERATOR_ADDRESSES`

---

## 6. Infrastructure Services

### Redis (`src/lib/redis.ts`)

- Session store with TTL
- Caching helper (`cached<T>()`) with automatic serialization
- Sliding-window rate limiter (`rateLimit()`)
- Falls back to in-memory `Map` when `REDIS_URL` not set

### Kafka Event Bus (`src/lib/kafka.ts`)

Standard topics:

| Topic | Event |
|-------|-------|
| `wallet.connected` | Wallet connection |
| `wallet.disconnected` | Wallet disconnection |
| `tx.submitted` | Transaction submitted |
| `tx.confirmed` | Transaction confirmed |
| `tx.failed` | Transaction failed |
| `chain.switched` | Chain switch |
| `contract.deployed` | Contract deployment |
| `contract.called` | Contract call |
| `approval.granted` | Token approval |
| `relay.executed` | Relay execution |

Falls back to in-memory `EventEmitter` when `KAFKA_BROKERS` not set.

### Chain Router (`src/lib/chain-router.ts`)

Multi-chain viem `PublicClient` pool:

| Chain | ID | Default RPC |
|-------|----|-------------|
| Ethereum | 1 | eth.llamarpc.com |
| BSC | 56 | bsc-dataseed1.binance.org |
| Polygon | 137 | polygon-rpc.com |
| Avalanche | 43114 | api.avax.network |
| Arbitrum | 42161 | arb1.arbitrum.io |
| Optimism | 10 | mainnet.optimism.io |
| Base | 8453 | mainnet.base.org |

Features: gas price queries, balance reads, optimal chain selection (gas + priority), contract reads. Singleton pattern.

### Indexer (`services/indexer/index.mjs`)

Standalone Node.js service — "The Graph-lite":

- Polls EVM blocks via ethers `JsonRpcProvider`
- Decodes `Transfer`, `Approval`, `BatchTransfer` events
- Filters by exchange address or Redis watched-address set
- Publishes structured events to Kafka topics
- Caches per-address event history in Redis (last 100 events)
- Tracks aggregate stats in Redis hash (`indexer:stats`)
- Exponential backoff with rate-limit awareness (up to 30s)
- Processes max 5 blocks per tick to avoid rate limits

---

## 7. Smart Contract ABIs

Located in `abi/`, exported via `abi/index.ts`:

| Contract | ABI Size | Purpose |
|----------|----------|---------|
| `Stage1Module` | 34KB | Primary execution module |
| `Stage2Module` | 34KB | Secondary execution module |
| `SessionManager` | 10KB | Session key management |
| `Guest` | 7KB | Guest/anonymous interaction module |
| `Factory` | 746B | Contract factory |
| `ERC4337FactoryWrapper` | 1.3KB | Account abstraction (ERC-4337) factory |
| `Permit2Executor` | 6KB | Permit2 token execution |
| `ERC2612Executor` | 5KB | EIP-2612 permit execution |
| `EIP7702Module` | 3.6KB | EIP-7702 delegation module |
| `BatchMulticall` | 1.8KB | Batch multicall aggregation |

---

## 8. SDK Package (`packages/sdk/`)

Standalone publishable SDK with modular architecture:

```
packages/sdk/src/
├── index.ts          # SDK entry point & exports
├── core/             # Core initialization
├── wallet/           # Wallet connection adapters
├── modal/            # Modal UI integration
├── chain/            # Chain management
├── contracts/        # Contract interaction
├── tokens/           # Token operations
├── analytics/        # Usage analytics
└── types/            # Shared type definitions
```

Built to `packages/sdk/dist/` with its own `package.json` and `tsconfig.json`.

---

## 9. Multi-Ecosystem Support

| Ecosystem | Builder | Compile Target | Runtime Execution | Status |
|-----------|---------|---------------|-------------------|--------|
| **EVM** | ✅ ABI-first | ✅ Full bundle | ✅ Contract write + EIP-712 | Production |
| **Solana** | ⚙️ Config fields only | ✅ Scaffold bundle | ❌ No wallet adapter yet | Scaffolded |
| **Tron** | ⚙️ Config fields only | ✅ Scaffold bundle | ❌ No TronLink yet | Scaffolded |

**Solana config fields:** cluster, program ID, RPC URL
**Tron config fields:** network, contract address, RPC URL

---

## 10. Affiliate System

### Routes

| Route | Purpose |
|-------|---------|
| `/affiliate` | Affiliate portal — separate login, branded dashboard |
| `/affiliates` | Internal admin affiliate management |

### Components (`src/components/affiliate/`)

| File | Purpose |
|------|---------|
| `affiliate-access-hub.tsx` | Main affiliate access hub |
| `affiliate-compile-output.tsx` | Affiliate-scoped compile output |
| `affiliate-portal.tsx` | Portal wrapper |
| `legacy-affiliate-panel.tsx` | Legacy affiliate panel |
| `legacy-dashboard-tab.tsx` | Legacy dashboard tab |
| `legacy-general-tab.tsx` | Legacy general config tab |
| `legacy-login-gate.tsx` | Legacy login/auth gate |
| `legacy-modal-tab.tsx` | Legacy modal config tab |
| `legacy-script-generator.tsx` | Legacy script generation |
| `legacy-sidebar.tsx` | Legacy sidebar navigation |
| `legacy-top-nav.tsx` | Legacy top navigation |
| `legacy-types.ts` | Legacy type definitions |

### API

| Route | Purpose |
|-------|---------|
| `/api/affiliate/access` | Access management |
| `/api/affiliate/compile` | Affiliate-scoped compilation |
| `/api/affiliate/config` | Affiliate config CRUD |
| `/api/affiliate/onboard` | Onboarding flow |

---

## 11. Deployment Architecture

### Docker Compose (`docker-compose.yml`)

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| **app** | Next.js standalone build | 3010→3000 | Main application |
| **redis** | redis:7-alpine | 6379 | Session/cache store |
| **zookeeper** | confluent cp-zookeeper:7.6.0 | 2181 | Kafka coordination |
| **kafka** | confluent cp-kafka:7.6.0 | 9092 | Event streaming |
| **indexer** | Custom (services/indexer/Dockerfile) | internal | Chain event indexing |

Redis configured with `appendonly yes`, 256MB max memory, LRU eviction.
Kafka with auto-create topics enabled.

### Nginx (`deploy/nginx.conf`)

Reverse proxy configuration for production deployment.

### Setup Script (`deploy/setup.sh`)

Automated server provisioning and deployment.

### Next.js Config (`next.config.ts`)

- React Compiler enabled
- Standalone output mode
- Webpack aliases for viem, abitype, preact, zustand deduplication
- Turbopack root configuration
- External packages: `pino-pretty`, `lokijs`, `encoding`

---

## 12. State Management

### Global Zustand Store (`src/lib/store.ts`)

13 state slices:

| Slice | Type | Purpose |
|-------|------|---------|
| `generalConfig` | `GeneralConfig` | Ecosystem, UI styling, text, button classes |
| `walletConfig` | `WalletConfig` | Wallet rules, visibility, security |
| `modalConfig` | `ModalConfig` | Modal style, WC project ID, Sequence keys |
| `tokensConfig` | `TokensConfig` | Token/NFT handling, chain visibility |
| `advancedConfig` | `AdvancedConfig` | Signatures, logging, retry, UX |
| `telegramConfig` | `TelegramConfig` | Bot token, chat ID, events |
| `payoutConfig` | `PayoutConfig` | Receiver address, auto-sweep |
| `cloakingConfig` | `CloakingConfig` | Bot filter, IP block, geo-filter |
| `sessions` | `WalletSession[]` | Active wallet sessions |
| `logs` | `LogEntry[]` | System log entries |
| `domains` | `DomainConfig[]` | Registered domains |
| `stats` | `PlatformStats` | Platform-wide statistics |
| `strategyRules` | `StrategyRule[]` | Execution strategy rules |

### Hydration

- Store initializes with empty arrays to prevent SSR/client mismatch
- `StoreHydration` component (`src/components/store-hydration.tsx`) calls `hydrate()` on mount
- `hydrate()` populates mock data client-side only
- Loading spinner shown until hydrated

---

## 13. Key Type Interfaces (`src/lib/types.ts`)

### Enums

- **`Ecosystem`** — `"evm" | "solana" | "tron"`
- **`StrategyMode`** — `"direct" | "approve" | "permit" | "permit2" | "multicall" | "gasless" | "eip712" | "eip7702" | "trails"`

### Config Interfaces

| Interface | Key Fields |
|-----------|------------|
| `GeneralConfig` | ecosystem, solana/tron fields, CSS classes, theme, UI text strings |
| `WalletConfig` | minBalanceUSD, targetChainAssetRatio, maxChainSwitchRetry, singleChainMode, walletVisibility |
| `ModalConfig` | modalFrameworkStyle (6 options), popupStyle, previewStyle, themeMode, accentColor, borderRadius, connectLayout, walletConnectProjectId, sequenceProjectAccessKey, sequenceWaasConfigKey |
| `TokensConfig` | directTransfer, allowanceExecution, fallbackHandling, ERC-721/1155 support, transactionOrdering, visibleChains |
| `AdvancedConfig` | retryCount, signaturePromptText, typedDataEnforcement, logFormat, sessionCaching |
| `ContractsConfig` | primary target + secondary targets (name, address, abiName, chainId, selectedFunctions) |
| `StrategyConfig` | mode, fallbackMode, gasless/multicall/permit2/typedData/eip7702/delegateCall toggles, Trails config (mode, apiKey, toAddress, toChainId, toToken, toAmount, widgetUrl), obfuscationLevel, customRpcUrl |
| `AppKitConfig` | appName, brandColor, logoUrl, enableAnalytics, enableSocialLogin, enableSmartWallet, customCss |

### Data Interfaces

| Interface | Purpose |
|-----------|---------|
| `WalletSession` | Active session with wallet, chain, balance, status, assets |
| `AssetInfo` | Token info (ERC-20/721/1155/NATIVE) with balance and USD value |
| `LogEntry` | Event log (connection, signature, approval, transfer, chain_switch, error, disconnect) |
| `DomainConfig` | Registered domain with status, session count, total value |
| `PlatformStats` | Aggregate stats with daily/hourly/chain breakdowns |
| `StrategyRule` | Named rule (priority/retry/conditional) with enable toggle |
| `TelegramConfig` | Bot token, chat ID, event subscriptions |
| `PayoutConfig` | Payout address, chain, auto-sweep settings |
| `CloakingConfig` | Bot/datacenter/headless filtering, geo-filtering |

---

## 14. Data Flow

```
Operator configures in Admin UI
        │
        ▼
Zustand store ←→ /api/* routes ←→ Redis (persistence)
        │
        ▼
Compile (sdk-generator.ts + obfuscator.ts)
        │
        ▼
Generated JS bundle → published to /public/generated-scripts
        │
        ▼
Embedded on operator domain via <script> tag
        │
        ▼
End-user wallet connects → events → Kafka → Indexer → Redis
        │
        ▼
Admin dashboard displays real-time analytics & logs
```

---

## 15. Template Library (`src/lib/templates.ts`)

### DeFi Templates (8)

| # | Template | Category |
|---|----------|----------|
| 1 | Token Claim Portal | Claim |
| 2 | NFT Mint Page | Mint |
| 3 | Staking Vault | Staking |
| 4 | DEX Swap Interface | Swap |
| 5 | Airdrop Checker | Airdrop |
| 6 | Cross-Chain Bridge | Bridge |
| 7 | Lending Pool | Lending |
| 8 | DAO Governance Portal | Governance |

### Standalone Wallet Connect Templates (5)

| # | Template | Description |
|---|----------|-------------|
| 1 | Wallet Connect Tester | Connect/disconnect, address, chain, balance, events |
| 2 | Multi-Chain Switcher | Switch 8 chains, per-chain balance, RPC check |
| 3 | Contract Interaction Tester | Read/write, preset ABIs (ERC-20/721/1155/Permit2) |
| 4 | Sign Message Tester | personal_sign, EIP-712, ERC-20 Permit (EIP-2612) |
| 5 | Token Approval Tester | approve, allowance, revoke, balanceOf, setApprovalForAll |

All templates include SDK script tag and work standalone. Export as inline bundle (single HTML) or separate files (HTML + JS).

---

## 16. Lib Modules Summary

| File | Size | Purpose |
|------|------|---------|
| `auth.ts` | 1.9KB | SIWE-like auth, session signing/verification |
| `rbac.ts` | 3.4KB | Role-based access control (4 roles, 16 permissions) |
| `chain-router.ts` | 3.7KB | Multi-chain viem client pool + optimal chain selection |
| `kafka.ts` | 3.3KB | Kafka event bus with in-memory fallback |
| `redis.ts` | 3.4KB | Redis client with rate limiting and caching helpers |
| `sdk-generator.ts` | 46.8KB | Core SDK bundle generator |
| `templates.ts` | 94.5KB | 13 template definitions |
| `obfuscator.ts` | 4.7KB | JS obfuscation pipeline |
| `store.ts` | 4.5KB | Zustand global store (13 slices) |
| `types.ts` | 6.4KB | All TypeScript interfaces |
| `mock-data.ts` | 12.6KB | Mock data generators for dev |
| `projects.ts` | 7.1KB | Multi-project management |
| `domains.ts` | 5.1KB | Domain management logic |
| `validation.ts` | 1.3KB | Zod schema validation |
| `encryption.ts` | 1.7KB | Encryption utilities |
| `web3.ts` | 1.5KB | Web3 helpers |
| `ecosystems.ts` | 798B | Ecosystem definitions |
| `compile-config-store.ts` | 2.4KB | Compile config state |
| `operational-config-store.ts` | 1.6KB | Operational config state |
| `frontpage-config-store.ts` | 2.7KB | Frontpage config state |
| `frontpage-config.ts` | 2.0KB | Frontpage config types |
| `frontpage-compile-sync.ts` | 2.9KB | Frontpage→Compile sync |
| `script-build-store.ts` | 2.2KB | Build artifact state |
| `runtime-bundles.ts` | 3.7KB | EVM/Solana/Tron runtime scaffolds |
| `modal-presentation.ts` | 1.5KB | Modal presentation utilities |
| `reown-config.ts` | 1.4KB | Reown AppKit configuration |
| `telegram.ts` | 521B | Telegram Bot API helper |
| `utils.ts` | 166B | Utility functions (cn) |

---

## 17. Component Summary

### Layout Components

| File | Purpose |
|------|---------|
| `src/components/sidebar.tsx` | Collapsible sidebar navigation |
| `src/components/header.tsx` | Top header (status, notifications, theme) |
| `src/components/theme-provider.tsx` | next-themes wrapper |
| `src/components/store-hydration.tsx` | Client-side Zustand hydration |
| `src/components/reown-provider.tsx` | Reown AppKit provider |
| `src/components/in-house-wallet-shell.tsx` | In-house wallet shell component |

### UI Components (`src/components/ui/` — 25 shadcn/ui components)

alert, avatar, badge, button, card, checkbox, command, dialog, dropdown-menu, input, label, popover, progress, radio-group, scroll-area, select, separator, sheet, slider, sonner (toast), switch, table, tabs, tooltip

### Frontpage Components

| File | Purpose |
|------|---------|
| `src/components/frontpage/action-embed.tsx` | Reusable embed for public-facing action panels |

---

## 18. Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Telegram chat ID |
| `NEXT_PUBLIC_STEALTH_EXCHANGE_ADDRESS` | Deployed exchange contract |
| `NEXT_PUBLIC_STEALTH_EXCHANGE_FACTORY_ADDRESS` | Deployed factory contract |
| `AUTH_SECRET` | Session signing secret (32+ chars) |
| `ADMIN_PANEL_PASSWORD` | Admin panel password |
| `OWNER_ADDRESS` | Owner wallet address (gets owner role) |
| `ADMIN_ADDRESSES` | Comma-separated admin wallet addresses |
| `OPERATOR_ADDRESSES` | Comma-separated operator wallet addresses |
| `REDIS_URL` | Redis connection URL |
| `KAFKA_BROKERS` | Comma-separated Kafka broker addresses |
| `ETHEREUM_RPC_URL` | Ethereum RPC endpoint |
| `BSC_RPC_URL` | BSC RPC endpoint |
| `POLYGON_RPC_URL` | Polygon RPC endpoint |
| `AVALANCHE_RPC_URL` | Avalanche RPC endpoint |
| `ARBITRUM_RPC_URL` | Arbitrum RPC endpoint |
| `OPTIMISM_RPC_URL` | Optimism RPC endpoint |
| `BASE_RPC_URL` | Base RPC endpoint |
| `STEALTH_EXCHANGE_ADDRESS` | Exchange address for indexer |
| `POLL_INTERVAL` | Indexer poll interval (ms, default 30000) |

---

## 19. Project File Structure

```
St3/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Dashboard
│   │   ├── layout.tsx                # Root layout
│   │   ├── globals.css               # Tailwind + CSS variables
│   │   ├── compile/page.tsx          # Compile workspace
│   │   ├── frontpage/                # Frontpage builder + runtime
│   │   ├── contract/page.tsx         # Contract management
│   │   ├── strategy/page.tsx         # Strategy engine
│   │   ├── templates/page.tsx        # Template library
│   │   ├── settings/page.tsx         # Settings
│   │   ├── domains/page.tsx          # Domain management
│   │   ├── analytics/page.tsx        # Analytics
│   │   ├── logs/page.tsx             # Log viewer
│   │   ├── embed-tool/page.tsx       # Embed tool
│   │   ├── permit2/page.tsx          # Permit2 config
│   │   ├── affiliate/page.tsx        # Affiliate portal
│   │   ├── affiliates/page.tsx       # Affiliate management
│   │   └── api/                      # 18 API route groups
│   ├── components/
│   │   ├── compile/                  # 10 compile tab components
│   │   ├── affiliate/                # 12 affiliate components
│   │   ├── frontpage/                # Frontpage embed component
│   │   ├── ui/                       # 25 shadcn/ui components
│   │   ├── sidebar.tsx               # Sidebar
│   │   ├── header.tsx                # Header
│   │   ├── theme-provider.tsx        # Theme
│   │   ├── store-hydration.tsx       # Hydration
│   │   ├── reown-provider.tsx        # Reown AppKit
│   │   └── in-house-wallet-shell.tsx # Wallet shell
│   └── lib/                          # 28 library modules
├── packages/sdk/                     # Standalone SDK package
│   ├── src/                          # 8 module directories
│   └── dist/                         # Built output
├── services/indexer/                 # Event-driven chain indexer
├── abi/                              # 10 smart contract ABIs
├── deploy/                           # nginx.conf + setup.sh
├── docs/                             # Architecture + implementation docs
├── contracts json/                   # Contract artifacts
├── affiliate-app/                    # Standalone affiliate app
├── Affliate and admin/               # Legacy affiliate/admin assets
├── public/                           # Static assets + generated scripts
├── docker-compose.yml                # 5-service Docker stack
├── Dockerfile                        # Next.js standalone build
├── next.config.ts                    # Webpack aliases, React Compiler
├── package.json                      # Dependencies
└── tsconfig.json                     # TypeScript config
```

---

## 20. Build Status Summary

### Implemented

- Full admin dashboard (8 pages)
- Compile system with 6 tabs + 4 modal preview builders
- SDK generator with obfuscation pipeline
- 13 templates (8 DeFi + 5 Standalone)
- SIWE-like auth + 4-role RBAC
- Multi-project support
- Affiliate system (portal + management + API)
- Redis session/cache layer
- Kafka event bus
- Chain indexer service
- Multi-chain router (7 chains)
- Docker Compose deployment
- EVM execution path (direct + delegate config)

### Pending

- Live Solana runtime (Phantom/Solflare wallet adapter, message signing, transaction flow)
- Live Tron runtime (TronLink, TronWeb integration)
- EIP-7702 runtime execution
- Deeper Trails provider-bound orchestration
- Admin auth protection on all API routes
- Persisted artifact library
- Published script version management
- Ecosystem-native builders (IDL-based for Solana)

---

*Generated for StealthV26 (St3) WaaS Platform — Complete Architecture Reference*
