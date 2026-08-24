import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

/** GET /api/indexer — returns indexer stats and recent events for an address */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  const redis = await getRedis();

  // Indexer aggregate stats
  const stats: Record<string, string | null> = {};
  for (const field of ["blocksProcessed", "eventsIndexed", "lastBlock", "lastUpdated"]) {
    stats[field] = await redis.get(`indexer:stats:${field}`);
  }

  // Per-address events
  let events: unknown[] = [];
  if (address) {
    const raw = await redis.get(`events:${address.toLowerCase()}`);
    if (raw) {
      try { events = JSON.parse(`[${raw}]`); } catch { /* ignore */ }
    }
  }

  return NextResponse.json({ status: "ok", stats, events });
}

/** POST /api/indexer — add address to watch list */
export async function POST(request: Request) {
  try {
    const { address } = await request.json();
    if (!address || typeof address !== "string") {
      return NextResponse.json({ status: "error", message: "address required" }, { status: 400 });
    }
    const redis = await getRedis();
    await redis.set(`indexer:watched:${address.toLowerCase()}`, "1");
    return NextResponse.json({ status: "ok", message: `Watching ${address}` });
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid request" }, { status: 400 });
  }
}
