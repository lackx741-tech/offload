import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, SESSION_COOKIE, verifySession } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import {
  getAffiliateProject,
  updateAffiliateProject,
  deleteAffiliateProject,
} from "@/lib/projects";

type Params = { params: Promise<{ id: string }> };

async function getCallerAddress(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const secret = getAuthSecret();
  const session = verifySession<{ address: string }>(token, secret || "dev");
  return session?.address ?? null;
}

/** GET /api/projects/:id */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const address = await getCallerAddress();
  const err = authorize(address, "config:read");
  if (err) return NextResponse.json({ status: "error", message: err }, { status: 403 });

  const project = await getAffiliateProject(id);
  if (!project) {
    return NextResponse.json({ status: "error", message: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ status: "ok", project });
}

/** PATCH /api/projects/:id — update affiliate details */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const address = await getCallerAddress();
  const err = authorize(address, "config:write");
  if (err) return NextResponse.json({ status: "error", message: err }, { status: 403 });

  try {
    const body = await request.json();
    // accessSecret is managed via /api/projects/:id/reset-password — not patchable directly
    const allowed = ["name", "payoutAddress", "telegramBotToken", "telegramChatId", "status", "domains", "notes"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const updated = await updateAffiliateProject(id, updates);
    if (!updated) {
      return NextResponse.json({ status: "error", message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ status: "ok", project: updated });
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid request" }, { status: 400 });
  }
}

/** DELETE /api/projects/:id */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const address = await getCallerAddress();
  const err = authorize(address, "users:manage");
  if (err) return NextResponse.json({ status: "error", message: err }, { status: 403 });

  await deleteAffiliateProject(id);
  return NextResponse.json({ status: "ok", message: "Deleted" });
}
