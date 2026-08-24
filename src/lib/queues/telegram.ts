/**
 * Telegram queues — inbound webhook updates + outbound message sends.
 *
 * The webhook route enqueues raw updates and returns 200 immediately.
 * telegram.worker processes commands and pushes replies through the
 * outbound queue (or directly via the Telegram API when called from a worker).
 */

import { getQueue, QUEUE_NAMES, DEFAULT_JOB_OPTS, isQueueEnabled } from "./index";

export type TelegramInboundJobData = {
  update: unknown;
  receivedAt: string;
};

export type TelegramOutboundJobData = {
  chatId: string;
  text: string;
  parseMode?: "HTML" | "Markdown" | undefined;
  replyMarkup?: unknown;
  /** Custom bot token (affiliate bots); defaults to TELEGRAM_BOT_TOKEN. */
  botToken?: string;
};

export async function enqueueTelegramInbound(update: unknown) {
  if (!isQueueEnabled()) return null;
  const queue = getQueue(QUEUE_NAMES.telegramInbound);
  return queue.add(
    "process-update",
    { update, receivedAt: new Date().toISOString() } satisfies TelegramInboundJobData,
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 1_000 },
      removeOnComplete: { age: 3_600, count: 500 },
      removeOnFail: { age: 86_400 },
    },
  );
}

export async function enqueueTelegramOutbound(message: TelegramOutboundJobData) {
  if (!isQueueEnabled()) return null;
  const queue = getQueue(QUEUE_NAMES.telegramOutbound);
  return queue.add("send-message", message, DEFAULT_JOB_OPTS);
}

/**
 * Direct Telegram Bot API sendMessage — used by workers so replies don't depend
 * on the Next.js request lifecycle. Safe to call from anywhere server-side.
 */
export async function sendTelegramApiMessage(
  message: TelegramOutboundJobData,
): Promise<boolean> {
  const botToken = message.botToken || process.env.TELEGRAM_BOT_TOKEN || "";
  if (!botToken || !message.chatId) return false;

  const payload: Record<string, unknown> = {
    chat_id: message.chatId,
    text: message.text,
    parse_mode: message.parseMode ?? "HTML",
    disable_web_page_preview: true,
  };
  if (message.replyMarkup) payload.reply_markup = message.replyMarkup;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return false;
    const result = (await response.json().catch(() => null)) as { ok?: boolean } | null;
    return Boolean(result?.ok);
  } catch {
    return false;
  }
}
