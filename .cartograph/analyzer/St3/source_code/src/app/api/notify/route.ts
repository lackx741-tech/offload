import { NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram";
import { rateLimit } from "@/lib/redis";

/**
 * POST /api/notify
 * Server-side relay for Telegram notifications from the client SDK.
 * This keeps the bot token on the server — never exposed to browsers.
 */
export async function POST(request: Request) {
  try {
    // Rate limit: 20 notifications per minute per IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rl = await rateLimit(`notify:${ip}`, 20, 60);
    if (!rl.allowed) {
      return NextResponse.json({ status: "error", message: "Rate limited" }, { status: 429 });
    }

    const body = await request.json();
    const { message, projectId } = body ?? {};

    if (!message || typeof message !== "string") {
      return NextResponse.json({ status: "error", message: "Missing message" }, { status: 400 });
    }

    // Truncate to prevent abuse
    const sanitized = message.slice(0, 2000);

    void sendTelegramNotification({
      message: sanitized,
      projectId: typeof projectId === "string" ? projectId : undefined,
    });

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error", message: "Internal error" }, { status: 500 });
  }
}
