# StealthV26 WaaS — Production Deployment Specification (PDS)

> **Version:** 1.0 — April 2025
> **Target:** Go live TODAY on a single VPS with high-availability fundamentals.

---

## Table of Contents

1. [Module 1: The Infrastructure Stack (The "Where")](#module-1-the-infrastructure-stack)
2. [Module 2: The Connection Logic (Solving the "Wandering" Problem)](#module-2-the-connection-logic)
3. [Module 3: The Deployment Pipeline (The "How")](#module-3-the-deployment-pipeline)
4. [Module 4: The "Go-Live" Validation (The Test)](#module-4-the-go-live-validation)

---

## Module 1: The Infrastructure Stack

### 1.1 Hosting Requirement

| Component        | Minimum Spec                              |
| ---------------- | ----------------------------------------- |
| **Provider**     | Any VPS: DigitalOcean, Hetzner, AWS EC2, Vultr |
| **OS Image**     | Ubuntu 22.04 LTS (x86_64)                |
| **vCPUs**        | 2 cores                                  |
| **RAM**          | 4 GB (script adds 2 GB swap if < 4 GB)   |
| **Disk**         | 40 GB SSD                                |
| **Bandwidth**    | 1 TB/month                               |

**Recommended for scale:** DigitalOcean Droplet $24/mo (2 vCPU, 4 GB, 80 GB SSD) or Hetzner CX31 equivalent.

### 1.2 Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                            │
│                    DNS A → VPS_IP                            │
└──────────────┬──────────────────────────────────────────────┘
               │
        ┌──────▼──────┐
        │  UFW Firewall │  Ports: 22 (SSH), 80, 443 only
        └──────┬──────┘
               │
        ┌──────▼──────────────────┐
        │  Nginx (host)           │
        │  :80 → 301 → :443      │
        │  :443 SSL (Certbot)     │
        │  Rate limit zones:      │
        │    api:  30 req/s       │
        │    script: 10 req/s     │
        └──────┬──────────────────┘
               │ proxy_pass 127.0.0.1:3000
               │
  ┌────────────▼───────────────────────────────┐
  │  Docker Network (bridge)                    │
  │                                             │
  │  ┌─────────────┐    ┌──────────────────┐   │
  │  │  waas-app    │    │  waas-redis      │   │
  │  │  Next.js 16  │◄──►│  Redis 7 (AOF)   │   │
  │  │  :3000       │    │  :6379           │   │
  │  └──────┬───────┘    └──────────────────┘   │
  │         │                                    │
  │  ┌──────▼───────┐    ┌──────────────────┐   │
  │  │  waas-kafka  │    │  waas-indexer     │   │
  │  │  Kafka 7.6   │◄──►│  Node.js 20      │   │
  │  │  :9092       │    │  Blockchain poll  │   │
  │  └──────┬───────┘    └──────────────────┘   │
  │  ┌──────▼───────┐                           │
  │  │  waas-zk     │                           │
  │  │  Zookeeper   │                           │
  │  └──────────────┘                           │
  └─────────────────────────────────────────────┘
```

**Ports exposed to host (loopback only):**

| Port | Service       | Binding              |
| ---- | ------------- | -------------------- |
| 3000 | Next.js app   | `127.0.0.1:3000` (Nginx proxies here) |
| 6379 | Redis         | `127.0.0.1:6379` (internal only) |
| 80   | Nginx HTTP    | `0.0.0.0:80` (public) |
| 443  | Nginx HTTPS   | `0.0.0.0:443` (public) |

**Critical:** Redis and Kafka are **never** exposed to the internet. Docker binds them to `127.0.0.1` only.

### 1.3 Database / Persistence

**Engine:** Redis 7 (Alpine) — this is the **only** data store. There is no SQL database.

All platform data lives in Redis:
- Affiliate projects (`affiliate:{id}`)
- Affiliate SDK configs (`affiliate:{id}:config`)
- Domain management (`domain:{id}`)
- Usage counters (`hits:{configId}:{date}`)
- Rate limiting keys (`rl:*`)
- Indexer state (`indexer:lastBlock`, `indexer:stats`)
- Event cache (`events:{address}`)

**Persistence configuration (in `docker-compose.prod.yml`):**

```
redis-server
  --appendonly yes          # AOF persistence — survives restarts
  --maxmemory 512mb
  --maxmemory-policy noeviction   # CRITICAL: never evict data silently
  --save 60 1000            # RDB snapshot every 60s if 1000+ writes
  --save 300 10             # RDB snapshot every 5min if 10+ writes
```

**Volume:** `redis_data` Docker volume mapped to `/data` inside the container. Survives `docker compose down` and reboots.

**Backup strategy (add to crontab):**

```bash
# Daily Redis backup at 2 AM
0 2 * * * docker exec waas-redis redis-cli BGSAVE && \
  docker cp waas-redis:/data/dump.rdb /opt/backups/redis-$(date +\%Y\%m\%d).rdb
```

**Additional persistent volumes:**

| Volume          | Purpose                                    |
| --------------- | ------------------------------------------ |
| `app_data`      | `data/` dir: compile configs, build records |
| `app_generated` | `public/generated-scripts/`: compiled JS bundles |
| `kafka_data`    | Kafka event log retention (7 days default) |

---

## Module 2: The Connection Logic

### 2.1 API Gateway Mapping — Complete Endpoint Structure

Every API route in the system and what it does:

#### Core SDK Pipeline

| Method | Endpoint                          | Purpose                         | Auth Required |
| ------ | --------------------------------- | ------------------------------- | ------------- |
| GET    | `/api/health`                     | Health check (Docker, Nginx, monitors) | No |
| GET    | `/api/script?configId={id}`       | Serve obfuscated SDK bundle to affiliate sites | No |
| POST   | `/api/compile`                    | Compile SDK from admin dashboard config | Session |
| GET    | `/api/compile`                    | Get current compile config + builds | Session |
| GET    | `/api/compile-config`             | Read raw compile config | Session |

#### Affiliate Management

| Method | Endpoint                                    | Purpose                          | Auth Required |
| ------ | ------------------------------------------- | -------------------------------- | ------------- |
| GET    | `/api/projects`                             | List all affiliate projects      | Session (owner/admin) |
| POST   | `/api/projects`                             | Create new affiliate project     | Session (owner/admin) |
| GET    | `/api/projects/{id}`                        | Get project details              | Session |
| PATCH  | `/api/projects/{id}`                        | Update project                   | Session |
| DELETE | `/api/projects/{id}`                        | Delete project                   | Session (owner) |
| GET    | `/api/projects/{id}/config`                 | Get affiliate SDK config         | Session |
| POST   | `/api/projects/{id}/config`                 | Save affiliate SDK config        | Session |
| POST   | `/api/projects/{id}/compile`                | Compile affiliate-specific SDK   | Session |
| GET    | `/api/projects/{id}/stats`                  | Get affiliate usage stats        | Session |

#### Authentication (SIWE Flow)

| Method | Endpoint                | Purpose                          |
| ------ | ----------------------- | -------------------------------- |
| GET    | `/api/auth/nonce`       | Generate SIWE nonce              |
| POST   | `/api/auth/verify`      | Verify wallet signature, set session cookie |
| GET    | `/api/auth/me`          | Get current session user         |
| POST   | `/api/auth/logout`      | Clear session cookie             |
| POST   | `/api/admin/access`     | Admin panel password login       |
| POST   | `/api/affiliate/access` | Affiliate login via secret       |

#### Relay & Blockchain

| Method | Endpoint              | Purpose                             |
| ------ | --------------------- | ----------------------------------- |
| POST   | `/api/relay/batch`    | Server-side batch Permit2 relay     |
| GET    | `/api/indexer`        | Get indexer stats from Redis        |

#### Other

| Method | Endpoint                  | Purpose                        |
| ------ | ------------------------- | ------------------------------ |
| GET    | `/api/analytics`          | Dashboard analytics data       |
| GET    | `/api/domains`            | List registered domains        |
| POST   | `/api/domains`            | Add/verify domain              |
| GET    | `/api/logs`               | Fetch event logs               |
| GET    | `/api/config`             | Operational config read        |
| POST   | `/api/operational-config` | Update operational config      |
| GET    | `/api/contracts`          | List tracked contracts         |
| POST   | `/api/telegram`           | Send test Telegram message     |

### 2.2 Authentication / Handshake — Script ↔ Backend

There are **two distinct auth contexts**:

#### A) Admin Dashboard Authentication (SIWE + HMAC Sessions)

```
Browser → GET /api/auth/nonce → returns nonce
Browser → wallet signs SIWE message with nonce
Browser → POST /api/auth/verify { message, signature }
Server  → verifies sig, creates HMAC-signed session token
Server  → sets s26_session cookie (httpOnly, secure, sameSite=lax)
Browser → all /api/* calls include cookie automatically
```

**Session token format:** `base64url(JSON).HMAC-SHA256(base64url(JSON), AUTH_SECRET)`

**Role resolution:** `resolveRole(address)` in `src/lib/rbac.ts` maps wallet addresses from env vars:
- `OWNER_ADDRESS` → `owner` (full permissions)
- `ADMIN_ADDRESSES` → `admin`
- `OPERATOR_ADDRESSES` → `operator`
- Everyone else → `viewer` (read-only)

#### B) Generated Script ↔ Backend (Stateless, Signed Permits)

The generated SDK scripts do **NOT** authenticate to the backend API. Instead:

1. **Script serving** (`GET /api/script?configId=aff_xxxx`): Unauthenticated — this is a public CDN-like endpoint. Security is via:
   - Rate limiting (Nginx `script` zone: 10 req/s)
   - Domain locking (obfuscator locks script to affiliate's registered domains)
   - Config ID validation (must be `status: "active"`)

2. **Relay endpoint** (`POST /api/relay/batch`): Secured by:
   - EIP-712 typed data signature from the user's wallet (Permit2 batch)
   - On-chain verification: the `StealthExchange` contract validates the signature
   - Server-side rate limit: 10 requests per user address per 60 seconds
   - Relayer authorization check: contract verifies `authorizedExecutors(relayerAddress)`

3. **Direct on-chain transactions**: No backend needed — the SDK calls contracts directly via the user's wallet provider.

### 2.3 Environment Variable Matrix

See `.env.production.template` (created in this repo). Complete reference:

| Variable | Required | Used By | Purpose |
| -------- | -------- | ------- | ------- |
| `NEXT_PUBLIC_BASE_URL` | ✅ | App | Full production URL |
| `NEXT_PUBLIC_APP_URL` | ✅ | Reown AppKit | Wallet metadata |
| `AUTH_SECRET` | ✅ | `auth.ts` | HMAC session signing (min 32 chars) |
| `ENCRYPTION_KEY` | ✅ | `encryption.ts` | AES-256-GCM for Telegram tokens |
| `ADMIN_PANEL_PASSWORD` | ✅ | `auth.ts` | Admin dashboard login |
| `OWNER_ADDRESS` | ✅ | `rbac.ts` | Owner wallet address |
| `ADMIN_ADDRESSES` | ◻️ | `rbac.ts` | Comma-separated admin wallets |
| `OPERATOR_ADDRESSES` | ◻️ | `rbac.ts` | Comma-separated operator wallets |
| `NEXT_PUBLIC_STEALTH_EXCHANGE_ADDRESS` | ✅ | SDK generator, relay | Exchange contract address |
| `NEXT_PUBLIC_STEALTH_EXCHANGE_FACTORY_ADDRESS` | ✅ | SDK generator | Factory contract address |
| `RELAYER_PRIVATE_KEY` | ⚠️ | `relay/batch` | Hot wallet key for gasless relay |
| `ETHEREUM_RPC_URL` | ✅ | Chain router, indexer, relay | Primary chain RPC |
| `BSC_RPC_URL` | ◻️ | Chain router | BSC RPC |
| `POLYGON_RPC_URL` | ◻️ | Chain router | Polygon RPC |
| `ARBITRUM_RPC_URL` | ◻️ | Chain router | Arbitrum RPC |
| `OPTIMISM_RPC_URL` | ◻️ | Chain router | Optimism RPC |
| `BASE_RPC_URL` | ◻️ | Chain router | Base RPC |
| `AVALANCHE_RPC_URL` | ◻️ | Chain router | Avalanche RPC |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ✅ | Reown AppKit, SDK | From cloud.reown.com |
| `NEXT_PUBLIC_PROJECT_ID` | ◻️ | Reown AppKit | Alias for above |
| `TELEGRAM_BOT_TOKEN` | ◻️ | `telegram.ts` | Platform-level alerts |
| `TELEGRAM_CHAT_ID` | ◻️ | `telegram.ts` | Platform-level alerts |
| `REDIS_URL` | Auto | Docker override | `redis://redis:6379` |
| `KAFKA_BROKERS` | Auto | Docker override | `kafka:9092` |
| `REDIS_PASSWORD` | ◻️ | Docker Compose | Optional Redis auth |
| `STEALTH_EXCHANGE_ADDRESS` | ◻️ | Indexer | Address filter for indexer |
| `POLL_INTERVAL` | ◻️ | Indexer | Block polling interval (ms) |

**Generate secrets:**

```bash
# AUTH_SECRET
openssl rand -hex 32

# ENCRYPTION_KEY
openssl rand -hex 32

# ADMIN_PANEL_PASSWORD
openssl rand -base64 16
```

---

## Module 3: The Deployment Pipeline

### 3.1 The Deployment Sequence

```
┌──────────────────────────────────────────────────────────┐
│  Step 0: Local Prep                                       │
│  ├── Fill .env.production.template → .env.local           │
│  ├── Set DNS A record: yourdomain.com → VPS_IP            │
│  └── Wait for DNS propagation (check: dig yourdomain.com) │
├──────────────────────────────────────────────────────────┤
│  Step 1: Push code to VPS                                 │
│  └── git clone / rsync to /opt/stealthv26                 │
├──────────────────────────────────────────────────────────┤
│  Step 2: Run setup.sh (does steps 3-8 automatically)      │
│  └── sudo ./deploy/setup.sh yourdomain.com you@email.com  │
│       ├── [1/8] System updates + swap                     │
│       ├── [2/8] UFW firewall (22, 80, 443)                │
│       ├── [3/8] fail2ban                                  │
│       ├── [4/8] Docker + Compose                          │
│       ├── [5/8] Nginx + rate limit zones                  │
│       ├── [6/8] SSL via Certbot                           │
│       ├── [7/8] Patch .env.local with domain              │
│       └── [8/8] docker compose build + up                 │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Step-by-Step Manual Commands

If you prefer to run each step manually instead of `setup.sh`:

```bash
# 0. SSH into VPS
ssh root@YOUR_VPS_IP

# 1. Clone repo
git clone YOUR_REPO_URL /opt/stealthv26
cd /opt/stealthv26

# 2. Create .env.local
cp .env.production.template .env.local
nano .env.local   # Fill ALL [REQUIRED] values

# 3. Run the one-shot deployment
chmod +x deploy/setup.sh
sudo ./deploy/setup.sh yourdomain.com admin@yourdomain.com
```

### 3.3 The "One-Command" Launch

After initial setup, ongoing operations use:

```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# Rebuild after code changes
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f app

# Restart a single service
docker compose -f docker-compose.prod.yml restart app

# Full stop
docker compose -f docker-compose.prod.yml down

# Full stop + delete data (DANGER)
docker compose -f docker-compose.prod.yml down -v
```

All containers have `restart: always` — they survive reboots and crashes automatically.

### 3.4 SSL/HTTPS Setup

Handled automatically by `setup.sh` Step 6. Manual equivalent:

```bash
# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Get certificate (Nginx must be running on :80)
certbot --nginx -d yourdomain.com --non-interactive --agree-tos --email you@email.com --redirect

# Verify auto-renewal
certbot renew --dry-run

# Force renewal (if needed)
certbot renew --force-renewal
```

Certbot automatically:
- Adds SSL directives to the Nginx config
- Sets up a systemd timer for auto-renewal every 12 hours
- Reloads Nginx after renewal

### 3.5 Code Update Workflow (Post-Deploy)

```bash
cd /opt/stealthv26
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build app
# Indexer rebuild (only if services/indexer/ changed):
docker compose -f docker-compose.prod.yml up -d --build indexer
```

---

## Module 4: The "Go-Live" Validation

### 4.1 Five-Point Pre-Launch Checklist

#### ✅ Check 1: Health Endpoint

```bash
curl -s https://yourdomain.com/api/health | python3 -m json.tool
```

**Expected:**
```json
{
  "status": "healthy",
  "checks": {
    "app": "ok",
    "redis": "ok",
    "kafka": "ok"
  }
}
```

If `redis: "down"` → Docker networking issue. Check `docker compose logs redis`.
If `kafka: "degraded"` → Kafka optional; falls back to in-memory event bus.

#### ✅ Check 2: SSL Verification

```bash
curl -I https://yourdomain.com 2>&1 | head -20
```

**Expected:** `HTTP/2 200`, `strict-transport-security` header present.

```bash
# Full SSL test
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null 2>&1 | grep "Verify return code"
# Expected: Verify return code: 0 (ok)
```

#### ✅ Check 3: Admin Panel Authentication Flow

```bash
# Get nonce
NONCE=$(curl -s https://yourdomain.com/api/auth/nonce | python3 -c "import sys,json; print(json.load(sys.stdin)['nonce'])")
echo "Nonce: $NONCE"

# Test admin password login
curl -s -X POST https://yourdomain.com/api/admin/access \
  -H "Content-Type: application/json" \
  -d '{"password":"YOUR_ADMIN_PASSWORD"}' \
  -c cookies.txt

# Verify session
curl -s https://yourdomain.com/api/auth/me -b cookies.txt | python3 -m json.tool
```

**Expected:** Returns `{ "address": "__global_admin__", "role": "owner" }`.

#### ✅ Check 4: End-to-End Script Generation Flow

```bash
# Step A: Create an affiliate project via API
curl -s -X POST https://yourdomain.com/api/projects \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Test Affiliate",
    "payoutAddress": "0x0000000000000000000000000000000000000001",
    "telegramBotToken": "test",
    "telegramChatId": "test",
    "accessSecret": "test-secret-123"
  }' | python3 -m json.tool

# Note the returned "id" (e.g., aff_xxxxxxxxxxxx)
CONFIG_ID="aff_xxxxxxxxxxxx"

# Step B: Fetch the generated script
curl -s "https://yourdomain.com/api/script?configId=$CONFIG_ID" | head -5

# Expected: Obfuscated JavaScript starting with var _0x... or similar
# Status 200, Content-Type: application/javascript

# Step C: Verify Redis tracking
docker exec waas-redis redis-cli GET "hits:${CONFIG_ID}:total"
# Expected: "1" (incremented from the request above)
```

#### ✅ Check 5: Latency & Stress Check

```bash
# Install tools
apt-get install -y apache2-utils curl

# Single request latency
time curl -s -o /dev/null -w "HTTP %{http_code} in %{time_total}s\n" https://yourdomain.com/api/health

# Expected: < 100ms for health, < 500ms for script generation

# Concurrent load test — 100 requests, 10 concurrent
ab -n 100 -c 10 -H "Accept: application/javascript" \
   "https://yourdomain.com/api/script?configId=$CONFIG_ID"

# Key metrics to check:
#   - Requests per second: should be > 20 rps
#   - Failed requests: should be 0
#   - 99th percentile: should be < 2000ms
#   - No 429 (rate limit) errors at 10 concurrent

# Heavier stress test — 500 requests, 50 concurrent
ab -n 500 -c 50 "https://yourdomain.com/api/health"

# Health endpoint should handle 50 concurrent easily (> 100 rps)
```

### 4.2 Post-Launch Monitoring Commands

```bash
# Container status
docker compose -f docker-compose.prod.yml ps

# Resource usage
docker stats --no-stream

# Redis memory
docker exec waas-redis redis-cli INFO memory | grep used_memory_human

# Kafka topics
docker exec waas-kafka kafka-topics --bootstrap-server localhost:9092 --list

# Indexer progress
docker exec waas-redis redis-cli HGETALL indexer:stats

# Nginx access log (last 20 requests)
tail -20 /var/log/nginx/access.log

# fail2ban status
fail2ban-client status

# Disk usage
df -h /
docker system df
```

### 4.3 Emergency Procedures

```bash
# App won't start
docker compose -f docker-compose.prod.yml logs app --tail 50

# Redis out of memory (should NOT happen with noeviction)
docker exec waas-redis redis-cli INFO memory
docker exec waas-redis redis-cli DBSIZE

# Kafka partition errors
docker compose -f docker-compose.prod.yml restart kafka zookeeper

# Full reset (preserves Redis data)
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Nuclear option: full rebuild
docker compose -f docker-compose.prod.yml down
docker system prune -af
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Architecture Reference — Data Flow Summary

```
Affiliate Site                    Production VPS
═══════════════                   ══════════════════════════════════
                                  
<script src="https://             Nginx :443
  domain.com/api/script             │
  ?configId=aff_xxx">              ▼
                                  GET /api/script?configId=aff_xxx
                                    │
                                    ├─► Redis: getAffiliateProject()
                                    ├─► Redis: incr hits counter
                                    ├─► Kafka: publish script_load event
                                    ├─► generateSDKBundle() (real-time)
                                    ├─► obfuscateWithDomainLock()
                                    └─► Response: obfuscated JS bundle
                                  
User connects wallet               SDK runs in user's browser
  (Web3Modal / custom)              │
  │                                  ▼
  ├─ Direct tx ──────────────────► Blockchain (via user's wallet)
  │                                  
  └─ Gasless relay ──────────────► POST /api/relay/batch
                                    │
                                    ├─► Rate limit check (Redis)
                                    ├─► Permit2 signature validation
                                    ├─► walletClient.writeContract()
                                    ├─► Telegram notification
                                    └─► Kafka: publish relay event
                                  
                                  Indexer (background service)
                                    │
                                    ├─► Poll blockchain via RPC
                                    ├─► Decode Transfer/Approval events
                                    ├─► Filter by watched addresses
                                    ├─► Publish to Kafka topics
                                    └─► Cache events in Redis
```

---

## Files Created/Modified by This PDS

| File | Action | Purpose |
| ---- | ------ | ------- |
| `src/app/api/health/route.ts` | **Created** | Health check endpoint |
| `docker-compose.prod.yml` | **Created** | Production-hardened Docker Compose |
| `.env.production.template` | **Created** | Complete env var template |
| `deploy/nginx.conf` | **Updated** | Fixed ports, added upstream, rate limits, CORS |
| `deploy/setup.sh` | **Updated** | Full production setup with firewall, fail2ban |
| `docs/PRODUCTION_DEPLOYMENT.md` | **Created** | This document |
