/**
 * POST /api/affiliate/onboard
 *
 * Public endpoint — no auth required.
 * Affiliates submit their details here to create a project.
 * Returns the project ID so they can be redirected to the config page.
 */

import { NextResponse } from "next/server";
import { createAffiliateProject } from "@/lib/projects";
import { sendTelegramNotification } from "@/lib/telegram";
import { createAffiliateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createAffiliateSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json(
        { status: "error", message: errors },
        { status: 400 }
      );
    }

    const { name, payoutAddress, telegramBotToken, telegramChatId, notes } =
      parsed.data;

    const { project } = await createAffiliateProject({
      name,
      payoutAddress,
      telegramBotToken,
      telegramChatId,
      notes: notes || "",
      status: "pending",
    });

    void sendTelegramNotification({
      projectId: project.id,
      message:
        `🆕 Affiliate Onboarded\n` +
        `project: <code>${project.id}</code>\n` +
        `name: <b>${project.name}</b>\n` +
        `status: <b>${project.status}</b>\n` +
        `payout: <code>${project.payoutAddress}</code>`,
    });

    return NextResponse.json(
      { status: "ok", project: { id: project.id, name: project.name } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid request" },
      { status: 400 }
    );
  }
}
