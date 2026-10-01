import { describe, expect, it } from "vitest";
import { analyzeContractAction } from "@/lib/contract-compatibility";
import type { CompiledContractActionV1 } from "@/lib/contract-actions";

function action(patch: Partial<CompiledContractActionV1> = {}): CompiledContractActionV1 {
  return {
    schemaVersion: 1,
    kind: "contractWrite",
    id: "set-value",
    title: "Set value",
    description: "",
    ctaLabel: "Submit",
    chainId: 1,
    contractAddress: "0x1111111111111111111111111111111111111111",
    methodAbi: { type: "function", name: "setValue", stateMutability: "nonpayable", inputs: [{ name: "value", type: "uint256" }], outputs: [] },
    functionName: "setValue",
    functionSignature: "setValue(uint256)",
    paramsJson: '["1"]',
    args: ["1"],
    ...patch,
  };
}

describe("analyzeContractAction", () => {
  it("accepts an action whose configured arguments encode", () => {
    expect(analyzeContractAction(action())).toEqual({ actionId: "set-value", valid: true, diagnostics: [] });
  });

  it("reports an invalid contract address", () => {
    const result = analyzeContractAction(action({ contractAddress: "0xinvalid" }));
    expect(result.valid).toBe(false);
    expect(result.diagnostics[0]?.code).toBe("INVALID_ADDRESS");
  });

  it("reports a missing function ABI", () => {
    const result = analyzeContractAction(action({ methodAbi: { type: "event", name: "setValue", inputs: [] } }));
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((item) => item.code === "INVALID_FUNCTION_ABI")).toBe(true);
  });

  it("reports arguments that cannot be encoded", () => {
    const result = analyzeContractAction(action({ args: ["not-an-integer"], paramsJson: '["not-an-integer"]' }));
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((item) => item.code === "INVALID_ARGUMENTS")).toBe(true);
  });
});
