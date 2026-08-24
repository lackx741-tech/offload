/**
 * GET /api/projects/:id/stats
 *
 * Per-affiliate analytics: script loads, conversions, daily breakdown.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, SESSION_COOKIE, verifySession } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { getAffiliateProject } from "@/lib/projects";
import { getRedis } from "@/lib/redis";

type Params = { params: Promise<{ id: string }> };

async function getCallerAddress(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const secret = getAuthSecret();
  const session = verifySession<{ address: string }>(token, secret || "dev");
  return session?.address ?? null;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const address = await getCallerAddress();
  const err = authorize(address, "analytics:read");
  if (err) return NextResponse.json({ status: "error", message: err }, { status: 403 });

  const project = await getAffiliateProject(id);
  if (!project) {
    return NextResponse.json({ status: "error", message: "Not found" }, { status: 404 });
  }

  const redis = await getRedis();

  // Total hits
  const totalHits = parseInt(await redis.get(`hits:${id}:total`) || "0", 10);

  // Last 30 days breakdown
  const daily: { date: string; hits: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const hits = parseInt(await redis.get(`hits:${id}:${dateStr}`) || "0", 10);
    daily.push({ date: dateStr, hits });
  }

  // Total conversions (wallet connects tracked via relay)
  const totalConversions = parseInt(await redis.get(`conversions:${id}:total`) || "0", 10);

  return NextResponse.json({
    status: "ok",
    projectId: id,
    stats: {
      totalHits,
      totalConversions,
      conversionRate: totalHits > 0 ? ((totalConversions / totalHits) * 100).toFixed(2) + "%" : "0%",
      daily,
    },
  });
}
