/**
 * POST /api/projects/:id/reset-password
 *
 * Generates a new random password for the affiliate and returns it once.
 * The old password is immediately invalidated.
 * Requires config:write permission (admin only).
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, SESSION_COOKIE, verifySession } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { resetAffiliatePassword, getAffiliateProject } from "@/lib/projects";
import { sendTelegramNotification } from "@/lib/telegram";

type Params = { params: Promise<{ id: string }> };

async function getCallerAddress(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const secret = getAuthSecret();
  const session = verifySession<{ address: string }>(token, secret || "dev");
  return session?.address ?? null;
}

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const address = await getCallerAddress();
  const err = authorize(address, "config:write");
  if (err) return NextResponse.json({ status: "error", message: err }, { status: 403 });

  const project = await getAffiliateProject(id);
  if (!project) {
    return NextResponse.json({ status: "error", message: "Affiliate not found" }, { status: 404 });
  }

  const result = await resetAffiliatePassword(id);
  if (!result) {
    return NextResponse.json({ status: "error", message: "Reset failed" }, { status: 500 });
  }

  void sendTelegramNotification({
    projectId: project.id,
    message:
      `🔑 Password Reset\n` +
      `project: <code>${project.id}</code>\n` +
      `name: <b>${project.name}</b>\n` +
      `username: <code>${project.username}</code>`,
  });

  // Return new credentials once — not retrievable again
  return NextResponse.json({
    status: "ok",
    credentials: {
      username: project.username,
      password: result.plaintextPassword,
    },
  });
}
