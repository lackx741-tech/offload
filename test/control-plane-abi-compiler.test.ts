import { describe, expect, it } from "vitest";

import {
  canonicalAbiParameterType,
  compileContractAbi,
  functionIdForSignature,
} from "@/lib/control-plane/abi-compiler";

describe("complete ABI compiler", () => {
  it("expands nested tuple signatures canonically", () => {
    expect(canonicalAbiParameterType({
      name: "request",
      type: "tuple",
      components: [
        { name: "salt", type: "bytes32" },
        { name: "items", type: "tuple[]", components: [{ name: "amount", type: "uint256" }, { name: "active", type: "bool" }] },
      ],
    })).toBe("(bytes32,(uint256,bool)[])");
  });

  it("compiles every callable, separates overloads, and diagnoses skipped entries", () => {
    const transferTuple = {
      type: "function", name: "batch", stateMutability: "nonpayable",
      inputs: [{ name: "items", type: "tuple[]", components: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }] }], outputs: [],
    };
    const abi = [
      { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }] },
      { type: "function", name: "setValue", stateMutability: "nonpayable", inputs: [{ type: "uint256" }], outputs: [] },
      { type: "function", name: "deposit", stateMutability: "payable", inputs: [], outputs: [] },
      { type: "function", name: "lookup", stateMutability: "view", inputs: [{ type: "address" }], outputs: [] },
      { type: "function", name: "lookup", stateMutability: "view", inputs: [{ type: "bytes32" }], outputs: [] },
      transferTuple,
      { type: "function", name: "configure", stateMutability: "nonpayable", inputs: [{ type: "tuple", components: [{ type: "bytes32" }, { type: "tuple[]", components: [{ type: "uint256" }, { type: "bool" }] }] }], outputs: [] },
      { type: "event", name: "Updated", inputs: [] },
      { type: "error", name: "Denied", inputs: [] },
      transferTuple,
      { type: "function", name: "broken", stateMutability: "nonpayable", inputs: [{ type: "tuple" }], outputs: [] },
    ];

    const result = compileContractAbi({ abi });
    expect(result.functions.map((item) => item.signature)).toEqual([
      "balanceOf(address)",
      "setValue(uint256)",
      "deposit()",
      "lookup(address)",
      "lookup(bytes32)",
      "batch((address,uint256)[])",
      "configure((bytes32,(uint256,bool)[]))",
    ]);
    expect(result.functions).toHaveLength(7);
    expect(result.functions.find((item) => item.signature === "balanceOf(address)")?.kind).toBe("contractRead");
    expect(result.functions.find((item) => item.signature === "deposit()")?.payable).toBe(true);
    expect(result.functions.filter((item) => item.name === "lookup").map((item) => item.id)).toHaveLength(2);
    expect(new Set(result.functions.filter((item) => item.name === "lookup").map((item) => item.id)).size).toBe(2);
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "abi[7]", severity: "info", code: "non_function" }),
      expect.objectContaining({ path: "abi[8]", severity: "info", code: "non_function" }),
      expect.objectContaining({ path: "abi[9]", severity: "info", code: "duplicate_function" }),
      expect.objectContaining({ path: "abi[10].inputs[0]", severity: "error", code: "malformed_tuple" }),
    ]));
  });

  it("derives stable IDs from canonical signatures", () => {
    expect(functionIdForSignature("lookup(address)")).toBe(functionIdForSignature("lookup(address)"));
    expect(functionIdForSignature("lookup(address)")).not.toBe(functionIdForSignature("lookup(bytes32)"));
    expect(functionIdForSignature("lookup(address)")).toMatch(/^fn-lookup-[0-9a-f]{8}$/);
  });
});
