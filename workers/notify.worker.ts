/**
 * Notify worker — fans out platform + affiliate Telegram notifications.
 */
import { Worker } from "bullmq";
import { getRedisConnectionOptions, QUEUE_NAMES } from "../src/lib/queues";
import { sendTelegramNotification } from "../src/lib/telegram";
import type { NotifyJobData } from "../src/lib/queues/notify";

const worker = new Worker(
  QUEUE_NAMES.notify,
  async (job) => {
    const data = job.data as NotifyJobData;
    const result = await sendTelegramNotification({
      message: data.message,
      projectId: data.projectId,
      includePlatform: data.includePlatform !== false,
    });
    if (!result.platformSent && !result.affiliateSent) {
      throw new Error("No Telegram target delivered");
    }
    return result;
  },
  { connection: getRedisConnectionOptions(), concurrency: 5 },
);
worker.on("failed", (job, err) => console.error("notify worker job", job?.id, "failed:", err.message));
console.log("[notify.worker] started");
export { worker as notifyWorker };
