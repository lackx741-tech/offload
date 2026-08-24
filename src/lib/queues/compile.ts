/**
 * Compile queue — script compilation jobs (dashboard /api/compile, affiliate
 * projects, and Telegram /compile commands).
 *
 * compile.worker runs the generator + obfuscation, publishes the .min.js to
 * persistent storage, then (for Telegram-originated jobs) sends the completion
 * message with the inline [🔗 Open Script] button.
 */

import { getQueue, QUEUE_NAMES, DEFAULT_JOB_OPTS, isQueueEnabled } from "./index";
import type { ObfuscationLevel } from "@/lib/obfuscator";

export type CompileJobData = {
  /** Affiliate project id (aff_*) or "platform" for the dashboard compile. */
  projectId: string;
  obfuscationLevel?: ObfuscationLevel;
  source: "telegram" | "dashboard" | "api";
  /** Telegram chat to notify when the job completes (telegram-originated jobs). */
  chatId?: string;
  /** Include an inline Open Script button in the completion message. */
  includeButton?: boolean;
  /** Omit the full bundle from job result (keeps result JSON small). */
  lightResult?: boolean;
};

export const COMPILE_QUEUE_NAME = QUEUE_NAMES.compile;

export async function enqueueCompileJob(data: CompileJobData) {
  if (!isQueueEnabled()) return null;
  const queue = getQueue(COMPILE_QUEUE_NAME);
  return queue.add(
    "compile-script",
    data,
    {
      ...DEFAULT_JOB_OPTS,
      attempts: 2,
      removeOnComplete: { age: 3_600, count: 300 },
      removeOnFail: { age: 86_400, count: 500 },
    },
  );
}
