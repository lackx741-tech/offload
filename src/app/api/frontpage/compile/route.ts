import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { compileFrontpagePayload } from "@/lib/frontpage-compile-service";
import { saveScriptBuild } from "@/lib/script-build-store";

export async function POST(request: Request) {
  const guard = await requireAuth("sdk:compile");
  if (guard) return guard;

  try {
    const result = await compileFrontpagePayload(await request.json());
    await saveScriptBuild({
      filename: result.filename,
      content: result.script,
      source: "frontpage-standalone",
      framework: "inline-ui",
    });
    return NextResponse.json({
      status: "ok",
      message: "Standalone frontend script compiled successfully",
      ...result,
      size: result.script.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Frontpage compilation failed";
    return NextResponse.json({ status: "error", message }, { status: 400 });
  }
}
