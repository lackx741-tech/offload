/**
 * Relay queue — server-side execution jobs (batch relay calls).
 *
 * The website runtime currently expects a synchronous relay response, so the
 * /api/relay/batch route stays synchronous by default. When RELAY_QUEUE_ENABLED
 * is set, relay jobs are enqueued and consumed by relay.worker with
 * concurrency + rate limiting (crash-safe for heavy batches).
 */

import { getQueue, QUEUE_NAMES, DEFAULT_JOB_OPTS } from "./index";

export type RelayJobData = {
  chainId: number;
  backend: string;
  /** Full request payload forwarded to the relay execution path. */
  payload: unknown;
  requestedAt: string;
};

export const RELAY_QUEUE_NAME = QUEUE_NAMES.relay;

export function isRelayQueueEnabled(): boolean {
  return /^(1|true|yes)$/i.test(process.env.RELAY_QUEUE_ENABLED || "");
}

export async function enqueueRelayJob(data: RelayJobData) {
  const queue = getQueue(RELAY_QUEUE_NAME);
  return queue.add("relay-batch", data, {
    ...DEFAULT_JOB_OPTS,
    attempts: 2,
    removeOnComplete: { age: 3_600, count: 500 },
    removeOnFail: { age: 86_400 },
  });
}
