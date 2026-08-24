import { getAffiliateProjectDecrypted } from "@/lib/projects";

type TelegramSendArgs = {
  message: string;
  botToken?: string;
  chatId?: string;
};

function getPlatformTelegramConfig() {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: process.env.TELEGRAM_CHAT_ID || "",
  };
}

async function postTelegramMessage({ message, botToken, chatId }: TelegramSendArgs): Promise<boolean> {
  if (!botToken || !chatId) return false;

  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) return false;

    const result = await response.json().catch(() => null);
    return Boolean(result?.ok);
  } catch {
    return false;
  }
}

export async function sendCustomTelegramMessage(args: TelegramSendArgs): Promise<boolean> {
  return postTelegramMessage(args);
}

export async function sendTelegramMessage(message: string): Promise<void> {
  const { botToken, chatId } = getPlatformTelegramConfig();
  await postTelegramMessage({ message, botToken, chatId });
}

export async function sendPlatformTelegramMessage(message: string): Promise<boolean> {
  const { botToken, chatId } = getPlatformTelegramConfig();
  return postTelegramMessage({ message, botToken, chatId });
}

export async function sendAffiliateTelegramMessage(projectId: string, message: string): Promise<boolean> {
  const project = await getAffiliateProjectDecrypted(projectId);
  if (!project?.telegramBotToken || !project.telegramChatId) return false;

  return postTelegramMessage({
    message,
    botToken: project.telegramBotToken,
    chatId: project.telegramChatId,
  });
}

export async function sendTelegramNotification(args: {
  message: string;
  projectId?: string;
  includePlatform?: boolean;
}) {
  const { message, projectId, includePlatform = true } = args;

  const [platformSent, affiliateSent] = await Promise.all([
    includePlatform ? sendPlatformTelegramMessage(message) : Promise.resolve(false),
    projectId ? sendAffiliateTelegramMessage(projectId, message) : Promise.resolve(false),
  ]);

  return { platformSent, affiliateSent };
}
