import { describe, expect, it } from "vitest";

import type { FrontpageConfig } from "@/lib/frontpage-config";
import {
  migrateFrontpageConfigToControlPlane,
  type ControlPlaneProjectV2,
  validateControlPlaneProject,
} from "@/lib/control-plane/project-manifest";

function validProject(): ControlPlaneProjectV2 {
  return {
    schemaVersion: 2,
    id: "project-1",
    name: "ST3 project",
    ecosystem: "evm",
    presentation: { badge: "ST3", title: "Action panel", copy: "Choose an action." },
    chain: { id: 1 },
    contract: {
      address: "0x1111111111111111111111111111111111111111",
      abi: [{ type: "function", name: "setValue", stateMutability: "nonpayable", inputs: [{ name: "value", type: "uint256" }], outputs: [] }],
    },
    functions: [{
      id: "set-value",
      kind: "contractWrite",
      enabled: true,
      title: "Set value",
      description: "Sets the contract value.",
      ctaLabel: "Set",
      chainId: 1,
      contractAddress: "0x1111111111111111111111111111111111111111",
      methodAbi: { type: "function", name: "setValue", stateMutability: "nonpayable", inputs: [{ name: "value", type: "uint256" }], outputs: [] },
      functionName: "setValue",
      functionSignature: "setValue(uint256)",
      defaultArgs: [1],
    }],
    strategies: [{ id: "standard", kind: "strategy", enabled: true, mode: "direct", functionId: "set-value" }],
    payloads: [{ id: "set-value-payload", kind: "transaction", functionId: "set-value", strategyId: "standard", args: [1] }],
    workflows: [{
      id: "set-value-workflow",
      title: "Set value",
      enabled: true,
      steps: [{ id: "submit", kind: "transaction", payloadId: "set-value-payload" }],
    }],
    automation: { enabled: false },
    interface: { mountSelector: "#st3-app", themeMode: "dark", accentColor: "#7c3aed" },
    build: {},
  };
}

describe("control-plane project manifest", () => {
  it("accepts a complete V2 project", () => {
    const project = validProject();
    expect(validateControlPlaneProject(project)).toEqual({ valid: true, diagnostics: [], project });
  });

  it("reports a missing contract address at the exact field path", () => {
    const project = validProject() as unknown as { contract: { address?: string } };
    delete project.contract.address;
    const result = validateControlPlaneProject(project);
    expect(result.valid).toBe(false);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ path: "contract.address" }));
  });

  it("rejects duplicate function IDs", () => {
    const project = validProject();
    project.functions.push({ ...project.functions[0] });
    const result = validateControlPlaneProject(project);
    expect(result.valid).toBe(false);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ path: "functions[1].id", code: "duplicate_id" }));
  });

  it("reports an invalid workflow payload reference at the exact step path", () => {
    const project = validProject();
    project.workflows[0].steps.push({ id: "second", kind: "transaction", payloadId: "missing-payload" });
    const result = validateControlPlaneProject(project);
    expect(result.valid).toBe(false);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ path: "workflows[0].steps[1].payloadId", code: "unknown_reference" }));
  });

  it("migrates a V1 frontpage contract action without losing its visible behavior", () => {
    const v1: FrontpageConfig = {
      version: 1,
      ecosystem: "evm",
      hero: { badge: "Legacy", title: "Legacy panel", copy: "Legacy copy" },
      chainId: 137,
      contractAddress: "0x2222222222222222222222222222222222222222",
      actions: [{
        kind: "contractWrite",
        id: "mint",
        title: "Mint",
        description: "Mint one item.",
        ctaLabel: "Mint now",
        chainId: 137,
        contractAddress: "0x2222222222222222222222222222222222222222",
        methodAbi: { type: "function", name: "mint", stateMutability: "payable", inputs: [{ name: "quantity", type: "uint256" }], outputs: [] },
        paramsJson: "[1]",
        valueWei: "1000000000000000",
      }],
    };

    const migrated = migrateFrontpageConfigToControlPlane(v1);
    expect(migrated.presentation).toEqual(v1.hero);
    expect(migrated.chain.id).toBe(137);
    expect(migrated.contract.address).toBe(v1.contractAddress);
    expect(migrated.functions[0]).toMatchObject({
      id: "mint",
      functionName: "mint",
      functionSignature: "mint(uint256)",
      defaultArgs: [1],
      ctaLabel: "Mint now",
      valueWei: "1000000000000000",
    });
    expect(migrated.payloads[0]).toMatchObject({ functionId: "mint", args: [1], valueWei: "1000000000000000" });
    expect(validateControlPlaneProject(migrated).valid).toBe(true);
  });
});
