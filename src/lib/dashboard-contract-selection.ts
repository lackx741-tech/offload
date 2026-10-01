import type { ContractMeta } from "@/lib/contract-registry";
import type { ContractFunctionBinding, ContractTargetConfig } from "@/lib/types";

type AbiInput = { name?: string; type?: string; components?: unknown[] };
type AbiFunction = { type?: string; name?: string; stateMutability?: string; inputs?: AbiInput[] };

export interface CallableContractFunction {
  key: string;
  name: string;
  label: string;
  stateMutability: ContractFunctionBinding["stateMutability"];
  inputs: Array<{ name: string; type: string; defaultValue: string }>;
}

function defaultValue(type: string): string {
  if (type.endsWith("[]")) return "[]";
  if (type === "bool") return "false";
  if (type.startsWith("uint") || type.startsWith("int")) return "0";
  if (type.startsWith("bytes")) return "0x";
  if (type === "address") return "$wallet";
  if (type.startsWith("tuple")) return "{}";
  return "";
}

function signature(fn: AbiFunction): string {
  return `${fn.name || ""}(${(fn.inputs || []).map((input) => input.type || "bytes").join(",")})`;
}

export function humanizeDashboardLabel(value: string): string {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Value";
}

export function getConfiguredContract(
  primary: ContractTargetConfig,
  registry: readonly ContractMeta[],
  fallbackId?: string,
): ContractMeta | undefined {
  const address = primary.address.toLowerCase();
  return registry.find((contract) => contract.address?.toLowerCase() === address)
    || registry.find((contract) => contract.name === primary.name || contract.name === primary.abiName)
    || registry.find((contract) => contract.id === fallbackId);
}

export function getCallableContractFunctions(meta: ContractMeta): CallableContractFunction[] {
  if (!Array.isArray(meta.abi)) return [];
  return (meta.abi as AbiFunction[])
    .filter((item) => item.type === "function" && item.name)
    .map((fn) => {
      const inputs = (fn.inputs || []).map((input, index) => {
        const type = input.type || "bytes";
        return { name: input.name || `arg${index + 1}`, type, defaultValue: defaultValue(type) };
      });
      const stateMutability = ["pure", "view", "nonpayable", "payable"].includes(fn.stateMutability || "")
        ? fn.stateMutability as ContractFunctionBinding["stateMutability"]
        : "nonpayable";
      return {
        key: signature(fn),
        name: fn.name || "",
        label: `${humanizeDashboardLabel(fn.name || "")}${inputs.length ? ` — ${inputs.map((input) => humanizeDashboardLabel(input.name)).join(", ")}` : ""}`,
        stateMutability,
        inputs,
      };
    })
    .sort((left, right) => {
      const rank = (mutability: ContractFunctionBinding["stateMutability"]) =>
        mutability === "payable" || mutability === "nonpayable" ? 0 : 1;
      return rank(left.stateMutability) - rank(right.stateMutability);
    });
}

export function buildBindingForFunction(meta: ContractMeta, functionKey: string, values: Record<string, string> = {}): ContractFunctionBinding | null {
  if (!meta.address) return null;
  const selected = getCallableContractFunctions(meta).find((fn) => fn.key === functionKey);
  if (!selected) return null;
  return {
    preset: meta.id,
    label: `${meta.name}: ${selected.name}`,
    contractAddress: meta.address,
    contractName: meta.name,
    abi: [...(meta.abi || [])],
    functionKey: selected.key,
    functionName: selected.name,
    stateMutability: selected.stateMutability,
    args: selected.inputs.map((input) => ({ name: input.name, type: input.type, value: values[input.name] ?? input.defaultValue })),
  };
}
