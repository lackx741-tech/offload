#!/bin/bash

set -e

echo "🚀 Setting up Web3 Platform..."

# Root structure
mkdir -p web3-platform
cd web3-platform

mkdir -p compiler/template compiler/output
mkdir -p telegram-bot/{commands,services,auth,ui}
mkdir -p shared

########################################
# 📦 PACKAGE.JSON (ROOT)
########################################
cat << 'EOF' > package.json
{
  "name": "web3-platform",
  "private": true,
  "type": "module",
  "workspaces": [
    "compiler",
    "telegram-bot"
  ]
}
EOF

########################################
# ⚙️ COMPILER SETUP
########################################
cd compiler

cat << 'EOF' > package.json
{
  "name": "compiler",
  "type": "module",
  "dependencies": {
    "esbuild": "^0.21.0",
    "fs-extra": "^11.2.0"
  }
}
EOF

npm install

cat << 'EOF' > template/sdk.js
export function initSDK(config) {
  const state = { wallet: null };

  async function connectWallet() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });

      state.wallet = accounts[0];

      await fetch(config.apiUrl + "/api/events/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ wallet: state.wallet })
      });
    }
  }

  return { connectWallet };
}
EOF

cat << 'EOF' > builder.js
import esbuild from "esbuild";
import fs from "fs-extra";
import path from "path";

export async function buildSDK(config) {
  const version = Date.now();
  const outDir = path.resolve("./output/" + version);

  await fs.ensureDir(outDir);

  const entry = path.join(outDir, "entry.js");

  await fs.writeFile(entry, `
    import { initSDK } from "../../template/sdk.js";
    window.AffiliateSDK = initSDK(${JSON.stringify(config)});
  `);

  const outfile = path.join(outDir, "bundle.js");

  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    outfile,
    minify: true,
    format: "iife"
  });

  console.log("✅ Build complete:", outfile);
}
EOF

cat << 'EOF' > index.js
import { buildSDK } from "./builder.js";

await buildSDK({
  apiUrl: "http://localhost:3000",
  wallet: "injected"
});
EOF

cd ..

########################################
# 🤖 TELEGRAM BOT SETUP
########################################
cd telegram-bot

cat << 'EOF' > package.json
{
  "name": "telegram-bot",
  "type": "module",
  "dependencies": {
    "node-telegram-bot-api": "^0.64.0",
    "axios": "^1.6.0",
    "dotenv": "^16.4.0"
  }
}
EOF

npm install

########################################
# ENV
########################################
cat << 'EOF' > .env
TELEGRAM_BOT_TOKEN=PUT_YOUR_TOKEN
API_BASE=http://localhost:3000
EOF

########################################
# 🎛️ EMOJI UI KEYBOARDS
########################################
cat << 'EOF' > ui/keyboards.js
export const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "📦 Configs", callback_data: "configs" }],
      [{ text: "⚙️ Compile", callback_data: "compile" }],
      [{ text: "🚀 Deploy", callback_data: "deploy" }],
      [{ text: "🔗 Wallet", callback_data: "wallet" }]
    ]
  }
};

export const walletMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "🦊 Injected", callback_data: "wallet_injected" }],
      [{ text: "🌐 WalletConnect", callback_data: "wallet_wc" }],
      [{ text: "🔀 Both", callback_data: "wallet_both" }]
    ]
  }
};
EOF

########################################
# 🤖 BOT MAIN (EMOJI-FIRST UX)
########################################
cat << 'EOF' > index.js
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { mainMenu, walletMenu } from "./ui/keyboards.js";

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true
});

const sessions = new Map();

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🤖 *Control Panel*\nChoose an action:",
    { parse_mode: "Markdown", ...mainMenu }
  );
});

bot.on("callback_query", async (q) => {
  const chatId = q.message.chat.id;

  switch (q.data) {

    case "configs":
      return bot.sendMessage(chatId, "📦 Fetching configs...");

    case "compile":
      sessions.set(chatId, { action: "compile" });
      return bot.sendMessage(chatId, "⚙️ Send Config ID");

    case "deploy":
      sessions.set(chatId, { action: "deploy" });
      return bot.sendMessage(chatId, "🚀 Send Config ID");

    case "wallet":
      return bot.sendMessage(chatId, "🔗 Select wallet:", walletMenu);

    case "wallet_injected":
      return bot.sendMessage(chatId, "🦊 Injected selected");

    case "wallet_wc":
      return bot.sendMessage(chatId, "🌐 WalletConnect selected");

    case "wallet_both":
      return bot.sendMessage(chatId, "🔀 Both selected");
  }
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const session = sessions.get(chatId);

  if (!session) return;

  if (session.action === "compile") {
    bot.sendMessage(chatId, `⚙️ Compiling config: ${msg.text}`);
    sessions.delete(chatId);
  }

  if (session.action === "deploy") {
    bot.sendMessage(chatId, `🚀 Deploying config: ${msg.text}`);
    sessions.delete(chatId);
  }
});

console.log("🤖 Telegram bot running...");
EOF

cd ..

########################################
# 🚀 DONE
########################################
echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add TELEGRAM_BOT_TOKEN in telegram-bot/.env"
echo "2. Run compiler: cd compiler && node index.js"
echo "3. Run bot: cd telegram-bot && node index.js"
echo ""
