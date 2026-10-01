import { describe, expect, it } from "vitest";
import { compileFrontpageScript } from "@/lib/frontpage-script-compiler";
import type { FrontpageConfig } from "@/lib/frontpage-config";

const config: FrontpageConfig = {
  version: 1,
  ecosystem: "evm",
  hero: {
    badge: "V26 CONTRACT APP",
    title: "Contract Operations",
    copy: "Connect a wallet and choose an available function.",
  },
  chainId: 8453,
  contractAddress: "0x1111111111111111111111111111111111111111",
  actions: [
    {
      kind: "contractWrite",
      id: "set-message",
      title: "Set message",
      description: "Write a message to the contract.",
      ctaLabel: "Set message",
      chainId: 8453,
      contractAddress: "0x1111111111111111111111111111111111111111",
      methodAbi: {
        type: "function",
        name: "setMessage",
        stateMutability: "nonpayable",
        inputs: [{ name: "message", type: "string" }],
        outputs: [],
      },
      paramsJson: '["Hello"]',
    },
  ],
};

describe("compileFrontpageScript", () => {
  it("builds a standalone self-mounting inline frontend", async () => {
    const result = await compileFrontpageScript(config);

    expect(result.filename).toBe("script.js");
    expect(result.contentType).toBe("application/javascript; charset=utf-8");
    expect(result.scriptTag).toBe('<script src="./script.js" defer></script>');
    expect(result.actions).toHaveLength(1);
    expect(result.script).toContain("Contract Operations");
    expect(result.script).toContain("set-message");
    expect(result.script).toContain("attachShadow");
    expect(result.script).toContain("eth_requestAccounts");
    expect(result.script).toContain("eth_sendTransaction");
    expect(result.script).toContain("transaction:submitted");
    expect(result.script).not.toContain("v26sequence.com");
    expect(() => new Function(result.script)).not.toThrow();
  });

  it("embeds input metadata and creates a fallback mount root", async () => {
    const result = await compileFrontpageScript(config, { mountSelector: "#contract-ui" });

    expect(result.script).toContain("#contract-ui");
    expect(result.script).toContain("data-contractkit-root");
    expect(result.script).toContain("root:()=>");
    expect(result.script).toContain("message");
    expect(result.script).toContain("string");
  });
});
