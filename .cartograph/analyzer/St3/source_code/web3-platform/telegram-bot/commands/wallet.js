import { requireAuth } from "../auth/session.js";
import { apiRequest } from "../services/api.js";

export async function setWallet(bot, chatId, type) {
  const session = await requireAuth(chatId);

  await apiRequest(
    "/configs/wallet",
    "POST",
    session.token,
    { type }
  );

  await bot.sendMessage(chatId, `🔗 Wallet set: ${type}`);
}
