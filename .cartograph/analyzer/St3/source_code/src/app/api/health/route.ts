import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

/**
 * GET /api/health
 *
 * Production health check endpoint.
 * Used by Docker HEALTHCHECK, Nginx upstream checks, and external monitors.
 *
 * Returns:
 *  - 200 with component status when core services are reachable
 *  - 503 when critical dependencies (Redis) are down
 */
export async function GET() {
  const start = Date.now();
  const checks: Record<string, "ok" | "degraded" | "down"> = {
    app: "ok",
    redis: "down",
    kafka: "down",
  };

  // Redis check
  try {
    const redis = await getRedis();
    await redis.set("health:ping", "1", 10);
    const val = await redis.get("health:ping");
    checks.redis = val === "1" ? "ok" : "degraded";
  } catch {
    checks.redis = "down";
  }

  // Kafka check (non-critical — falls back to in-memory bus)
  try {
    if (process.env.KAFKA_BROKERS) {
      const { getEventBus } = await import("@/lib/kafka");
      await getEventBus();
      checks.kafka = "ok";
    } else {
      checks.kafka = "degraded"; // in-memory fallback
    }
  } catch {
    checks.kafka = "degraded";
  }

  const latencyMs = Date.now() - start;
  const healthy = checks.redis !== "down";

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "unhealthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      latencyMs,
      checks,
      version: "26.0.0",
      node: process.version,
    },
    { status: healthy ? 200 : 503 }
  );
}
