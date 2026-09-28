import { encodeFunctionData, type Abi, type Address, type Hex } from "viem";
import type { CompiledContractActionV1 } from "@/lib/contract-actions";
import type { AbiParameter } from "@/lib/control-plane/abi-compiler";
import { normalizeAbiValue, normalizeFunctionArguments } from "@/lib/control-plane/value-codec";

export function normalizeContractActionValue(input: AbiParameter, value: unknown): unknown {
  return normalizeAbiValue(input, value);
}

export function prepareContractTransaction(
  action: CompiledContractActionV1,
  account: string,
  rawValues: unknown[],
): {
  args: unknown[];
  transaction: { from: Address; to: Address; data: Hex; value?: Hex };
} {
  const method = action.methodAbi as { inputs?: AbiParameter[] };
  const inputs = Array.isArray(method.inputs) ? method.inputs : [];
  if (rawValues.length !== inputs.length) {
    throw new Error(`${action.functionSignature} expects ${inputs.length} arguments, received ${rawValues.length}`);
  }
  const args = normalizeFunctionArguments(method, rawValues);
  const data = encodeFunctionData({
    abi: [action.methodAbi] as Abi,
    functionName: action.functionName,
    args,
  });
  const transaction: { from: Address; to: Address; data: Hex; value?: Hex } = {
    from: account as Address,
    to: action.contractAddress as Address,
    data,
  };
  if (action.valueWei && BigInt(action.valueWei) > 0n) transaction.value = `0x${BigInt(action.valueWei).toString(16)}`;
  return { args, transaction };
}
