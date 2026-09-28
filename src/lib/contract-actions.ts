import { canonicalAbiParameterType, type AbiParameter } from "@/lib/control-plane/abi-compiler";
import type { FrontpageAction, FrontpageConfig } from "@/lib/frontpage-config";

export type CompiledContractActionV1 = {
  schemaVersion: 1;
  kind: "contractWrite";
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  chainId: number;
  contractAddress: string;
  methodAbi: unknown;
  functionName: string;
  functionSignature: string;
  paramsJson: string;
  args: unknown[];
  valueWei?: string;
};

function parseActionArgs(paramsJson: string): unknown[] {
  const value = paramsJson.trim() ? (JSON.parse(paramsJson) as unknown) : [];
  if (!Array.isArray(value)) throw new Error("Contract action paramsJson must contain a JSON array");
  return value;
}

export function toCompiledContractAction(
  action: Extract<FrontpageAction, { kind: "contractWrite" }>,
): CompiledContractActionV1 {
  const method = action.methodAbi as { name?: unknown; inputs?: unknown };
  if (!method || typeof method.name !== "string" || !method.name) {
    throw new Error(`Contract action ${action.id} needs a named function ABI`);
  }
  const inputs = Array.isArray(method.inputs) ? (method.inputs as AbiParameter[]) : [];
  return {
    schemaVersion: 1,
    kind: "contractWrite",
    id: action.id,
    title: action.title,
    description: action.description,
    ctaLabel: action.ctaLabel,
    chainId: action.chainId,
    contractAddress: action.contractAddress,
    methodAbi: action.methodAbi,
    functionName: method.name,
    functionSignature: `${method.name}(${inputs.map(canonicalAbiParameterType).join(",")})`,
    paramsJson: action.paramsJson,
    args: parseActionArgs(action.paramsJson),
    ...(action.valueWei === undefined ? {} : { valueWei: action.valueWei }),
  };
}

export function deriveCompiledActionsFromFrontpage(config: FrontpageConfig): CompiledContractActionV1[] {
  return config.actions
    .filter((action): action is Extract<FrontpageAction, { kind: "contractWrite" }> => action.kind === "contractWrite")
    .map(toCompiledContractAction);
}
