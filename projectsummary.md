# StealthV26 — Wallet-as-a-Service (WaaS) Platform

## Project Summary

**Version:** 26.0.0  
**Framework:** Next.js 15 (App Router) + React 19  
**UI:** TailwindCSS + shadcn/ui + Lucide Icons  
**State:** Zustand  
**Charts:** Recharts  
**Theme:** Dark/Light via next-themes  
**Language:** TypeScript (strict)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Pages & Features](#pages--features)
5. [Compile Module (SDK Generator)](#compile-module-sdk-generator)
6. [Web3Modal Integration](#web3modal-integration)
7. [DeFi Template Library](#defi-template-library)
8. [Standalone Wallet Connect Templates](#standalone-wallet-connect-templates)
9. [API Routes](#api-routes)
10. [State Management](#state-management)
11. [Configuration Types](#configuration-types)
12. [Setup & Running](#setup--running)
13. [Build Steps Timeline](#build-steps-timeline)
14. [Key Decisions & Fixes](#key-decisions--fixes)

---

## Architecture Overview

```
stealth-v26/
├── src/
│   ├── app/                    # Next.js App Router pages + API routes
│   │   ├── page.tsx            # Dashboard (home)
│   │   ├── layout.tsx          # Root layout (sidebar, header, theme, hydration)
│   │   ├── globals.css         # Tailwind + CSS variables
│   │   ├── compile/page.tsx    # Compile module (tabbed config + SDK output)
│   │   ├── templates/page.tsx  # DeFi + Standalone template library
│   │   ├── logs/page.tsx       # Log viewer
│   │   ├── analytics/page.tsx  # Analytics & performance charts
│   │   ├── domains/page.tsx    # Domain management
│   │   ├── settings/page.tsx   # Payout, Telegram, Cloaking settings
│   │   ├── strategy/page.tsx   # Strategy engine rules
│   │   └── api/                # Backend API routes
│   │       ├── config/route.ts
│   │       ├── logs/route.ts
│   │       ├── domains/route.ts
│   │       ├── analytics/route.ts
│   │       ├── telegram/route.ts
│   │       └── compile/route.ts
│   ├── components/
│   │   ├── sidebar.tsx         # Collapsible sidebar navigation
│   │   ├── header.tsx          # Top header (status, notifications, theme toggle)
│   │   ├── theme-provider.tsx  # next-themes wrapper
│   │   ├── store-hydration.tsx # Client-side Zustand hydration wrapper
│   │   ├── compile/            # Compile tab components
│   │   │   ├── general-tab.tsx
│   │   │   ├── wallet-tab.tsx
│   │   │   ├── modal-tab.tsx
│   │   │   ├── tokens-tab.tsx
│   │   │   ├── advanced-tab.tsx
│   │   │   └── compile-output.tsx
│   │   └── ui/                 # shadcn/ui components (24 components)
│   └── lib/
│       ├── types.ts            # TypeScript interfaces for all configs
│       ├── mock-data.ts        # Mock data generators for development
│       ├── store.ts            # Zustand global store
│       ├── templates.ts        # DeFi + Standalone template definitions (13 templates)
│       ├── sdk-generator.ts    # Real Web3Modal SDK bundle generator
│       └── utils.ts            # Utility functions (cn)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── components.json             # shadcn/ui configuration
├── next.config.ts
└── projectsummary.md           # This file
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 15 (App Router) | SSR, routing, API routes |
| **UI Library** | React 19 | Component rendering |
| **Styling** | TailwindCSS 4 | Utility-first CSS |
| **Components** | shadcn/ui | Pre-built accessible UI components |
| **Icons** | Lucide React | Consistent icon system |
| **State** | Zustand | Global state management |
| **Charts** | Recharts | Dashboard & analytics visualizations |
| **Theme** | next-themes | Dark/light mode |
| **Toasts** | Sonner | Toast notifications |
| **Web3** | @web3modal/cdn (WalletConnect) | Real wallet connection modal |
| **Language** | TypeScript (strict) | Type safety |

---

## Pages & Features

### 1. Dashboard (`/` — `src/app/page.tsx`)
- **Real-time stats cards:** Total sessions, connected wallets, total value, success rate
- **Session activity area chart** (7-day trend)
- **Chain distribution pie chart** (ETH, BSC, Polygon, etc.)
- **Hourly activity bar chart** (24h)
- **Active sessions table** with wallet, chain, balance, status, domain, country
- **Recent logs feed** with event types and timestamps
- Uses Zustand store data, hydrated client-side to prevent SSR mismatches

### 2. Compile (`/compile` — `src/app/compile/page.tsx`)
Tabbed interface with 6 tabs:

- **General Tab** (`general-tab.tsx`): CSS classes for buttons, theme mode, UI text strings (connect, connected, loading, verify, reject, etc.), transaction function name
- **Wallet Tab** (`wallet-tab.tsx`): Min balance, chain asset ratio, max chain switch retries, single-chain mode, wallet visibility toggles (MetaMask, WalletConnect, Coinbase, Trust, Phantom, Rabby), security controls
- **Modal Tab** (`modal-tab.tsx`): Framework style, popup style, **WalletConnect Project ID**, latest WC toggle, expose external SDK, click-to-open behavior
- **Tokens Tab** (`tokens-tab.tsx`): ERC-20 handling (direct transfer, allowance, fallback, balance-based), NFT support (ERC-721, ERC-1155, marketplace transfers), custom contract functions, chain visibility
- **Advanced Tab** (`advanced-tab.tsx`): Retry count, signature prompt text, EIP-712 enforcement, auto-sign, logging format, session caching, eligibility reload, post-TX refresh
- **Compile Output** (`compile-output.tsx`): Compiles all config into a real JS SDK bundle, copy/download/browse templates

### 3. Templates (`/templates` — `src/app/templates/page.tsx`)
- **13 total templates** across 9 categories
- Category filter pills (All, Claim, Mint, Staking, Swap, Airdrop, Bridge, Lending, Governance, Standalone WC)
- Search by name/tag
- Preview templates in iframe dialog
- Export options:
  - **Inline Bundle:** Single HTML file with SDK embedded
  - **Separate Files:** HTML + JS as separate downloads

### 4. Logs (`/logs` — `src/app/logs/page.tsx`)
- Filterable log table (search, event type, chain)
- Log type summary cards (wallet_connect, signature, chain_switch, error)
- Sortable table with message, wallet, chain, domain, timestamp

### 5. Analytics (`/analytics` — `src/app/analytics/page.tsx`)
- Key metrics: success rate, avg value/session, active domains, top chain
- Conversion funnel visualization
- Chain performance bar chart
- Execution method distribution pie chart
- Event type breakdown
- Session status radar chart
- Domain performance table

### 6. Domains (`/domains` — `src/app/domains/page.tsx`)
- Add/remove domains
- Toggle active/paused status
- Domain summary (total, active, sessions, value)
- Domain table with details and actions

### 7. Settings (`/settings` — `src/app/settings/page.tsx`)
Tabbed interface:
- **Payout:** Receiver address, auto-sweep toggle, min sweep amount, sweep interval
- **Telegram:** Bot token, chat ID, event subscriptions (connects, signatures, errors, chain switches, high value), message format, quiet hours
- **Cloaking & Filters:** Bot filtering, IP blocking, headless browser detection, geo-filtering (countries), VPN/proxy detection

### 8. Strategy Engine (`/strategy` — `src/app/strategy/page.tsx`)
- Strategy rule management (priority, retry, conditional rules)
- Execution flow diagram
- Simulated contract functions
- Expandable rule rows with enable/disable toggles

---

## Compile Module (SDK Generator)

**File:** `src/lib/sdk-generator.ts`

The SDK generator produces a self-contained JavaScript ES Module that:

1. **Loads Web3Modal from CDN** (`@web3modal/cdn@5.1.11`) via dynamic `import()`
2. **Configures chains** based on the Compile → Tokens tab settings
3. **Creates a Web3Modal instance** with the user's WalletConnect Project ID
4. **Subscribes to provider state** to detect connections/disconnections
5. **Auto-binds to DOM elements:**
   - `data-sv26-button` attribute → injects `<w3m-button>` web component
   - Custom CSS class (configurable) → opens Web3Modal on click
   - Action/disconnect class bindings
6. **Post-connection:** Auto-signature prompts, asset scanning, EIP-712 typed data
7. **Asset scanning:** Native balance + ERC-20 token balances (USDT, USDC, DAI, WBTC on Ethereum; USDT, USDC, BUSD on BSC; USDT, USDC, DAI on Polygon)
8. **Exposes global SDK** (configurable): `window.StealthV26.connect()`, `.disconnect()`, `.sign()`, `.scan()`, `.getState()`, `.getModal()`

### Integration Methods

```html
<!-- Method 1: Module script -->
<script type="module" src="stealthv26.min.js"></script>

<!-- Method 2: Auto-injected Web3Modal button -->
<div data-sv26-button></div>

<!-- Method 3: Custom button -->
<button class="connect-btn">Connect Wallet</button>

<!-- Method 4: Native Web3Modal web component -->
<w3m-button balance="show"></w3m-button>
```

### Supported Chains (configurable)

| Chain | ID | Symbol |
|-------|----|--------|
| Ethereum | 1 | ETH |
| BSC | 56 | BNB |
| Polygon | 137 | MATIC |
| Avalanche | 43114 | AVAX |
| Arbitrum | 42161 | ETH |
| Optimism | 10 | ETH |
| Base | 8453 | ETH |
| zkSync | 324 | ETH |
| Linea | 59144 | ETH |

---

## Web3Modal Integration

**Key change:** The SDK uses the **real WalletConnect Web3Modal** (`@web3modal/cdn`) loaded from the jsdelivr CDN. This replaces any custom modal implementation.

### How it works:

1. SDK is generated as an **ES Module** (requires `<script type="module">`)
2. On init, it dynamically imports `createWeb3Modal` and `defaultConfig` from the CDN
3. Configures the modal with:
   - **Project ID** from Compile → Modal tab (`walletConnectProjectId`)
   - **Chains** from Compile → Tokens tab (`visibleChains`)
   - **Theme** from Compile → General tab (`themeMode`)
   - **Metadata** auto-detected from the host page (title, origin, favicon)
4. Subscribes to `w3modal.subscribeProvider()` for real-time connection state
5. Supports 300+ wallets including MetaMask, WalletConnect (QR code for mobile), Coinbase Wallet, Trust Wallet, Phantom, Rabby, and all EIP-6963 compliant wallets

### WalletConnect Project ID

- **Required for production.** Get one free at [cloud.walletconnect.com](https://cloud.walletconnect.com)
- Set in the admin dashboard: **Compile → Modal tab → WalletConnect Project ID**
- If not set, the SDK will use a placeholder and show a warning in the Compile Output

---

## DeFi Template Library

**File:** `src/lib/templates.ts`

### DeFi Templates (8)

| # | Template | Category | Description |
|---|----------|----------|-------------|
| 1 | Token Claim Portal | Claim | Claim ERC-20 tokens with eligibility check |
| 2 | NFT Mint Page | Mint | Mint NFTs with price, supply counter, wallet connect |
| 3 | Staking Vault | Staking | Stake tokens, view APY, claim rewards |
| 4 | DEX Swap Interface | Swap | Token swap UI with routing display |
| 5 | Airdrop Checker | Airdrop | Check airdrop eligibility by wallet |
| 6 | Cross-Chain Bridge | Bridge | Bridge assets between chains |
| 7 | Lending Pool | Lending | Supply/borrow assets with APY rates |
| 8 | DAO Governance Portal | Governance | View proposals, vote with connected wallet |

### Standalone Wallet Connect Templates (5)

| # | Template | Description |
|---|----------|-------------|
| 1 | Wallet Connect Tester | Core connect/disconnect, address, chain, balance, provider info, event log |
| 2 | Multi-Chain Switcher | Switch across 8 chains, balance per chain, RPC check, chain change events |
| 3 | Contract Interaction Tester | Read/write on any contract, preset ABIs (ERC-20/721/1155/Permit2), custom functions |
| 4 | Sign Message Tester | personal_sign, EIP-712 typed data, ERC-20 Permit (EIP-2612), signature counter |
| 5 | Token Approval Tester | approve(), allowance(), revoke, balanceOf(), setApprovalForAll, known tokens |
| 6 | Batch Transaction Tester | TX queue, sequential execution, progress bar, per-TX status, native/approve/transfer/NFT/custom |

All templates include `<script src="stealthv26.min.js"></script>` and work standalone. When exported via the Templates page, the SDK is bundled inline or as a separate file.

---

## API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/config` | GET, POST | Platform configuration (status, version, modules, chains) |
| `/api/logs` | GET, POST | Retrieve filtered/paginated logs, record new entries |
| `/api/domains` | GET, POST, DELETE | Domain CRUD operations |
| `/api/analytics` | GET | Platform statistics |
| `/api/telegram` | POST | Send messages via Telegram Bot API |
| `/api/compile` | POST | Server-side SDK compilation |

---

## State Management

**File:** `src/lib/store.ts` — Zustand store

### Store Slices

| Slice | Type | Purpose |
|-------|------|---------|
| `generalConfig` | GeneralConfig | UI styling, text, button classes |
| `walletConfig` | WalletConfig | Wallet rules, visibility, security |
| `modalConfig` | ModalConfig | Modal style, WC project ID |
| `tokensConfig` | TokensConfig | Token/NFT handling, chain visibility |
| `advancedConfig` | AdvancedConfig | Signatures, logging, retry, UX |
| `telegramConfig` | TelegramConfig | Bot token, chat ID, events |
| `payoutConfig` | PayoutConfig | Receiver address, auto-sweep |
| `cloakingConfig` | CloakingConfig | Bot filter, IP block, geo-filter |
| `sessions` | WalletSession[] | Active wallet sessions |
| `logs` | LogEntry[] | System log entries |
| `domains` | DomainConfig[] | Registered domains |
| `stats` | PlatformStats | Platform-wide statistics |
| `strategyRules` | StrategyRule[] | Execution strategy rules |

### Hydration

- Store initializes with **empty arrays** to prevent SSR/client mismatch
- `StoreHydration` component calls `hydrate()` action on mount
- `hydrate()` populates mock data client-side only
- Loading spinner shown until hydrated

---

## Configuration Types

**File:** `src/lib/types.ts`

### Key Interfaces

- **GeneralConfig**: connectButtonClass, actionButtonClass, disconnectButtonClass, themeMode, connectText, connectedText, loadingText, verifyText, rejectText, changeChainText, rejectChainText, notEligibleText, disconnectText, transactionFunctionName
- **WalletConfig**: minBalanceUSD, targetChainAssetRatio, maxChainSwitchRetry, singleChainMode, walletVisibility, devToolsMonitoring, providerDetection, autoLoadScripts, waitForPageLoad
- **ModalConfig**: modalFrameworkStyle, popupStyle, **walletConnectProjectId**, enableLatestWC, exposeExternalSDK, clickToOpenModal
- **TokensConfig**: directTransfer, allowanceExecution, fallbackHandling, balanceBasedApproval, erc721Support, erc1155Support, marketplaceTransfers, transactionOrdering, contractFunctions, visibleChains
- **AdvancedConfig**: retryCount, signaturePromptText, typedDataEnforcement, autoSignaturePrompt, logFormat, logSignaturePrompts, logChainSwitchEvents, logFullSiteURL, sessionCaching, eligibilityReload, postTransactionRefresh
- **TelegramConfig**: botToken, chatId, events, messageFormat, quietHours
- **PayoutConfig**: address, autoSweep, minSweepAmount, sweepInterval
- **CloakingConfig**: enableBotFilter, blockIPs, detectHeadless, geoFilter, blockVPN

---

## Setup & Running

### Prerequisites
- Node.js 18+
- npm or yarn

### Install & Run

```bash
cd stealth-v26
npm install
npm run dev
```

App runs at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

### Key Dependencies

```json
{
  "next": "15.x",
  "react": "19.x",
  "zustand": "5.x",
  "recharts": "2.x",
  "lucide-react": "latest",
  "sonner": "latest",
  "next-themes": "latest",
  "@radix-ui/*": "latest (via shadcn/ui)"
}
```

---

## Build Steps Timeline

| Step | Task | Status |
|------|------|--------|
| 1 | Initialize Next.js project with TailwindCSS, shadcn/ui, all dependencies | Done |
| 2 | Build layout: collapsible sidebar, header, dark/light theme | Done |
| 3 | Build Dashboard: real-time stats, session monitoring, charts, tables | Done |
| 4 | Build Compile module: General, Wallet, Modal, Tokens, Advanced tabs | Done |
| 5 | Build Logs page: filterable log viewer with search and type/chain filters | Done |
| 6 | Build Analytics page: conversion funnel, chain charts, method distribution | Done |
| 7 | Build Settings page: Payout, Telegram, Cloaking tabs | Done |
| 8 | Build Domain Management: add/remove/toggle domains with stats | Done |
| 9 | Build Strategy Engine: rule management, execution flow, contract functions | Done |
| 10 | Build Backend API routes: config, logs, domains, analytics, telegram, compile | Done |
| 11 | Build DeFi Template Library: 8 templates with preview, filter, export | Done |
| 12 | Build Plug-and-Play JS SDK Generator: wallet modal, asset scanner, EIP-712 | Done |
| 13 | Add Template Export: inline bundle, separate files, download | Done |
| 14 | Update Compile Output: real SDK generator, copy/download, integration snippets | Done |
| 15 | Build Standalone WC Test Templates: 5 interactive testing pages | Done |
| 16 | Integrate Real Web3Modal (@web3modal/cdn) with WalletConnect Project ID | Done |
| 17 | Create comprehensive projectsummary.md | Done |

---

## Key Decisions & Fixes

### 1. Hydration Mismatch Fix
- **Problem:** `Math.random()` in mock data generators produced different values on server vs. client
- **Solution:** Initialize Zustand store with empty data; hydrate client-side via `StoreHydration` component

### 2. Real Web3Modal Integration
- **Decision:** Use `@web3modal/cdn@5.1.11` from jsdelivr CDN via dynamic `import()`
- **Reason:** Real production wallet connection supporting 300+ wallets, WalletConnect QR codes, EIP-6963
- **Output:** SDK generates ES Module (`<script type="module">`) instead of IIFE

### 3. Template Architecture
- Templates are self-contained HTML strings with inline CSS and JavaScript
- SDK script tag is appended at the bottom for plug-and-play use
- Export bundles the SDK inline for single-file distribution

### 4. State Management with Zustand
- Single store with all config slices + action updaters
- Each Compile tab reads/writes its own config slice
- SDK generator reads all slices to produce the final bundle

### 5. shadcn/ui Components Used (24)
alert, avatar, badge, button, card, checkbox, command, dialog, dropdown-menu, input, label, popover, progress, radio-group, scroll-area, select, separator, sheet, slider, sonner (toast), switch, table, tabs, tooltip

---

## File Count Summary

| Category | Count |
|----------|-------|
| **Pages** | 8 (Dashboard, Compile, Templates, Logs, Analytics, Domains, Settings, Strategy) |
| **API Routes** | 6 (config, logs, domains, analytics, telegram, compile) |
| **Compile Tabs** | 6 (General, Wallet, Modal, Tokens, Advanced, Output) |
| **Layout Components** | 4 (Sidebar, Header, ThemeProvider, StoreHydration) |
| **UI Components** | 24 (shadcn/ui) |
| **Lib Files** | 6 (types, mock-data, store, templates, sdk-generator, utils) |
| **Templates** | 13 (8 DeFi + 5 Standalone WC) |
| **Total Source Files** | 51 |

---

*Generated for StealthV26 WaaS Platform — Wallet-as-a-Service*
