import { setSession } from "../auth/session.js";
import { apiRequest } from "../services/api.js";

export async function handleLogin(bot, msg) {
  const chatId = msg.chat.id;
  const [, email, password] = msg.text.split(" ");

  try {
    const res = await apiRequest("/auth/login", "POST", null, {
      email,
      password
    });

    await setSession(chatId, {
      token: res.token,
      user: res.user
    });

    await bot.sendMessage(chatId, "✅ Logged in successfully");

  } catch (err) {
    await bot.sendMessage(chatId, "❌ Login failed");
  }
}
