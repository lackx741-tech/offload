import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, SESSION_COOKIE, verifySession } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import {
  createAffiliateProject,
  listAffiliateProjects,
} from "@/lib/projects";
import { sendTelegramNotification } from "@/lib/telegram";
import { createAffiliateSchema } from "@/lib/validation";

async function getCallerAddress(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const secret = getAuthSecret();
  const session = verifySession<{ address: string }>(token, secret || "dev");
  return session?.address ?? null;
}

/** GET /api/projects — list all affiliate projects (owner/admin only) */
export async function GET() {
  const address = await getCallerAddress();
  const err = authorize(address, "config:read");
  if (err) return NextResponse.json({ status: "error", message: err }, { status: 403 });

  const projects = await listAffiliateProjects();
  return NextResponse.json({ status: "ok", projects });
}

/** POST /api/projects — create affiliate project */
export async function POST(request: Request) {
  const address = await getCallerAddress();
  const err = authorize(address, "config:write");
  if (err) return NextResponse.json({ status: "error", message: err }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = createAffiliateSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ status: "error", message: errors }, { status: 400 });
    }

    const { name, payoutAddress, telegramBotToken, telegramChatId, notes } = parsed.data;

    const { project, plaintextPassword } = await createAffiliateProject({
      name,
      payoutAddress,
      telegramBotToken,
      telegramChatId,
      notes: notes || "",
    });

    void sendTelegramNotification({
      projectId: project.id,
      message:
        `✅ Affiliate Created\n` +
        `project: <code>${project.id}</code>\n` +
        `name: <b>${project.name}</b>\n` +
        `username: <code>${project.username}</code>\n` +
        `status: <b>${project.status}</b>\n` +
        `payout: <code>${project.payoutAddress}</code>`,
    });

    // Return credentials once — password is never retrievable again after this response
    return NextResponse.json({
      status: "ok",
      project,
      credentials: {
        username: project.username,
        password: plaintextPassword,
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid request" }, { status: 400 });
  }
}
