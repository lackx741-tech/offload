import { describe, expect, it } from "vitest";
import { deriveCompiledActionsFromFrontpage } from "@/lib/contract-actions";
import type { FrontpageConfig } from "@/lib/frontpage-config";

describe("deriveCompiledActionsFromFrontpage", () => {
  it("preserves the complete contract action and its inline UI fields", () => {
    const methodAbi = {
      type: "function",
      name: "execute",
      stateMutability: "payable",
      inputs: [
        {
          name: "request",
          type: "tuple",
          components: [
            { name: "recipient", type: "address" },
            { name: "amounts", type: "uint256[]" },
          ],
        },
        { name: "memo", type: "bytes" },
      ],
      outputs: [{ name: "success", type: "bool" }],
    };
    const config: FrontpageConfig = {
      version: 1,
      ecosystem: "evm",
      hero: { badge: "Launch", title: "Project Alpha", copy: "Run the configured action." },
      chainId: 8453,
      contractAddress: "0x1111111111111111111111111111111111111111",
      actions: [
        {
          kind: "contractWrite",
          id: "execute-primary",
          title: "Execute request",
          description: "Submit one prepared request.",
          ctaLabel: "Execute",
          chainId: 8453,
          contractAddress: "0x2222222222222222222222222222222222222222",
          methodAbi,
          paramsJson: '[["0x3333333333333333333333333333333333333333",["1","2"]],"0x1234"]',
          valueWei: "9000",
        },
      ],
    };

    expect(deriveCompiledActionsFromFrontpage(config)).toEqual([
      {
        schemaVersion: 1,
        kind: "contractWrite",
        id: "execute-primary",
        title: "Execute request",
        description: "Submit one prepared request.",
        ctaLabel: "Execute",
        chainId: 8453,
        contractAddress: "0x2222222222222222222222222222222222222222",
        methodAbi,
        functionName: "execute",
        functionSignature: "execute((address,uint256[]),bytes)",
        paramsJson: '[["0x3333333333333333333333333333333333333333",["1","2"]],"0x1234"]',
        args: [["0x3333333333333333333333333333333333333333", ["1", "2"]], "0x1234"],
        valueWei: "9000",
      },
    ]);
  });

  it("keeps overloaded functions distinct by canonical signature", () => {
    const base = {
      version: 1 as const,
      ecosystem: "evm" as const,
      hero: { badge: "", title: "", copy: "" },
      chainId: 1,
      contractAddress: "0x1111111111111111111111111111111111111111",
      actions: [
        {
          kind: "contractWrite" as const,
          id: "execute-address",
          title: "Execute address",
          description: "",
          ctaLabel: "Run",
          chainId: 1,
          contractAddress: "0x1111111111111111111111111111111111111111",
          methodAbi: { type: "function", name: "execute", stateMutability: "nonpayable", inputs: [{ name: "account", type: "address" }], outputs: [] },
          paramsJson: '["0x2222222222222222222222222222222222222222"]',
        },
        {
          kind: "contractWrite" as const,
          id: "execute-bytes",
          title: "Execute bytes",
          description: "",
          ctaLabel: "Run",
          chainId: 1,
          contractAddress: "0x1111111111111111111111111111111111111111",
          methodAbi: { type: "function", name: "execute", stateMutability: "nonpayable", inputs: [{ name: "data", type: "bytes" }], outputs: [] },
          paramsJson: '["0x1234"]',
        },
      ],
    } satisfies FrontpageConfig;

    expect(deriveCompiledActionsFromFrontpage(base).map((action) => action.functionSignature)).toEqual([
      "execute(address)",
      "execute(bytes)",
    ]);
  });
});
