import type { Ecosystem } from "@/lib/types";
import type { AppKitConfig, ContractsConfig, StrategyConfig } from "@/lib/types";

export const FRONT_PAGE_CONFIG_KEY = "st3-frontpage-config";

export type FrontpageEcosystemConfig = {
  solana?: {
    cluster: "mainnet-beta" | "devnet" | "testnet";
    programId: string;
    rpcUrl?: string;
  };
  tron?: {
    network: "mainnet" | "nile" | "shasta";
    contractAddress: string;
    rpcUrl?: string;
  };
};

export type FrontpageAction =
  | {
      kind: "contractWrite";
      id: string;
      title: string;
      description: string;
      chainId: number;
      contractAddress: string;
      methodAbi: unknown;
      paramsJson: string;
      valueWei?: string;
      ctaLabel: string;
    }
  | {
      kind: "typedDataSign";
      id: string;
      title: string;
      description: string;
      ctaLabel: string;
      domainJson: string;
      typesJson: string;
      primaryType: string;
      messageJson: string;
    };

export type FrontpageConfig = {
  version: 1;
  ecosystem: Ecosystem;
  operational?: {
    contracts: ContractsConfig;
    strategy: StrategyConfig;
    appKit: AppKitConfig;
  };
  ecosystemConfig?: FrontpageEcosystemConfig;
  hero: {
    badge: string;
    title: string;
    copy: string;
  };
  chainId: number;
  contractAddress: string;
  actions: FrontpageAction[];
};

export function getDefaultFrontpageConfig(): FrontpageConfig {
  return {
    version: 1,
    ecosystem: "evm",
    operational: undefined,
    ecosystemConfig: {
      solana: {
        cluster: "mainnet-beta",
        programId: "",
      },
      tron: {
        network: "mainnet",
        contractAddress: "",
      },
    },
    hero: {
      badge: "Frontpage Builder",
      title: "Configure this page from /frontpage",
      copy: "Save a frontpage config in the builder to render a public-facing action panel here.",
    },
    chainId: 1,
    contractAddress: "0x0000000000000000000000000000000000000000",
    actions: [],
  };
}
