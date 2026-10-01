import { describe, expect, it } from "vitest";
import {
  buildBindingForFunction,
  getCallableContractFunctions,
  getConfiguredContract,
} from "@/lib/dashboard-contract-selection";
import { CONTRACT_REGISTRY } from "@/lib/contract-registry";
import type { ContractMeta } from "@/lib/contract-registry";

const contract: ContractMeta = {
  id: "example",
  name: "Example Contract",
  category: "custom",
  address: "0x1111111111111111111111111111111111111111",
  description: "Example",
  networks: [1],
  functions: ["execute"],
  strategySupport: ["direct", "multicall"],
  abi: [
    { type: "function", name: "execute", stateMutability: "nonpayable", inputs: [{ name: "target", type: "address" }] },
    { type: "function", name: "execute", stateMutability: "payable", inputs: [{ name: "target", type: "address" }, { name: "value", type: "uint256" }] },
    { type: "function", name: "owner", stateMutability: "view", inputs: [] },
  ],
};

describe("dashboard contract selection", () => {
  it("keeps overloaded functions distinct and presents plain-language labels", () => {
    expect(getCallableContractFunctions(contract)).toEqual([
      expect.objectContaining({ key: "execute(address)", label: "Execute — Target" }),
      expect.objectContaining({ key: "execute(address,uint256)", label: "Execute — Target, Value" }),
      expect.objectContaining({ key: "owner()", label: "Owner" }),
    ]);
  });

  it("uses the configured contract address instead of a stale dashboard contract id", () => {
    const configured = getConfiguredContract({
      name: "StealthExchange",
      address: "0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A",
      abiName: "StealthExchange",
      abi: [],
      chainId: 1,
      selectedFunctions: [],
    }, CONTRACT_REGISTRY, "batch-multicall");

    expect(configured?.id).toBe("stealth-exchange");
  });


  it("builds the exact selected binding with editable defaults", () => {
    const binding = buildBindingForFunction(contract, "execute(address,uint256)", {
      target: "0x2222222222222222222222222222222222222222",
      value: "100",
    });

    expect(binding).toEqual(expect.objectContaining({
      preset: "example",
      functionKey: "execute(address,uint256)",
      functionName: "execute",
      stateMutability: "payable",
      args: [
        { name: "target", type: "address", value: "0x2222222222222222222222222222222222222222" },
        { name: "value", type: "uint256", value: "100" },
      ],
    }));
  });
});
