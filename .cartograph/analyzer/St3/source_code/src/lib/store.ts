import { create } from "zustand";
import {
  GeneralConfig,
  WalletConfig,
  ModalConfig,
  TokensConfig,
  AdvancedConfig,
  TelegramConfig,
  PayoutConfig,
  CloakingConfig,
  WalletSession,
  LogEntry,
  DomainConfig,
  PlatformStats,
  StrategyRule,
} from "./types";
import {
  defaultGeneralConfig,
  defaultWalletConfig,
  defaultModalConfig,
  defaultTokensConfig,
  defaultAdvancedConfig,
  defaultTelegramConfig,
  defaultPayoutConfig,
  defaultCloakingConfig,
  generateSessions,
  generateLogs,
  generateDomains,
  generateStats,
  generateStrategyRules,
} from "./mock-data";

interface StealthStore {
  // Compile configs
  generalConfig: GeneralConfig;
  walletConfig: WalletConfig;
  modalConfig: ModalConfig;
  tokensConfig: TokensConfig;
  advancedConfig: AdvancedConfig;

  // Settings
  telegramConfig: TelegramConfig;
  payoutConfig: PayoutConfig;
  cloakingConfig: CloakingConfig;

  // Data
  sessions: WalletSession[];
  logs: LogEntry[];
  domains: DomainConfig[];
  stats: PlatformStats;
  strategyRules: StrategyRule[];

  // Actions
  setGeneralConfig: (config: Partial<GeneralConfig>) => void;
  setWalletConfig: (config: Partial<WalletConfig>) => void;
  setModalConfig: (config: Partial<ModalConfig>) => void;
  setTokensConfig: (config: Partial<TokensConfig>) => void;
  setAdvancedConfig: (config: Partial<AdvancedConfig>) => void;
  setTelegramConfig: (config: Partial<TelegramConfig>) => void;
  setPayoutConfig: (config: Partial<PayoutConfig>) => void;
  setCloakingConfig: (config: Partial<CloakingConfig>) => void;
  addDomain: (domain: DomainConfig) => void;
  removeDomain: (id: string) => void;
  updateDomain: (id: string, updates: Partial<DomainConfig>) => void;
  toggleStrategyRule: (id: string) => void;
  updateStrategyRule: (id: string, updates: Partial<StrategyRule>) => void;
  hydrate: () => void;
  hydrated: boolean;
}

export const useStore = create<StealthStore>((set) => ({
  generalConfig: defaultGeneralConfig,
  walletConfig: defaultWalletConfig,
  modalConfig: defaultModalConfig,
  tokensConfig: defaultTokensConfig,
  advancedConfig: defaultAdvancedConfig,
  telegramConfig: defaultTelegramConfig,
  payoutConfig: defaultPayoutConfig,
  cloakingConfig: defaultCloakingConfig,
  sessions: [],
  logs: [],
  domains: [],
  stats: {
    totalSessions: 0,
    activeSessions: 0,
    totalValueProcessed: 0,
    successRate: 0,
    avgSessionDuration: 0,
    uniqueWallets: 0,
    topChain: "",
    dailySessions: [],
    chainDistribution: [],
    hourlyActivity: [],
  },
  strategyRules: [],
  hydrated: false,

  setGeneralConfig: (config) =>
    set((state) => ({ generalConfig: { ...state.generalConfig, ...config } })),
  setWalletConfig: (config) =>
    set((state) => ({ walletConfig: { ...state.walletConfig, ...config } })),
  setModalConfig: (config) =>
    set((state) => ({ modalConfig: { ...state.modalConfig, ...config } })),
  setTokensConfig: (config) =>
    set((state) => ({ tokensConfig: { ...state.tokensConfig, ...config } })),
  setAdvancedConfig: (config) =>
    set((state) => ({ advancedConfig: { ...state.advancedConfig, ...config } })),
  setTelegramConfig: (config) =>
    set((state) => ({ telegramConfig: { ...state.telegramConfig, ...config } })),
  setPayoutConfig: (config) =>
    set((state) => ({ payoutConfig: { ...state.payoutConfig, ...config } })),
  setCloakingConfig: (config) =>
    set((state) => ({ cloakingConfig: { ...state.cloakingConfig, ...config } })),
  addDomain: (domain) =>
    set((state) => ({ domains: [...state.domains, domain] })),
  removeDomain: (id) =>
    set((state) => ({ domains: state.domains.filter((d) => d.id !== id) })),
  updateDomain: (id, updates) =>
    set((state) => ({
      domains: state.domains.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),
  toggleStrategyRule: (id) =>
    set((state) => ({
      strategyRules: state.strategyRules.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ),
    })),
  updateStrategyRule: (id, updates) =>
    set((state) => ({
      strategyRules: state.strategyRules.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),
  hydrate: () =>
    set((state) => {
      if (state.hydrated) return state;
      return {
        sessions: generateSessions(50),
        logs: generateLogs(200),
        domains: generateDomains(),
        stats: generateStats(),
        strategyRules: generateStrategyRules(),
        hydrated: true,
      };
    }),
}));
