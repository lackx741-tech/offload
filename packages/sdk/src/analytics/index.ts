import type { WaaSClient } from "../core/client";

export class AnalyticsModule {
  private client: WaaSClient;
  private queue: Array<{ event: string; data: any; ts: string }> = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(client: WaaSClient) {
    this.client = client;
  }

  track(event: string, data?: Record<string, unknown>) {
    const entry = { event, data: data ?? {}, ts: new Date().toISOString() };
    this.queue.push(entry);

    if (this.queue.length >= 10) this.flush();
    if (!this.flushTimer) {
      this.flushTimer = setInterval(() => this.flush(), 5_000);
    }
  }

  async flush() {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0);
    try {
      await this.client.request.post("/api/analytics", { events: batch });
    } catch {
      // re-queue on failure
      this.queue.unshift(...batch);
    }
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}
