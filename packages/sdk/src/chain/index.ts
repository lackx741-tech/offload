import type { ChainInfo } from "../types";

const DEFAULT_CHAINS: ChainInfo[] = [
  { chainId: 1, name: "Ethereum", rpcUrl: "https://eth.llamarpc.com", symbol: "ETH", explorer: "https://etherscan.io" },
  { chainId: 56, name: "BSC", rpcUrl: "https://bsc-dataseed1.binance.org", symbol: "BNB", explorer: "https://bscscan.com" },
  { chainId: 137, name: "Polygon", rpcUrl: "https://polygon-rpc.com", symbol: "MATIC", explorer: "https://polygonscan.com" },
  { chainId: 43114, name: "Avalanche", rpcUrl: "https://api.avax.network/ext/bc/C/rpc", symbol: "AVAX", explorer: "https://snowtrace.io" },
  { chainId: 42161, name: "Arbitrum", rpcUrl: "https://arb1.arbitrum.io/rpc", symbol: "ETH", explorer: "https://arbiscan.io" },
  { chainId: 10, name: "Optimism", rpcUrl: "https://mainnet.optimism.io", symbol: "ETH", explorer: "https://optimistic.etherscan.io" },
  { chainId: 8453, name: "Base", rpcUrl: "https://mainnet.base.org", symbol: "ETH", explorer: "https://basescan.org" },
  { chainId: 324, name: "zkSync", rpcUrl: "https://mainnet.era.zksync.io", symbol: "ETH", explorer: "https://explorer.zksync.io" },
];

export class ChainModule {
  private chains: Map<number, ChainInfo>;

  constructor(customChains?: ChainInfo[]) {
    this.chains = new Map();
    for (const c of customChains ?? DEFAULT_CHAINS) {
      this.chains.set(c.chainId, c);
    }
  }

  getChain(chainId: number): ChainInfo | undefined {
    return this.chains.get(chainId);
  }

  getChainByName(name: string): ChainInfo | undefined {
    for (const c of this.chains.values()) {
      if (c.name.toLowerCase() === name.toLowerCase()) return c;
    }
    return undefined;
  }

  getAllChains(): ChainInfo[] {
    return [...this.chains.values()];
  }

  isSupported(chainId: number): boolean {
    return this.chains.has(chainId);
  }

  addChain(chain: ChainInfo) {
    this.chains.set(chain.chainId, chain);
  }

  async switchChain(provider: any, chainId: number): Promise<void> {
    const hex = "0x" + chainId.toString(16);
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
    } catch (err: any) {
      if (err.code === 4902) {
        const chain = this.getChain(chainId);
        if (!chain) throw new Error(`Chain ${chainId} not configured`);
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: hex,
            chainName: chain.name,
            nativeCurrency: { name: chain.symbol, symbol: chain.symbol, decimals: 18 },
            rpcUrls: [chain.rpcUrl],
            blockExplorerUrls: [chain.explorer],
          }],
        });
      } else {
        throw err;
      }
    }
  }
}
