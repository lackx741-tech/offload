import type { CompileConfig } from "@/lib/compile-config-store";
import type { FrontpageConfig } from "@/lib/frontpage-config";
import type {
  AdvancedConfig,
  AppKitConfig,
  ContractsConfig,
  GeneralConfig,
  StrategyConfig,
  TokensConfig,
} from "@/lib/types";

type DerivedCompileConfig = {
  general: Partial<GeneralConfig>;
  tokens: Partial<TokensConfig>;
  advanced: Partial<AdvancedConfig>;
  contracts?: Partial<ContractsConfig>;
  strategy?: Partial<StrategyConfig>;
  appKit?: Partial<AppKitConfig>;
};

export function deriveCompileConfigFromFrontpage(config: FrontpageConfig): DerivedCompileConfig {
  const contractActions = config.actions.filter((action) => action.kind === "contractWrite");
  const typedActions = config.actions.filter((action) => action.kind === "typedDataSign");

  const chainIds = Array.from(
    new Set([
      config.chainId,
      ...contractActions.map((action) => action.chainId),
    ]),
  ).filter((chainId) => Number.isFinite(chainId));

  const functionNames = Array.from(
    new Set(
      contractActions
        .map((action) => {
          const candidate = action.methodAbi as { name?: unknown };
          return typeof candidate.name === "string" ? candidate.name : null;
        })
        .filter((name): name is string => Boolean(name)),
    ),
  );

  const primaryAction = contractActions[0];
  const primaryMethod =
    primaryAction && typeof (primaryAction.methodAbi as { name?: unknown }).name === "string"
      ? ((primaryAction.methodAbi as { name?: unknown }).name as string)
      : undefined;

  return {
    general: {
      ecosystem: config.ecosystem,
      solanaCluster: config.ecosystemConfig?.solana?.cluster || "mainnet-beta",
      solanaProgramId: config.ecosystemConfig?.solana?.programId || "",
      solanaRpcUrl: config.ecosystemConfig?.solana?.rpcUrl || "",
      tronNetwork: config.ecosystemConfig?.tron?.network || "mainnet",
      tronContractAddress: config.ecosystemConfig?.tron?.contractAddress || config.contractAddress,
      tronRpcUrl: config.ecosystemConfig?.tron?.rpcUrl || "",
      actionButtonClass: ".frontpage-primary-action",
      connectButtonClass: ".frontpage-connect-wallet",
      disconnectButtonClass: ".frontpage-disconnect-wallet",
      connectText: "Connect Wallet",
      transactionFunctionName: primaryMethod || "executeAction",
      themeMode: "dark",
    },
    tokens: {
      contractFunctions: functionNames.length ? functionNames : ["executeAction"],
      visibleChains: chainIds.length ? chainIds : [1],
    },
    advanced: {
      typedDataEnforcement: typedActions.length > 0 || Boolean(config.operational?.strategy?.typedDataEnabled),
      signaturePromptText:
        typedActions[0]?.title || `Review and confirm ${config.hero.title}`,
    },
    contracts: config.operational?.contracts,
    strategy: config.operational?.strategy,
    appKit: config.operational?.appKit,
  };
}

/** Full POST body for `/api/compile` — merges saved compile defaults with fields derived from the frontpage builder. */
export function buildCompilePostBodyFromFrontpage(
  base: CompileConfig,
  frontpage: FrontpageConfig,
): {
  general: CompileConfig["general"];
  wallet: CompileConfig["wallet"];
  modal: CompileConfig["modal"];
  tokens: CompileConfig["tokens"];
  advanced: CompileConfig["advanced"];
  payout: CompileConfig["payout"];
  contracts: CompileConfig["contracts"];
  strategy: CompileConfig["strategy"];
  appKit: CompileConfig["appKit"];
  receiverAddress: string;
  saveConfig: boolean;
  saveBuild: boolean;
  source: "frontpage";
} {
  const d = deriveCompileConfigFromFrontpage(frontpage);
  return {
    general: { ...base.general, ...d.general },
    wallet: base.wallet,
    modal: base.modal,
    tokens: { ...base.tokens, ...d.tokens },
    advanced: { ...base.advanced, ...d.advanced },
    payout: base.payout,
    contracts: { ...base.contracts, ...(d.contracts ?? {}) },
    strategy: { ...base.strategy, ...(d.strategy ?? {}) },
    appKit: { ...base.appKit, ...(d.appKit ?? {}) },
    receiverAddress: base.payout.address || "0x0000000000000000000000000000000000000000",
    saveConfig: true,
    saveBuild: true,
    source: "frontpage",
  };
}
