import { deriveCompiledActionsFromFrontpage } from "@/lib/contract-actions";
import type { FrontpageConfig } from "@/lib/frontpage-config";

export type ControlPlaneFunction = {
  id: string;
  kind: "contractRead" | "contractWrite";
  enabled: boolean;
  title: string;
  description: string;
  ctaLabel: string;
  chainId: number;
  contractAddress: string;
  methodAbi: unknown;
  functionName: string;
  functionSignature: string;
  defaultArgs: unknown[];
  valueWei?: string;
};

export type ControlPlaneStrategy = {
  id: string;
  kind: "strategy";
  enabled: boolean;
  mode: "direct" | "sequential" | "fallback" | string;
  functionId: string;
  fallbackStrategyId?: string;
};

export type ControlPlanePayload =
  | {
      id: string;
      kind: "transaction";
      functionId: string;
      strategyId?: string;
      args: unknown[];
      valueWei?: string;
    }
  | {
      id: string;
      kind: "typedData";
      domain: unknown;
      types: unknown;
      primaryType: string;
      message: unknown;
    };

export type ControlPlaneWorkflowStep =
  | { id: string; kind: "read" | "transaction"; payloadId: string; nextStepId?: string; onErrorStepId?: string }
  | { id: string; kind: "typedData"; payloadId: string; nextStepId?: string; onErrorStepId?: string }
  | { id: string; kind: "condition"; expression: string; trueStepId?: string; falseStepId?: string };

export type ControlPlaneWorkflow = {
  id: string;
  title: string;
  enabled: boolean;
  steps: ControlPlaneWorkflowStep[];
};

export type ControlPlaneProjectV2 = {
  schemaVersion: 2;
  id: string;
  name: string;
  ecosystem: FrontpageConfig["ecosystem"];
  presentation: FrontpageConfig["hero"];
  chain: { id: number };
  contract: { address: string; abi: unknown[] };
  functions: ControlPlaneFunction[];
  strategies: ControlPlaneStrategy[];
  payloads: ControlPlanePayload[];
  workflows: ControlPlaneWorkflow[];
  automation: { enabled: boolean };
  interface: { mountSelector: string; themeMode: "dark" | "light"; accentColor: string };
  build: { activeVersion?: string };
};

export type ControlPlaneDiagnostic = {
  path: string;
  code: "invalid_type" | "required" | "duplicate_id" | "unknown_reference" | "unsupported_version";
  message: string;
  severity: "error" | "warning";
};

export type ControlPlaneValidationResult =
  | { valid: true; diagnostics: []; project: ControlPlaneProjectV2 }
  | { valid: false; diagnostics: ControlPlaneDiagnostic[]; project?: undefined };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function error(path: string, code: ControlPlaneDiagnostic["code"], message: string): ControlPlaneDiagnostic {
  return { path, code, message, severity: "error" };
}

function requireString(record: Record<string, unknown>, key: string, path: string, diagnostics: ControlPlaneDiagnostic[]): void {
  if (typeof record[key] !== "string" || !record[key]) diagnostics.push(error(path, "required", `${path} is required`));
}

function collectIds(items: unknown[], collectionPath: string, diagnostics: ControlPlaneDiagnostic[]): Set<string> {
  const ids = new Set<string>();
  items.forEach((item, index) => {
    const path = `${collectionPath}[${index}].id`;
    if (!isRecord(item) || typeof item.id !== "string" || !item.id) {
      diagnostics.push(error(path, "required", `${path} is required`));
    } else if (ids.has(item.id)) {
      diagnostics.push(error(path, "duplicate_id", `${item.id} is duplicated in ${collectionPath}`));
    } else {
      ids.add(item.id);
    }
  });
  return ids;
}

function requireArray(record: Record<string, unknown>, key: string, diagnostics: ControlPlaneDiagnostic[]): unknown[] {
  if (!Array.isArray(record[key])) {
    diagnostics.push(error(key, "invalid_type", `${key} must be an array`));
    return [];
  }
  return record[key];
}

export function validateControlPlaneProject(value: unknown): ControlPlaneValidationResult {
  const diagnostics: ControlPlaneDiagnostic[] = [];
  if (!isRecord(value)) return { valid: false, diagnostics: [error("$", "invalid_type", "Project must be an object")] };

  if (value.schemaVersion !== 2) diagnostics.push(error("schemaVersion", "unsupported_version", "schemaVersion must be 2"));
  requireString(value, "id", "id", diagnostics);
  requireString(value, "name", "name", diagnostics);

  if (!isRecord(value.contract)) {
    diagnostics.push(error("contract", "required", "contract is required"));
  } else {
    requireString(value.contract, "address", "contract.address", diagnostics);
    if (!Array.isArray(value.contract.abi)) diagnostics.push(error("contract.abi", "invalid_type", "contract.abi must be an array"));
  }

  const functions = requireArray(value, "functions", diagnostics);
  const strategies = requireArray(value, "strategies", diagnostics);
  const payloads = requireArray(value, "payloads", diagnostics);
  const workflows = requireArray(value, "workflows", diagnostics);
  const functionIds = collectIds(functions, "functions", diagnostics);
  const strategyIds = collectIds(strategies, "strategies", diagnostics);
  const payloadIds = collectIds(payloads, "payloads", diagnostics);
  collectIds(workflows, "workflows", diagnostics);

  strategies.forEach((strategy, index) => {
    if (!isRecord(strategy)) return;
    if (typeof strategy.functionId !== "string" || !functionIds.has(strategy.functionId)) {
      diagnostics.push(error(`strategies[${index}].functionId`, "unknown_reference", "Strategy references an unknown function"));
    }
    if (typeof strategy.fallbackStrategyId === "string" && !strategyIds.has(strategy.fallbackStrategyId)) {
      diagnostics.push(error(`strategies[${index}].fallbackStrategyId`, "unknown_reference", "Strategy references an unknown fallback strategy"));
    }
  });

  payloads.forEach((payload, index) => {
    if (!isRecord(payload)) return;
    if (payload.kind === "transaction") {
      if (typeof payload.functionId !== "string" || !functionIds.has(payload.functionId)) {
        diagnostics.push(error(`payloads[${index}].functionId`, "unknown_reference", "Payload references an unknown function"));
      }
      if (typeof payload.strategyId === "string" && !strategyIds.has(payload.strategyId)) {
        diagnostics.push(error(`payloads[${index}].strategyId`, "unknown_reference", "Payload references an unknown strategy"));
      }
      if (!Array.isArray(payload.args)) diagnostics.push(error(`payloads[${index}].args`, "invalid_type", "Transaction args must be an array"));
    }
  });

  workflows.forEach((workflow, workflowIndex) => {
    if (!isRecord(workflow) || !Array.isArray(workflow.steps)) return;
    const stepIds = collectIds(workflow.steps, `workflows[${workflowIndex}].steps`, diagnostics);
    workflow.steps.forEach((step, stepIndex) => {
      if (!isRecord(step)) return;
      if ("payloadId" in step && (typeof step.payloadId !== "string" || !payloadIds.has(step.payloadId))) {
        diagnostics.push(error(`workflows[${workflowIndex}].steps[${stepIndex}].payloadId`, "unknown_reference", "Workflow step references an unknown payload"));
      }
      for (const key of ["nextStepId", "onErrorStepId", "trueStepId", "falseStepId"] as const) {
        if (typeof step[key] === "string" && !stepIds.has(step[key] as string)) {
          diagnostics.push(error(`workflows[${workflowIndex}].steps[${stepIndex}].${key}`, "unknown_reference", "Workflow step references an unknown step"));
        }
      }
    });
  });

  if (diagnostics.length > 0) return { valid: false, diagnostics };
  return { valid: true, diagnostics: [], project: value as ControlPlaneProjectV2 };
}

export function migrateFrontpageConfigToControlPlane(config: FrontpageConfig): ControlPlaneProjectV2 {
  const compiledActions = deriveCompiledActionsFromFrontpage(config);
  const typedDataActions = config.actions.filter((action) => action.kind === "typedDataSign");
  const functions: ControlPlaneFunction[] = compiledActions.map((action) => ({
    id: action.id,
    kind: "contractWrite",
    enabled: true,
    title: action.title,
    description: action.description,
    ctaLabel: action.ctaLabel,
    chainId: action.chainId,
    contractAddress: action.contractAddress,
    methodAbi: action.methodAbi,
    functionName: action.functionName,
    functionSignature: action.functionSignature,
    defaultArgs: action.args,
    ...(action.valueWei === undefined ? {} : { valueWei: action.valueWei }),
  }));
  const payloads: ControlPlanePayload[] = [
    ...compiledActions.map((action): ControlPlanePayload => ({
      id: `${action.id}-payload`,
      kind: "transaction",
      functionId: action.id,
      args: action.args,
      ...(action.valueWei === undefined ? {} : { valueWei: action.valueWei }),
    })),
    ...typedDataActions.map((action): ControlPlanePayload => ({
      id: `${action.id}-payload`,
      kind: "typedData",
      domain: JSON.parse(action.domainJson || "{}") as unknown,
      types: JSON.parse(action.typesJson || "{}") as unknown,
      primaryType: action.primaryType,
      message: JSON.parse(action.messageJson || "{}") as unknown,
    })),
  ];
  const workflows: ControlPlaneWorkflow[] = config.actions.map((action) => ({
    id: `${action.id}-workflow`,
    title: action.title,
    enabled: true,
    steps: [{ id: "submit", kind: action.kind === "contractWrite" ? "transaction" : "typedData", payloadId: `${action.id}-payload` }],
  }));

  return {
    schemaVersion: 2,
    id: "migrated-frontpage",
    name: config.hero.title,
    ecosystem: config.ecosystem,
    presentation: { ...config.hero },
    chain: { id: config.chainId },
    contract: {
      address: config.contractAddress,
      abi: compiledActions.map((action) => action.methodAbi),
    },
    functions,
    strategies: [],
    payloads,
    workflows,
    automation: { enabled: false },
    interface: { mountSelector: "#st3-app", themeMode: "dark", accentColor: "#7c3aed" },
    build: {},
  };
}
