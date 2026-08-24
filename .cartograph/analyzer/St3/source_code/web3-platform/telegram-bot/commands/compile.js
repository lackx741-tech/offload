import { requireAuth } from "../auth/session.js";
import { apiRequest } from "../services/api.js";

export async function handleCompile(bot, msg, configId) {
  const chatId = msg.chat.id;

  try {
    const session = await requireAuth(chatId);

    await apiRequest(
      "/compile",
      "POST",
      session.token,
      { configId }
    );

    await bot.sendMessage(chatId, "⚙️ Compilation started...");

  } catch {
    await bot.sendMessage(chatId, "❌ Compile failed");
  }
}
