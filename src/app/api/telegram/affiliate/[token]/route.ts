/**
 * POST /api/telegram/affiliate/[token]
 *
 * Per-affiliate Telegram webhook. Each affiliate bot is registered with Telegram
 * pointing at:
 *
 *   https://<your-domain>/api/telegram/affiliate/<BOT_TOKEN>
 *
 * Telegram will POST updates here. We resolve the project by matching the token
 * against encrypted stored tokens, then dispatch affiliate-scoped commands
 * (/status, /compile, /domains, /add-domain, /remove-domain).
 *
 * No shared secret header is needed because the token itself is a secret URL
 * component. Optionally you can still set X-Telegram-Bot-Api-Secret-Token
 * in the webhook registration — if TELEGRAM_WEBHOOK_SECRET is set we enforce it.
 */

import { NextResponse } from "next/server";
import { processAffiliateUpdate, type TelegramUpdate } from "@/lib/telegram-affiliate-bot";

function getWebhookSecret() {
  return process.env.TELEGRAM_WEBHOOK_SECRET || "";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  // Optional: enforce shared webhook secret if configured
  const configured = getWebhookSecret();
  if (configured) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== configured) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }
  }

  const { token } = await params;
  if (!token) {
    return NextResponse.json({ status: "error", message: "Missing token" }, { status: 400 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid JSON" }, { status: 400 });
  }

  try {
    const handled = await processAffiliateUpdate(token, update);
    if (!handled) {
      // Token not matched — return 200 so Telegram stops retrying
      return NextResponse.json({ status: "ok", matched: false });
    }
    return NextResponse.json({ status: "ok", matched: true });
  } catch {
    // Always 200 to prevent Telegram retry loops
    return NextResponse.json({ status: "ok" });
  }
}
