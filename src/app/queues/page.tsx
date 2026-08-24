"use client";

import { useEffect, useState } from "react";

type QueueStatus = {
  name: string;
  counts: Record<string, number>;
  waiting: unknown[];
  active: unknown[];
  completed: unknown[];
  failed: unknown[];
  delayed: unknown[];
};

type QueuesResponse = {
  status: string;
  queueMode: boolean;
  queues: QueueStatus[];
};

const COUNT_LABELS = ["waiting", "active", "completed", "failed", "delayed"] as const;

export default function QueuesPage() {
  const [data, setData] = useState<QueuesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/queues", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || `HTTP ${res.status}`);
        setData(null);
      } else {
        setData(await res.json());
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load queues");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">BullMQ Runtime</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">
            mode: {data?.queueMode ? "queue" : "inline"}
          </span>
          <button
            onClick={() => void load()}
            className="rounded border border-neutral-700 px-3 py-1 text-xs hover:bg-neutral-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && !data && <p className="text-neutral-400">Loading…</p>}
      {error && (
        <div className="rounded border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          {error} — log in as admin to view the runtime.
        </div>
      )}

      {data && (
        <div className="grid gap-4">
          {data.queues.map((q) => (
            <div key={q.name} className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-mono text-sm font-semibold">{q.name}</h2>
                <div className="flex gap-2 text-xs">
                  {COUNT_LABELS.map((label) => (
                    <span key={label} className="rounded bg-neutral-800 px-2 py-0.5">
                      {label}: <b>{q.counts[label] ?? 0}</b>
                    </span>
                  ))}
                </div>
              </div>
              {q.active.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-neutral-500">Active jobs</p>
                  <pre className="overflow-x-auto text-xs text-emerald-300">
                    {JSON.stringify(q.active, null, 2)}
                  </pre>
                </div>
              )}
              {q.failed.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-neutral-500">Failed (recent)</p>
                  <pre className="overflow-x-auto text-xs text-red-300">
                    {JSON.stringify(q.failed, null, 2)}
                  </pre>
                </div>
              )}
              {q.completed.length > 0 && (
                <div>
                  <p className="text-xs text-neutral-500">Completed (recent)</p>
                  <pre className="overflow-x-auto text-xs text-neutral-300">
                    {JSON.stringify(q.completed, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
