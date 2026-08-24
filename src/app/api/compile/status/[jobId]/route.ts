import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getQueue } from "@/lib/queues";
import { COMPILE_QUEUE_NAME } from "@/lib/queues/compile";

type Params = { params: Promise<{ jobId: string }> };

/**
 * GET /api/compile/status/[jobId]
 * Poll a queued compile job: state, progress, attempts, and result.
 * The full bundle is stripped from the response (fetch the published file URL
 * from the result instead) to keep the payload small.
 */
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireAuth("sdk:download");
  if (guard) return guard;

  const { jobId } = await params;

  try {
    const queue = getQueue(COMPILE_QUEUE_NAME);
    const job = await queue.getJob(jobId);
    if (!job) {
      return NextResponse.json({ status: "error", message: "Job not found" }, { status: 404 });
    }

    const state = await job.getState();
    const rawResult = (job.returnvalue ?? null) as Record<string, unknown> | null;

    // Strip the raw bundle content from the poll response.
    const result = rawResult
      ? {
          ...rawResult,
          bundle: undefined,
          ...(rawResult.publishedBuild
            ? { publishedBuild: rawResult.publishedBuild }
            : {}),
        }
      : null;

    return NextResponse.json({
      status: "ok",
      job: {
        id: job.id,
        name: job.name,
        state,
        progress: job.progress,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason ?? null,
        result,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read job";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
