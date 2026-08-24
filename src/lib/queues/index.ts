/**
 * BullMQ queue infrastructure for St3.
 *
 * Shared Redis connection + queue name constants. Every queue in the system
 * (telegram, compile, relay, notify) lives behind one Redis bus so workers can
 * run as independent processes on the VPS while the Next.js app enqueues jobs.
 *
 * Jobs survive worker restarts (Redis persistence), support retries/backoff,
 * and are observable via BullMQ job states + the /queues admin surface.
 */

import { Queue } from "bullmq";

export const QUEUE_NAMES = {
  telegramInbound: "telegram-inbound",
  telegramOutbound: "telegram-outbound",
  compile: "compile",
  relay: "relay",
  notify: "notify",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/** Shared Redis connection options for BullMQ (queues + workers must agree). */
export function getRedisConnectionOptions() {
  const url = process.env.REDIS_URL || "redis://localhost:6379";

  if (url.startsWith("redis://") || url.startsWith("rediss://")) {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname || "localhost",
        port: Number(parsed.port || 6379),
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        db: parsed.pathname && parsed.pathname.length > 1 ? Number(parsed.pathname.slice(1)) : 0,
        tls: parsed.protocol === "rediss:" ? {} : undefined,
        // Required by BullMQ — infinite retries at the Redis driver level;
        // job-level retries are controlled per-job via attempts/backoff.
        maxRetriesPerRequest: null,
      } as const;
    } catch {
      // fall through to defaults
    }
  }

  return {
    host: "localhost",
    port: 6379,
    maxRetriesPerRequest: null,
  } as const;
}

export function isQueueEnabled(): boolean {
  // Allow disabling queue mode (fall back to inline processing) in pure-UI dev.
  return !/^(1|true|yes)$/i.test(process.env.DISABLE_QUEUES || "");
}

/** Default job options — sensible retries + retention so failed jobs are debuggable. */
export const DEFAULT_JOB_OPTS = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 2_000 },
  removeOnComplete: { age: 3_600, count: 200 },
  removeOnFail: { age: 86_400, count: 500 },
};

// ── Lazy queue singletons (avoid creating Redis connections at import time) ──

const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue {
  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, { connection: getRedisConnectionOptions() });
    queues.set(name, queue);
  }
  return queue;
}

/** Best-effort close of all queues (used in worker shutdown hooks). */
export async function closeQueues(): Promise<void> {
  await Promise.all([...queues.values()].map((q) => q.close().catch(() => undefined)));
  queues.clear();
}
