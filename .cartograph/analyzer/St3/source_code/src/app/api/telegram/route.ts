import { NextResponse } from "next/server";
import { getAffiliateProjectDecrypted } from "@/lib/projects";
import { sendCustomTelegramMessage, sendTelegramNotification } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body?.message || "StealthV26 WaaS — Test notification";
    const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
    const includePlatform = body?.includePlatform !== false;
    const bodyToken = typeof body?.botToken === "string" ? body.botToken : "";
    const bodyChatId = typeof body?.chatId === "string" ? body.chatId : "";

    if (bodyToken && bodyChatId) {
      const ok = await sendCustomTelegramMessage({
        message,
        botToken: bodyToken,
        chatId: bodyChatId,
      });

      if (!ok) {
        return NextResponse.json(
          { status: "error", message: "Telegram API error" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        status: "ok",
        message: "Message sent successfully",
        platformSent: false,
        affiliateSent: true,
      });
    }

    if (projectId) {
      const project = await getAffiliateProjectDecrypted(projectId);
      if (!project) {
        return NextResponse.json(
          { status: "error", message: "Affiliate project not found" },
          { status: 404 }
        );
      }
    }

    const result = await sendTelegramNotification({
      message,
      projectId: projectId || undefined,
      includePlatform,
    });

    if (!result.platformSent && !result.affiliateSent) {
      return NextResponse.json(
        { status: "error", message: "No Telegram target is configured" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: "ok",
      message: "Message sent successfully",
      ...result,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Failed to send Telegram message" },
      { status: 500 }
    );
  }
}
