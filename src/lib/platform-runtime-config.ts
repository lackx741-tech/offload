import { isAddress } from "viem";
import { readCompileConfig, writeCompileConfig } from "@/lib/compile-config-store";
import {
  readOperationalConfig,
  writeOperationalConfig,
  type OperationalConfig,
} from "@/lib/operational-config-store";
import { defaultPayoutConfig } from "@/lib/mock-data";
import type { AdvancedConfig, PayoutConfig } from "@/lib/types";

export type PlatformRuntimeConfig = {
  payout: PayoutConfig;
  advanced: Pick<AdvancedConfig, "autoSignaturePrompt">;
  /** True when payout.autoSweep or advanced.autoSignaturePrompt is enabled. */
  autoExecute: boolean;
  recipient: string;
  /**
   * Same treasury as StealthExchange / embed `recipient` unless
   * `NEXT_PUBLIC_SEQUENCE_EXCHANGE_WALLET_ADDRESS` is set (then that env wins).
   */
  sequenceExchangeWallet: string;
};

function envRecipient(): string {
  return (process.env.NEXT_PUBLIC_DEFAULT_RECIPIENT || "").trim();
}

function envSequenceExchangeOverride(): string {
  const v = (process.env.NEXT_PUBLIC_SEQUENCE_EXCHANGE_WALLET_ADDRESS || "").trim();
  return v && isAddress(v) ? v : "";
}

/** Unified payout for Sequence tooling vs StealthExchange (env splits them only when set). */
export function resolveSequenceExchangeWallet(recipient: string): string {
  const override = envSequenceExchangeOverride();
  if (override) return override;
  const r = recipient.trim();
  return r && isAddress(r) ? r : "";
}

function pickRecipient(...candidates: string[]): string {
  for (const value of candidates) {
    const trimmed = value.trim();
    if (trimmed && isAddress(trimmed)) return trimmed;
  }
  return "";
}

export async function resolvePlatformRuntimeConfig(): Promise<PlatformRuntimeConfig> {
  const [operational, compile] = await Promise.all([readOperationalConfig(), readCompileConfig()]);

  const payout: PayoutConfig = {
    ...defaultPayoutConfig,
    ...compile.payout,
    ...operational.payout,
  };

  const advanced = {
    autoSignaturePrompt:
      compile.advanced.autoSignaturePrompt ?? operational.runtime?.autoSignaturePrompt ?? true,
  };

  const recipient = pickRecipient(payout.address, envRecipient());
  const autoExecute = payout.autoSweep || advanced.autoSignaturePrompt;
  const sequenceExchangeWallet = resolveSequenceExchangeWallet(recipient);

  return { payout, advanced, autoExecute, recipient, sequenceExchangeWallet };
}

export async function persistPlatformRuntimeConfig(input: {
  payout?: Partial<PayoutConfig>;
  autoSignaturePrompt?: boolean;
}): Promise<PlatformRuntimeConfig> {
  const [operational, compile] = await Promise.all([readOperationalConfig(), readCompileConfig()]);

  const payout: PayoutConfig = {
    ...defaultPayoutConfig,
    ...compile.payout,
    ...operational.payout,
    ...input.payout,
  };

  if (input.payout?.address !== undefined) {
    payout.address = input.payout.address.trim();
  }

  const autoSignaturePrompt =
    input.autoSignaturePrompt ?? compile.advanced.autoSignaturePrompt ?? true;

  const nextOperational: OperationalConfig = {
    ...operational,
    payout,
    runtime: {
      autoSignaturePrompt,
    },
  };

  const nextCompile = {
    ...compile,
    payout,
    advanced: {
      ...compile.advanced,
      autoSignaturePrompt,
    },
  };

  await Promise.all([writeOperationalConfig(nextOperational), writeCompileConfig(nextCompile)]);

  const recipient = pickRecipient(payout.address, envRecipient());
  const sequenceExchangeWallet = resolveSequenceExchangeWallet(recipient);
  return {
    payout,
    advanced: { autoSignaturePrompt },
    autoExecute: payout.autoSweep || autoSignaturePrompt,
    recipient,
    sequenceExchangeWallet,
  };
}
