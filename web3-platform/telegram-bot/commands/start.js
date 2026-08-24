import { mainMenu } from "../ui/keyboards.js";

export function handleStart(bot, msg) {
  bot.sendMessage(msg.chat.id, "Welcome", mainMenu());
}
