import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getQueue, QUEUE_NAMES } from "@/lib/queues";
import { isQueueEnabled } from "@/lib/queues";

/**
 * GET /api/queues
 * BullMQ runtime status: per-queue job counts + recent jobs.
 * Admin-guarded. Powers the /queues monitoring page.
 */
export async function GET() {
  const guard = await requireAuth("sdk:download");
  if (guard) return guard;

  try {
    const names = Object.values(QUEUE_NAMES);
    const queues = await Promise.all(
      names.map(async (name) => {
        const queue = getQueue(name);
        const [counts, waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getJobCounts("waiting", "active", "completed", "failed", "delayed"),
          queue.getJobs(["waiting"], 0, 10),
          queue.getJobs(["active"], 0, 10),
          queue.getJobs(["completed"], 0, 10),
          queue.getJobs(["failed"], 0, 10),
          queue.getJobs(["delayed"], 0, 10),
        ]);
        const summarize = (jobs: { id?: string; name?: string; data?: unknown; returnvalue?: unknown; failedReason?: string | null }[]) =>
          jobs.map((j) => ({
            id: j.id,
            name: j.name,
            data: j.data,
            result: j.returnvalue ?? null,
            failedReason: j.failedReason ?? null,
          }));
        return {
          name,
          counts,
          waiting: summarize(waiting),
          active: summarize(active),
          completed: summarize(completed),
          failed: summarize(failed),
          delayed: summarize(delayed),
        };
      }),
    );

    return NextResponse.json({
      status: "ok",
      queueMode: isQueueEnabled(),
      queues,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read queues";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
