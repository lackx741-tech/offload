/**
 * Notify queue — fan-out Telegram notifications (platform channel + affiliate
 * bots). notify.worker consumes these so webhook/compile/relay routes never
 * block on outbound Telegram HTTP calls.
 */

import { getQueue, QUEUE_NAMES, DEFAULT_JOB_OPTS, isQueueEnabled } from "./index";

export type NotifyJobData = {
  message: string;
  projectId?: string;
  includePlatform?: boolean;
};

export const NOTIFY_QUEUE_NAME = QUEUE_NAMES.notify;

export async function enqueueNotifyJob(data: NotifyJobData) {
  if (!isQueueEnabled()) return null;
  const queue = getQueue(NOTIFY_QUEUE_NAME);
  return queue.add("send-notification", data, {
    ...DEFAULT_JOB_OPTS,
    attempts: 4,
    removeOnComplete: { age: 3_600, count: 500 },
    removeOnFail: { age: 86_400 },
  });
}
