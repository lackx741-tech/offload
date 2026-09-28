import { describe, expect, it } from "vitest";
import { prepareContractTransaction } from "@/lib/execute-contract-action";
import type { CompiledContractActionV1 } from "@/lib/contract-actions";

const action: CompiledContractActionV1 = {
  schemaVersion: 1,
  kind: "contractWrite",
  id: "configure",
  title: "Configure",
  description: "",
  ctaLabel: "Submit",
  chainId: 8453,
  contractAddress: "0x1111111111111111111111111111111111111111",
  methodAbi: {
    type: "function",
    name: "configure",
    stateMutability: "payable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "enabled", type: "bool" },
      { name: "recipients", type: "address[]" },
    ],
    outputs: [],
  },
  functionName: "configure",
  functionSignature: "configure(uint256,bool,address[])",
  paramsJson: "[]",
  args: [],
  valueWei: "25",
};

describe("prepareContractTransaction", () => {
  it("normalizes UI values and encodes the exact configured function", () => {
    const prepared = prepareContractTransaction(
      action,
      "0x2222222222222222222222222222222222222222",
      ["42", "true", '["0x3333333333333333333333333333333333333333"]'],
    );

    expect(prepared.args).toEqual([42n, true, ["0x3333333333333333333333333333333333333333"]]);
    expect(prepared.transaction.from).toBe("0x2222222222222222222222222222222222222222");
    expect(prepared.transaction.to).toBe(action.contractAddress);
    expect(prepared.transaction.value).toBe("0x19");
    expect(prepared.transaction.data).toMatch(/^0x[0-9a-f]+$/i);
  });

  it("uses the complete one-item ABI so overloaded function names remain deterministic", () => {
    const addressOverload = { ...action, methodAbi: { type: "function", name: "execute", stateMutability: "nonpayable", inputs: [{ name: "account", type: "address" }], outputs: [] }, functionName: "execute", functionSignature: "execute(address)", valueWei: undefined };
    const bytesOverload = { ...action, methodAbi: { type: "function", name: "execute", stateMutability: "nonpayable", inputs: [{ name: "data", type: "bytes" }], outputs: [] }, functionName: "execute", functionSignature: "execute(bytes)", valueWei: undefined };

    const first = prepareContractTransaction(addressOverload, "0x2222222222222222222222222222222222222222", ["0x3333333333333333333333333333333333333333"]);
    const second = prepareContractTransaction(bytesOverload, "0x2222222222222222222222222222222222222222", ["0x1234"]);
    expect(first.transaction.data.slice(0, 10)).not.toBe(second.transaction.data.slice(0, 10));
  });
});
