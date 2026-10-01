import { describe, expect, it } from "vitest";
import { compileFrontpagePayload } from "@/lib/frontpage-compile-service";
import type { FrontpageConfig } from "@/lib/frontpage-config";

describe("frontpage standalone compile route", () => {
  it("returns script.js from the standalone frontend compiler", async () => {
    const frontpage: FrontpageConfig = {
      version: 1,
      ecosystem: "evm",
      hero: { badge: "APP", title: "Inline contract UI", copy: "No SDK output." },
      chainId: 1,
      contractAddress: "0x1111111111111111111111111111111111111111",
      actions: [{
        kind: "contractWrite",
        id: "set-value",
        title: "Set value",
        description: "Set one value.",
        ctaLabel: "Submit",
        chainId: 1,
        contractAddress: "0x1111111111111111111111111111111111111111",
        methodAbi: { type: "function", name: "setValue", stateMutability: "nonpayable", inputs: [{ name: "value", type: "uint256" }], outputs: [] },
        paramsJson: '["1"]',
      }],
    };

    const result = await compileFrontpagePayload({ frontpage });

    expect(result.generator).toBe("standalone-frontpage");
    expect(result.filename).toBe("script.js");
    expect(result.scriptTag).toBe('<script src="./script.js" defer></script>');
    expect(result.script).toContain("Inline contract UI");
    expect(result.script).toContain("attachShadow");
  });

  it("rejects an invalid frontpage payload", async () => {
    await expect(compileFrontpagePayload({ frontpage: { version: 1 } })).rejects.toThrow("Invalid frontpage config payload");
  });
});
