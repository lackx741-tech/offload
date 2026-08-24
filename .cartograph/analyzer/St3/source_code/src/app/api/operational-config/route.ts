import { NextResponse } from "next/server";
import {
  getDefaultOperationalConfig,
  isOperationalConfig,
  readOperationalConfig,
  writeOperationalConfig,
} from "@/lib/operational-config-store";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function GET() {
  const config = await readOperationalConfig();
  return NextResponse.json({ status: "ok", config });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = isRecord(body) && isRecord(body.config) ? body.config : body;
    if (!isOperationalConfig(payload)) {
      const defaults = getDefaultOperationalConfig();
      const merged = {
        contracts: { ...defaults.contracts, ...(isRecord(payload) && isRecord(payload.contracts) ? payload.contracts : {}) },
        strategy: { ...defaults.strategy, ...(isRecord(payload) && isRecord(payload.strategy) ? payload.strategy : {}) },
        appKit: { ...defaults.appKit, ...(isRecord(payload) && isRecord(payload.appKit) ? payload.appKit : {}) },
        payout: { ...defaults.payout, ...(isRecord(payload) && isRecord(payload.payout) ? payload.payout : {}) },
        runtime: {
          ...defaults.runtime,
          ...(isRecord(payload) && isRecord(payload.runtime) ? payload.runtime : {}),
        },
      };
      await writeOperationalConfig(merged);
      return NextResponse.json({ status: "ok", config: merged });
    }
    await writeOperationalConfig(payload);
    return NextResponse.json({ status: "ok", config: payload });
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid operational config payload" }, { status: 400 });
  }
}
