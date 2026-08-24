/**
 * Multi-chain Transaction Router
 *
 * Routes transactions to the correct chain RPC, manages provider pool,
 * and handles chain-specific gas estimation and submission.
 */

import { createPublicClient, http, type Chain, type PublicClient } from "viem";
import { mainnet, bsc, polygon, avalanche, arbitrum, optimism, base } from "viem/chains";

export interface ChainConfig {
  chain: Chain;
  rpcUrl: string;
  priority: number; // lower = preferred
}

const DEFAULT_CHAINS: ChainConfig[] = [
  { chain: mainnet, rpcUrl: process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com", priority: 1 },
  { chain: bsc, rpcUrl: process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org", priority: 2 },
  { chain: polygon, rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com", priority: 2 },
  { chain: avalanche, rpcUrl: process.env.AVALANCHE_RPC_URL || "https://api.avax.network/ext/bc/C/rpc", priority: 3 },
  { chain: arbitrum, rpcUrl: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc", priority: 2 },
  { chain: optimism, rpcUrl: process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io", priority: 2 },
  { chain: base, rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org", priority: 2 },
];

class ChainRouter {
  private clients = new Map<number, PublicClient>();
  private configs = new Map<number, ChainConfig>();

  constructor(chains?: ChainConfig[]) {
    for (const cfg of chains ?? DEFAULT_CHAINS) {
      this.configs.set(cfg.chain.id, cfg);
      this.clients.set(
        cfg.chain.id,
        createPublicClient({ chain: cfg.chain, transport: http(cfg.rpcUrl) })
      );
    }
  }

  getClient(chainId: number): PublicClient {
    const client = this.clients.get(chainId);
    if (!client) throw new Error(`Chain ${chainId} not configured in router`);
    return client;
  }

  getConfig(chainId: number): ChainConfig {
    const cfg = this.configs.get(chainId);
    if (!cfg) throw new Error(`Chain ${chainId} not configured`);
    return cfg;
  }

  getSupportedChains(): number[] {
    return [...this.configs.keys()];
  }

  async getGasPrice(chainId: number): Promise<bigint> {
    const client = this.getClient(chainId);
    return client.getGasPrice();
  }

  async getBlockNumber(chainId: number): Promise<bigint> {
    const client = this.getClient(chainId);
    return client.getBlockNumber();
  }

  async getBalance(chainId: number, address: `0x${string}`): Promise<bigint> {
    const client = this.getClient(chainId);
    return client.getBalance({ address });
  }

  /** Pick the best chain for a transaction based on gas cost */
  async selectOptimalChain(candidateChains: number[]): Promise<number> {
    const gasPrices = await Promise.all(
      candidateChains.map(async (id) => {
        try {
          const price = await this.getGasPrice(id);
          const priority = this.configs.get(id)?.priority ?? 99;
          return { chainId: id, gasPrice: price, priority };
        } catch {
          return { chainId: id, gasPrice: BigInt(Number.MAX_SAFE_INTEGER), priority: 99 };
        }
      })
    );

    gasPrices.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.gasPrice < b.gasPrice ? -1 : 1;
    });

    return gasPrices[0].chainId;
  }

  async readContract(
    chainId: number,
    params: Parameters<PublicClient["readContract"]>[0],
  ) {
    const client = this.getClient(chainId);
    return client.readContract(params);
  }
}

// Singleton
let _router: ChainRouter | null = null;

export function getChainRouter(): ChainRouter {
  if (!_router) _router = new ChainRouter();
  return _router;
}

export { ChainRouter };
