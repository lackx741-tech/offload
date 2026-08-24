import { requireAuth } from "../auth/session.js";
import { apiRequest } from "../services/api.js";

export async function handleDeploy(bot, msg, configId) {
  const chatId = msg.chat.id;

  try {
    const session = await requireAuth(chatId);

    const res = await apiRequest(
      `/files`,
      "GET",
      session.token
    );

    await bot.sendMessage(chatId, `🚀 Deployment ready:\n${res.url}`);

  } catch {
    await bot.sendMessage(chatId, "❌ Deploy failed");
  }
}
