import { WaaSClient } from "./core/client";
import { WalletModule } from "./wallet";
import { ChainModule } from "./chain";
import { TokenModule } from "./tokens";
import { ContractModule } from "./contracts";
import { ModalModule } from "./modal";
import { AnalyticsModule } from "./analytics";
import type { WaaSConfig, ProjectConfig, ChainInfo } from "./types";

export class WaaS {
  client: WaaSClient;
  wallet: WalletModule;
  chain: ChainModule;
  tokens: TokenModule;
  contracts: ContractModule;
  modal: ModalModule;
  analytics: AnalyticsModule;

  private _config: WaaSConfig;
  private _projectConfig: ProjectConfig | null = null;

  constructor(config: WaaSConfig) {
    this._config = config;
    this.client = new WaaSClient(config);
    this.wallet = new WalletModule();
    this.chain = new ChainModule();
    this.tokens = new TokenModule();
    this.contracts = new ContractModule();
    this.modal = new ModalModule();
    this.analytics = new AnalyticsModule(this.client);
  }

  /** Fetch remote project config and dynamically configure modules */
  async init(): Promise<ProjectConfig | null> {
    if (!this._config.projectId) return null;

    try {
      const config = await this.client.getConfig(this._config.projectId);
      this._projectConfig = config;

      // Sync chains from backend config
      if (config.chains?.length) {
        for (const c of config.chains) this.chain.addChain(c);
      }

      this.analytics.track("sdk_init", {
        projectId: this._config.projectId,
        version: config.version,
      });

      return config;
    } catch {
      return null;
    }
  }

  get projectConfig() {
    return this._projectConfig;
  }

  hasFeature(name: string): boolean {
    return !!this._projectConfig?.features?.[name];
  }

  destroy() {
    this.analytics.destroy();
    this.wallet.disconnect();
  }
}

// Re-export everything
export { WaaSClient } from "./core/client";
export { WalletModule } from "./wallet";
export { ChainModule } from "./chain";
export { TokenModule } from "./tokens";
export { ContractModule } from "./contracts";
export { ModalModule } from "./modal";
export { AnalyticsModule } from "./analytics";
export * from "./types";
