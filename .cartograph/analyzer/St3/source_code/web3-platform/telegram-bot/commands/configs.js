import { requireAuth } from "../auth/session.js";
import { apiRequest } from "../services/api.js";

export async function handleConfigs(bot, msg) {
  const chatId = msg.chat.id;

  try {
    const session = await requireAuth(chatId);

    const configs = await apiRequest(
      "/configs",
      "GET",
      session.token
    );

    let text = "📦 *Configs:*\n\n";

    configs.forEach(c => {
      text += `• ${c.name} (v${c.version})\n`;
    });

    await bot.sendMessage(chatId, text, {
      parse_mode: "Markdown"
    });

  } catch (err) {
    await bot.sendMessage(chatId, "❌ Unauthorized");
  }
}
