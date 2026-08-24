import type { Ecosystem } from "@/lib/types";

export const ECOSYSTEM_OPTIONS: Array<{
  value: Ecosystem;
  label: string;
  description: string;
}> = [
  {
    value: "evm",
    label: "EVM",
    description: "ABI-driven contracts, EIP-712, WalletConnect/Reown, and the current modal runtime.",
  },
  {
    value: "solana",
    label: "Solana",
    description: "Program ID / IDL style builder scaffold for Phantom, Solflare, and other Solana wallets.",
  },
  {
    value: "tron",
    label: "Tron",
    description: "TronLink / TronWeb contract action scaffold with TRON-specific address and runtime hooks.",
  },
];

export function getEcosystemLabel(ecosystem: Ecosystem): string {
  return ECOSYSTEM_OPTIONS.find((option) => option.value === ecosystem)?.label ?? ecosystem.toUpperCase();
}
