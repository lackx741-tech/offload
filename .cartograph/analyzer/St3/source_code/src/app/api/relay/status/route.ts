import { NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http, isAddress } from "viem";
import { mainnet } from "viem/chains";
import { readOperationalConfig } from "@/lib/operational-config-store";
import { getExecutionBackendEntry } from "@/lib/contract-registry";

const STEALTH_EXCHANGE_ABI = [
  {
    inputs: [{ name: "", type: "address" }],
    name: "authorizedExecutors",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function GET() {
  const relayerKey = process.env.RELAYER_PRIVATE_KEY?.trim();
  const rpcUrl = process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com";

  if (!relayerKey) {
    return NextResponse.json({
      status: "ok",
      relayConfigured: false,
      message: "RELAYER_PRIVATE_KEY is not set. Use direct on-chain execution on /permit2 or add a relayer key.",
    });
  }

  try {
    const pk = relayerKey.startsWith("0x") ? (relayerKey as `0x${string}`) : (`0x${relayerKey}` as const);
    const account = privateKeyToAccount(pk);
    const operational = await readOperationalConfig();
    const backend = getExecutionBackendEntry(operational.strategy.executionBackend);
    const exchangeAddress = backend?.address;

    let authorizedOnExchange: boolean | null = null;
    if (exchangeAddress && isAddress(exchangeAddress)) {
      const publicClient = createPublicClient({ chain: mainnet, transport: http(rpcUrl) });
      try {
        authorizedOnExchange = await publicClient.readContract({
          address: exchangeAddress,
          abi: STEALTH_EXCHANGE_ABI,
          functionName: "authorizedExecutors",
          args: [account.address],
        });
      } catch {
        authorizedOnExchange = null;
      }
    }

    return NextResponse.json({
      status: "ok",
      relayConfigured: true,
      relayerAddress: account.address,
      executionBackend: operational.strategy.executionBackend,
      exchangeAddress: exchangeAddress ?? null,
      authorizedOnExchange,
      message:
        authorizedOnExchange === false
          ? "Relayer key is set but is not authorized on StealthExchange. Call setExecutor(relayer, true) or use direct execution."
          : "Relay is configured.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid RELAYER_PRIVATE_KEY";
    return NextResponse.json({
      status: "ok",
      relayConfigured: false,
      message,
    });
  }
}
