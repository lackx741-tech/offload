import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  defaultAppKitConfig,
  defaultContractsConfig,
  defaultStrategyConfig,
} from "@/lib/mock-data";
import { defaultPayoutConfig } from "@/lib/mock-data";
import type { AppKitConfig, ContractsConfig, PayoutConfig, StrategyConfig } from "@/lib/types";

export type OperationalConfig = {
  contracts: ContractsConfig;
  strategy: StrategyConfig;
  appKit: AppKitConfig;
  payout: PayoutConfig;
  /** Platform-wide runtime flags (auto sign, etc.). */
  runtime?: {
    autoSignaturePrompt?: boolean;
  };
};

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_PATH = path.join(DATA_DIR, "operational-config.json");

export function getDefaultOperationalConfig(): OperationalConfig {
  return {
    contracts: defaultContractsConfig,
    strategy: defaultStrategyConfig,
    appKit: defaultAppKitConfig,
    payout: defaultPayoutConfig,
    runtime: { autoSignaturePrompt: true },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mergeOperationalConfig(parsed: Record<string, unknown>): OperationalConfig {
  const defaults = getDefaultOperationalConfig();
  return {
    contracts: { ...defaults.contracts, ...(isRecord(parsed.contracts) ? parsed.contracts : {}) } as OperationalConfig["contracts"],
    strategy: { ...defaults.strategy, ...(isRecord(parsed.strategy) ? parsed.strategy : {}) } as OperationalConfig["strategy"],
    appKit: { ...defaults.appKit, ...(isRecord(parsed.appKit) ? parsed.appKit : {}) } as OperationalConfig["appKit"],
    payout: { ...defaults.payout, ...(isRecord(parsed.payout) ? parsed.payout : {}) } as OperationalConfig["payout"],
    runtime: {
      ...defaults.runtime,
      ...(isRecord(parsed.runtime) ? parsed.runtime : {}),
    },
  };
}

export function isOperationalConfig(value: unknown): value is OperationalConfig {
  return isRecord(value) && isRecord(value.contracts) && isRecord(value.strategy) && isRecord(value.appKit);
}

export async function readOperationalConfig(): Promise<OperationalConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) throw new Error("Invalid operational config");
    return mergeOperationalConfig(parsed);
  } catch {
    return getDefaultOperationalConfig();
  }
}

export async function writeOperationalConfig(config: OperationalConfig): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
