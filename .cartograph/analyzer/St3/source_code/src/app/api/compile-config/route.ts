import { NextResponse } from "next/server";
import {
  getDefaultCompileConfig,
  isCompileConfig,
  readCompileConfig,
  writeCompileConfig,
} from "@/lib/compile-config-store";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const guard = await requireAuth("config:read");
  if (guard) return guard;
  const config = await readCompileConfig();
  return NextResponse.json({
    status: "ok",
    config,
    defaults: getDefaultCompileConfig(),
  });
}

export async function POST(request: Request) {
  const guard = await requireAuth("config:write");
  if (guard) return guard;

  try {
    const body = await request.json();
    const config = body?.config ?? body;
    if (!isCompileConfig(config)) {
      return NextResponse.json(
        { status: "error", message: "Invalid compile config payload" },
        { status: 400 },
      );
    }

    await writeCompileConfig(config);
    return NextResponse.json({
      status: "ok",
      message: "Compile config saved",
      config,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Failed to save compile config" },
      { status: 400 },
    );
  }
}
