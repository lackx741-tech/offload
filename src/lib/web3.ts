import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
} from "viem";
import { mainnet } from "viem/chains";

type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
};

type WindowWithEthereum = Window & {
  ethereum?: Eip1193Provider;
};

export function getInjectedProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  return (window as WindowWithEthereum).ethereum || null;
}

export async function connectInjected(): Promise<{ address: Address; chainId: number }> {
  const provider = getInjectedProvider();
  if (!provider?.request) throw new Error("No injected wallet provider");

  const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
  if (!accounts?.[0]) throw new Error("No account returned from wallet");

  const chainIdHex = await provider.request({ method: "eth_chainId" }) as string;
  const chainId = Number.parseInt(chainIdHex, 16);

  return { address: accounts[0] as Address, chainId };
}

export function getWalletClient() {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No injected wallet provider");

  return createWalletClient({
    chain: mainnet,
    transport: custom(provider),
  });
}

export function getPublicClient(rpcUrl?: string) {
  return createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl || "https://eth.llamarpc.com"),
  });
}
