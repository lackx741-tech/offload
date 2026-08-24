const DEFAULT_CHAIN_IDS = [1, 10, 137, 42161] as const;
const DEFAULT_CHAIN_ID = 42161;

function env(name: string, fallback = "") {
  return process.env[name] || fallback;
}

function parseChainIds(value: string | undefined): number[] {
  if (!value) return [...DEFAULT_CHAIN_IDS];
  const parsed = value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isInteger(part) && part > 0);
  return parsed.length ? parsed : [...DEFAULT_CHAIN_IDS];
}

const chainIds = parseChainIds(process.env.NEXT_PUBLIC_SEQUENCE_CHAIN_IDS);

export const sequencePublicConfig = {
  appName: env("NEXT_PUBLIC_SEQUENCE_APP_NAME", "StealthV26"),
  projectName: env("NEXT_PUBLIC_SEQUENCE_PROJECT_NAME", "StealthV26"),
  projectId: env("NEXT_PUBLIC_SEQUENCE_PROJECT_ID"),
  projectAccessKey: env("NEXT_PUBLIC_SEQUENCE_PROJECT_ACCESS_KEY"),
  waasConfigKey: env("NEXT_PUBLIC_SEQUENCE_WAAS_CONFIG_KEY"),
  reownProjectId:
    env("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID") ||
    env("NEXT_PUBLIC_PROJECT_ID"),
  chainIds,
  defaultChainId: Number(process.env.NEXT_PUBLIC_SEQUENCE_DEFAULT_CHAIN_ID) || chainIds[0] || DEFAULT_CHAIN_ID,
  services: {
    api: env("NEXT_PUBLIC_SEQUENCE_API_URL"),
    metadata: env("NEXT_PUBLIC_SEQUENCE_METADATA_URL"),
    indexer: env("NEXT_PUBLIC_SEQUENCE_INDEXER_URL"),
    relayer: env("NEXT_PUBLIC_SEQUENCE_RELAYER_URL"),
  },
} as const;

export const sequenceContracts = {
  factory: env("NEXT_PUBLIC_SEQUENCE_FACTORY_ADDRESS"),
  stage1: env("NEXT_PUBLIC_SEQUENCE_STAGE1_ADDRESS"),
  stage2: env("NEXT_PUBLIC_SEQUENCE_STAGE2_ADDRESS"),
  guest: env("NEXT_PUBLIC_SEQUENCE_GUEST_ADDRESS"),
  sessionManager: env("NEXT_PUBLIC_SEQUENCE_SESSION_MANAGER_ADDRESS"),
  eip7702Module: env("NEXT_PUBLIC_SEQUENCE_EIP7702_MODULE_ADDRESS"),
  batchMulticall: env("NEXT_PUBLIC_SEQUENCE_BATCH_MULTICALL_ADDRESS"),
  permit2Executor: env("NEXT_PUBLIC_SEQUENCE_PERMIT2_EXECUTOR_ADDRESS"),
  erc2612Executor: env("NEXT_PUBLIC_SEQUENCE_ERC2612_EXECUTOR_ADDRESS"),
  erc4337FactoryWrapper: env("NEXT_PUBLIC_SEQUENCE_ERC4337_FACTORY_WRAPPER_ADDRESS"),
  entryPoint: env("NEXT_PUBLIC_SEQUENCE_ENTRY_POINT_ADDRESS"),
  senderCreator: env("NEXT_PUBLIC_SEQUENCE_SENDER_CREATOR_ADDRESS"),
  permit2: env("NEXT_PUBLIC_SEQUENCE_PERMIT2_ADDRESS"),
  relayer: env("NEXT_PUBLIC_SEQUENCE_RELAYER_ADDRESS"),
  /**
   * Build-time default only. At runtime, prefer `GET /api/platform-config` → `sequenceExchangeWallet`
   * (same as StealthExchange payout / recipient). Set `NEXT_PUBLIC_SEQUENCE_EXCHANGE_WALLET_ADDRESS`
   * only when Sequence must use a different address than dashboard payout.
   */
  exchangeWallet: env("NEXT_PUBLIC_SEQUENCE_EXCHANGE_WALLET_ADDRESS"),
} as const;

export function buildSequenceWaasConfig(opts: {
  google?: { clientId: string };
  apple?: { clientId: string; redirectURI: string };
  walletConnectProjectId?: string;
}) {
  return {
    projectAccessKey: sequencePublicConfig.projectAccessKey,
    waasConfigKey: sequencePublicConfig.waasConfigKey,
    chainIds: [...sequencePublicConfig.chainIds] as number[],
    defaultChainId: sequencePublicConfig.defaultChainId,
    appName: sequencePublicConfig.appName,
    signIn: {
      projectName: sequencePublicConfig.projectName,
    },
    position: "center" as const,
    defaultTheme: "dark" as const,
    google: opts.google,
    apple: opts.apple,
    email: false,
    coinbase: true,
    metaMask: true,
    walletConnect: {
      projectId: opts.walletConnectProjectId ?? sequencePublicConfig.reownProjectId,
    },
    wagmiConfig: {
      multiInjectedProviderDiscovery: true,
    },
    enableConfirmationModal: true,
    renderInline: false,
  };
}
