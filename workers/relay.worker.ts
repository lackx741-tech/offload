/**
 * Relay worker — async envelope for heavy relay batches.
 * v1: relay execution stays synchronous in POST /api/relay/batch because the
 * website runtime expects a direct response. This worker consumes relay jobs
 * (RELAY_QUEUE_ENABLED) for validation/bookkeeping; execution extraction is
 * the next step when heavy-batch throughput is required.
 */
import { Worker } from "bullmq";
import { getRedisConnectionOptions, QUEUE_NAMES } from "../src/lib/queues";
import type { RelayJobData } from "../src/lib/queues/relay";

const worker = new Worker(
  QUEUE_NAMES.relay,
  async (job) => {
    const data = job.data as RelayJobData;
    console.log("relay job", job?.id, "chain", data.chainId, "backend", data.backend);
    return {
      accepted: true,
      note: "execution stays in /api/relay/batch (sync contract); async extraction pending",
    };
  },
  { connection: getRedisConnectionOptions(), concurrency: 3 },
);
console.log("[relay.worker] started");
export { worker as relayWorker };
