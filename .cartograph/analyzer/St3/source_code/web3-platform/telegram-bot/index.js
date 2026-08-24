
import TelegramBot from "node-telegram-bot-api";
import config from "./config.js";

import { handleLogin } from "./commands/login.js";
import { handleConfigs } from "./commands/configs.js";
import { handleCompile } from "./commands/compile.js";
import { handleDeploy } from "./commands/deploy.js";
import { setWallet } from "./commands/wallet.js";
import { handleStart } from "./commands/start.js";
import { mainMenu, walletMenu } from "./ui/keyboards.js";

const bot = new TelegramBot(config.botToken, { polling: true });

bot.onText(/\/start/, (msg) => handleStart(bot, msg));
bot.onText(/\/login (.+) (.+)/, (msg) => handleLogin(bot, msg));
bot.onText(/\/configs/, (msg) => handleConfigs(bot, msg));

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;

  switch (query.data) {
    case "configs":
      return handleConfigs(bot, query.message);
    case "compile":
      return bot.sendMessage(chatId, "Send config ID");
    case "deploy":
      return bot.sendMessage(chatId, "Send config ID");
    case "wallet":
      return bot.sendMessage(chatId, "Select wallet:", walletMenu());
    case "wallet_injected":
      return setWallet(bot, chatId, "injected");
    case "wallet_wc":
      return setWallet(bot, chatId, "walletconnect");
    case "wallet_both":
      return setWallet(bot, chatId, "both");
  }
});

console.log("🤖 Telegram bot running...");
