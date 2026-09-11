#!/bin/bash

# 🤖 St3 Premium Telegram Bots Quick Setup Script
# Guides you through creating and configuring both bots

set -e

echo "════════════════════════════════════════════════════════════"
echo "  🤖 St3 PREMIUM TELEGRAM BOTS SETUP"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✅ .env.local found"
else
    echo "⚠️  .env.local not found — creating template..."
    touch .env.local
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 1: Create Admin Bot with BotFather"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Instructions:"
echo "1. Open Telegram → Search '@BotFather'"
echo "2. Send: /newbot"
echo "3. Give it a name: 'St3 Admin Control'"
echo "4. Give it a username: 'st3_admin_bot'"
echo "5. Copy the token (looks like: 123456789:ABCDefGHIJklmnoPqrsTUVwxyzABC)"
echo ""
read -p "📌 Paste your ADMIN BOT TOKEN: " ADMIN_BOT_TOKEN

if [ -z "$ADMIN_BOT_TOKEN" ]; then
    echo "❌ Token is required!"
    exit 1
fi

echo "✅ Admin bot token saved"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 2: Get Your Admin Chat ID"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Instructions:"
echo "1. Open your Admin Bot"
echo "2. Send it any message (e.g., '/start')"
echo "3. Visit this URL (replace TOKEN with your token above):"
echo "   https://api.telegram.org/bot$ADMIN_BOT_TOKEN/getUpdates"
echo "4. Look for 'chat': {'id': YOUR_CHAT_ID}"
echo "5. Copy that number"
echo ""
read -p "📌 Paste your ADMIN CHAT ID: " ADMIN_CHAT_ID

if [ -z "$ADMIN_CHAT_ID" ]; then
    echo "❌ Chat ID is required!"
    exit 1
fi

echo "✅ Admin chat ID saved"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 3: Generate Webhook Secret"
echo "════════════════════════════════════════════════════════════"
echo ""

WEBHOOK_SECRET=$(openssl rand -hex 32)
echo "🔐 Generated webhook secret: $WEBHOOK_SECRET"
echo "✅ Webhook secret saved"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 4: Save to .env.local"
echo "════════════════════════════════════════════════════════════"
echo ""

# Create or update .env.local
cat >> .env.local << EOF

# ── Telegram Bots (Added $(date '+%Y-%m-%d %H:%M:%S')) ──
TELEGRAM_BOT_TOKEN=$ADMIN_BOT_TOKEN
TELEGRAM_ADMIN_CHAT_IDS=$ADMIN_CHAT_ID
TELEGRAM_WEBHOOK_SECRET=$WEBHOOK_SECRET

# ── Backend URLs ───────────────────────────
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ── Optional: Redis (comment out to use in-memory) ───
# REDIS_URL=redis://localhost:6379
DISABLE_REDIS=true

EOF

echo "✅ Environment variables saved to .env.local"
echo ""
echo "Preview of added variables:"
echo "  TELEGRAM_BOT_TOKEN=$ADMIN_BOT_TOKEN"
echo "  TELEGRAM_ADMIN_CHAT_IDS=$ADMIN_CHAT_ID"
echo "  TELEGRAM_WEBHOOK_SECRET=$WEBHOOK_SECRET"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 5: Test the Bot Locally"
echo "════════════════════════════════════════════════════════════"
echo ""

read -p "🚀 Start dev server now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting: npm run dev"
    npm run dev &
    DEV_PID=$!

    echo ""
    echo "✅ Dev server started (PID: $DEV_PID)"
    echo ""
    echo "Instructions for testing:"
    echo "1. Open Telegram"
    echo "2. Find your bot: @st3_admin_bot"
    echo "3. Send: /start"
    echo "4. Click the inline buttons below the message"
    echo "5. Try commands:"
    echo "   /dashboard → Live metrics"
    echo "   /transactions → Transaction log"
    echo "   /pipeline → Processing stages"
    echo "   /analytics → Advanced analytics"
    echo ""
    echo "Press Ctrl+C to stop the dev server"
    wait $DEV_PID
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  SETUP COMPLETE! 🎉"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Next Steps:"
echo "1. ✅ Test bot locally with: npm run dev"
echo "2. ✅ Deploy to VPS (see TELEGRAM_BOT_SETUP.md)"
echo "3. ✅ Register webhook on VPS:"
echo "   curl https://api.telegram.org/bot$ADMIN_BOT_TOKEN/setWebhook \\"
echo "     -d url=https://your-vps-domain.com/api/telegram/webhook"
echo ""
echo "Documentation: TELEGRAM_BOT_SETUP.md"
echo ""
