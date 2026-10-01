import { isAddress } from "viem";
import type { CompiledContractActionV1 } from "@/lib/contract-actions";
import { prepareContractTransaction } from "@/lib/execute-contract-action";

export type ContractCompatibilityDiagnostic = {
  code: "INVALID_ADDRESS" | "INVALID_CHAIN" | "INVALID_FUNCTION_ABI" | "INVALID_ARGUMENTS";
  message: string;
};

export type ContractCompatibilityResult = {
  actionId: string;
  valid: boolean;
  diagnostics: ContractCompatibilityDiagnostic[];
};

export function analyzeContractAction(action: CompiledContractActionV1): ContractCompatibilityResult {
  const diagnostics: ContractCompatibilityDiagnostic[] = [];
  if (!isAddress(action.contractAddress)) {
    diagnostics.push({ code: "INVALID_ADDRESS", message: `${action.id} has an invalid contract address` });
  }
  if (!Number.isSafeInteger(action.chainId) || action.chainId <= 0) {
    diagnostics.push({ code: "INVALID_CHAIN", message: `${action.id} has an invalid chain ID` });
  }
  const method = action.methodAbi as { type?: unknown; name?: unknown; inputs?: unknown };
  const validMethod = method?.type === "function" && method.name === action.functionName && Array.isArray(method.inputs);
  if (!validMethod) {
    diagnostics.push({ code: "INVALID_FUNCTION_ABI", message: `${action.id} does not contain a complete function ABI` });
  }
  if (validMethod && isAddress(action.contractAddress)) {
    try {
      prepareContractTransaction(action, "0x0000000000000000000000000000000000000001", action.args);
    } catch (error) {
      diagnostics.push({
        code: "INVALID_ARGUMENTS",
        message: error instanceof Error ? error.message : `${action.id} arguments cannot be encoded`,
      });
    }
  }
  return { actionId: action.id, valid: diagnostics.length === 0, diagnostics };
}
