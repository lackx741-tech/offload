import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { getDefaultFrontpageConfig, type FrontpageConfig } from "@/lib/frontpage-config";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_PATH = path.join(DATA_DIR, "frontpage-config.json");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOptionalString(value: unknown) {
  return typeof value === "undefined" || typeof value === "string";
}

export function isFrontpageConfig(value: unknown): value is FrontpageConfig {
  if (!isRecord(value)) return false;
  if (value.version !== 1) return false;
  if (!["evm", "solana", "tron"].includes(String(value.ecosystem))) return false;
  if (!isRecord(value.hero)) return false;
  if (typeof value.hero.badge !== "string") return false;
  if (typeof value.hero.title !== "string") return false;
  if (typeof value.hero.copy !== "string") return false;
  if (typeof value.chainId !== "number") return false;
  if (typeof value.contractAddress !== "string") return false;
  if (typeof value.ecosystemConfig !== "undefined") {
    if (!isRecord(value.ecosystemConfig)) return false;

    if (typeof value.ecosystemConfig.solana !== "undefined") {
      if (!isRecord(value.ecosystemConfig.solana)) return false;
      if (!["mainnet-beta", "devnet", "testnet"].includes(String(value.ecosystemConfig.solana.cluster))) return false;
      if (typeof value.ecosystemConfig.solana.programId !== "string") return false;
      if (!isOptionalString(value.ecosystemConfig.solana.rpcUrl)) return false;
    }

    if (typeof value.ecosystemConfig.tron !== "undefined") {
      if (!isRecord(value.ecosystemConfig.tron)) return false;
      if (!["mainnet", "nile", "shasta"].includes(String(value.ecosystemConfig.tron.network))) return false;
      if (typeof value.ecosystemConfig.tron.contractAddress !== "string") return false;
      if (!isOptionalString(value.ecosystemConfig.tron.rpcUrl)) return false;
    }
  }
  if (!Array.isArray(value.actions)) return false;
  return true;
}

export async function readFrontpageConfig(): Promise<FrontpageConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!isFrontpageConfig(parsed)) {
      throw new Error("Saved frontpage config is invalid.");
    }
    return parsed;
  } catch {
    return getDefaultFrontpageConfig();
  }
}

export async function writeFrontpageConfig(config: FrontpageConfig): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
