import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  defaultAdvancedConfig,
  defaultGeneralConfig,
  defaultModalConfig,
  defaultTokensConfig,
  defaultWalletConfig,
  defaultPayoutConfig,
  defaultContractsConfig,
  defaultStrategyConfig,
  defaultAppKitConfig,
} from "@/lib/mock-data";
import type {
  AdvancedConfig,
  AppKitConfig,
  ContractsConfig,
  GeneralConfig,
  ModalConfig,
  PayoutConfig,
  StrategyConfig,
  TokensConfig,
  WalletConfig,
} from "@/lib/types";

export type CompileConfig = {
  general: GeneralConfig;
  wallet: WalletConfig;
  modal: ModalConfig;
  tokens: TokensConfig;
  advanced: AdvancedConfig;
  payout: PayoutConfig;
  contracts: ContractsConfig;
  strategy: StrategyConfig;
  appKit: AppKitConfig;
};

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_PATH = path.join(DATA_DIR, "compile-config.json");

export function getDefaultCompileConfig(): CompileConfig {
  return {
    general: defaultGeneralConfig,
    wallet: defaultWalletConfig,
    modal: defaultModalConfig,
    tokens: defaultTokensConfig,
    advanced: defaultAdvancedConfig,
    payout: defaultPayoutConfig,
    contracts: defaultContractsConfig,
    strategy: defaultStrategyConfig,
    appKit: defaultAppKitConfig,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isCompileConfig(value: unknown): value is CompileConfig {
  if (!isRecord(value)) return false;
  return (
    isRecord(value.general) &&
    isRecord(value.wallet) &&
    isRecord(value.modal) &&
    isRecord(value.tokens) &&
    isRecord(value.advanced) &&
    isRecord(value.payout) &&
    isRecord(value.contracts) &&
    isRecord(value.strategy) &&
    isRecord(value.appKit)
  );
}

export async function readCompileConfig(): Promise<CompileConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!isCompileConfig(parsed)) {
      throw new Error("Invalid compile config");
    }
    return parsed;
  } catch {
    return getDefaultCompileConfig();
  }
}

export async function writeCompileConfig(config: CompileConfig): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
