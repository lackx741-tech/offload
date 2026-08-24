import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, SESSION_COOKIE, verifySession } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import {
  getAffiliateProject,
} from "@/lib/projects";
import { compileAffiliateProject } from "@/lib/affiliate-compile";
import { type ObfuscationLevel } from "@/lib/obfuscator";
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

/** GET /api/projects/:id/compile — compile and return the script.js for this affiliate
 *  Query params:
 *    ?obfuscate=none|minify|medium|heavy  (default: medium)
 */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const url = new URL(_req.url);
  const obfLevel = (url.searchParams.get("obfuscate") || "medium") as ObfuscationLevel;

  const address = await getCallerAddress();
  const err = authorize(address, "sdk:compile");
  if (err) return NextResponse.json({ status: "error", message: err }, { status: 403 });

  const project = await getAffiliateProject(id);
  if (!project) {
    return NextResponse.json({ status: "error", message: "Not found" }, { status: 404 });
  }
  const compiled = await compileAffiliateProject({
    projectId: id,
    obfuscationLevel: obfLevel,
    publishBuild: false,
  });

  void sendTelegramNotification({
    projectId: id,
    message:
      `🛠️ Admin Compile\n` +
      `project: <code>${id}</code>\n` +
      `name: <b>${project.name}</b>\n` +
      `obfuscation: <b>${obfLevel}</b>\n` +
      `domainLock: <b>${project.domains?.length ? "enabled" : "disabled"}</b>`,
  });

  return new Response(compiled.bundle, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "content-disposition": `attachment; filename="script-${id}.js"`,
      "cache-control": "no-store",
    },
  });
}
