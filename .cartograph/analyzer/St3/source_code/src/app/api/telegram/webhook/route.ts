import { NextResponse } from "next/server";
import {
  getTelegramBotDiagnostics,
  isTelegramWebhookAuthorized,
  processTelegramUpdate,
  registerBotCommands,
} from "@/lib/telegram-bot";

export async function GET() {
  // Hitting this endpoint re-registers the command list with BotFather
  void registerBotCommands();
  return NextResponse.json({
    status: "ok",
    bot: getTelegramBotDiagnostics(),
  });
}

export async function POST(request: Request) {
  if (!isTelegramWebhookAuthorized(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ status: "error", message: "Unauthorized webhook" }, { status: 401 });
  }

  try {
    const update = await request.json();
    await processTelegramUpdate(update);
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid Telegram update" }, { status: 400 });
  }
}
