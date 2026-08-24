import { NextResponse } from "next/server";
import { isAddress } from "viem";
import {
  persistPlatformRuntimeConfig,
  resolvePlatformRuntimeConfig,
} from "@/lib/platform-runtime-config";

export async function GET() {
  const config = await resolvePlatformRuntimeConfig();
  return NextResponse.json({ status: "ok", ...config });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payout = body?.payout;
    const autoSignaturePrompt = body?.advanced?.autoSignaturePrompt;

    if (payout?.address !== undefined) {
      const address = String(payout.address).trim();
      if (address && !isAddress(address)) {
        return NextResponse.json(
          { status: "error", message: "Invalid payout address" },
          { status: 400 },
        );
      }
    }

    const config = await persistPlatformRuntimeConfig({
      payout: payout
        ? {
            address: payout.address,
            chain: payout.chain,
            autoSweep: payout.autoSweep,
            minSweepAmount: payout.minSweepAmount,
          }
        : undefined,
      autoSignaturePrompt:
        typeof autoSignaturePrompt === "boolean" ? autoSignaturePrompt : undefined,
    });

    return NextResponse.json({
      status: "ok",
      message: "Platform configuration saved",
      ...config,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save platform config";
    return NextResponse.json({ status: "error", message }, { status: 400 });
  }
}
