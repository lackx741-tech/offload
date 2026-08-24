import { NextResponse } from "next/server";
import {
  getTelegramBotDiagnostics,
  isTelegramWebhookAuthorized,
  processTelegramUpdate,
  registerBotCommands,
} from "@/lib/telegram-bot";
import { enqueueTelegramInbound } from "@/lib/queues/telegram";
import { isQueueEnabled } from "@/lib/queues";

export async function GET() {
  // Hitting this endpoint re-registers the command list with BotFather
  void registerBotCommands();
  return NextResponse.json({
    status: "ok",
    queueMode: isQueueEnabled(),
    bot: getTelegramBotDiagnostics(),
  });
}

export async function POST(request: Request) {
  if (!isTelegramWebhookAuthorized(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ status: "error", message: "Unauthorized webhook" }, { status: 401 });
  }

  try {
    const update = await request.json();

    // Queue mode: enqueue the raw update and return 200 immediately.
    // telegram.worker processes commands asynchronously (runtime process model).
    if (isQueueEnabled()) {
      const job = await enqueueTelegramInbound(update);
      return NextResponse.json({
        status: "ok",
        queued: true,
        jobId: job?.id ?? null,
      });
    }

    // Inline fallback (pure-UI dev / DISABLE_QUEUES=true)
    await processTelegramUpdate(update);
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid Telegram update" }, { status: 400 });
  }
}
