/**
 * Telegram worker — consumes telegram:inbound (webhook updates) and
 * telegram:outbound (message sends).
 *
 * Run: npm run worker:telegram  (or via npm run workers / pm2 / docker)
 */

import { Worker } from "bullmq";
import { getRedisConnectionOptions, QUEUE_NAMES } from "../src/lib/queues";
import { processTelegramUpdate } from "../src/lib/telegram-bot";
import {
  sendTelegramApiMessage,
  type TelegramInboundJobData,
  type TelegramOutboundJobData,
} from "../src/lib/queues/telegram";

// Inbound: process commands asynchronously — webhook returns 200 immediately.
const inboundWorker = new Worker(
  QUEUE_NAMES.telegramInbound,
  async (job) => {
    const data = job.data as TelegramInboundJobData;
    await processTelegramUpdate(data.update as never);
    return { processed: true, receivedAt: data.receivedAt };
  },
  { connection: getRedisConnectionOptions(), concurrency: 5 },
);

// Outbound: reliable message sends with retries/backoff.
const outboundWorker = new Worker(
  QUEUE_NAMES.telegramOutbound,
  async (job) => {
    const data = job.data as TelegramOutboundJobData;
    const ok = await sendTelegramApiMessage(data);
    if (!ok) throw new Error("Telegram sendMessage failed");
    return { sent: true, chatId: data.chatId };
  },
  { connection: getRedisConnectionOptions(), concurrency: 10 },
);
inboundWorker.on("failed", (job, err) => console.error("inbound", job?.id, err.message));
outboundWorker.on("failed", (job, err) => console.error("outbound", job?.id, err.message));
console.log("[telegram.worker] inbound + outbound workers started");
export { inboundWorker, outboundWorker };
