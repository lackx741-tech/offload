import type { Abi } from "viem";
import type { ExecutionBackend } from "@/lib/types";

import StealthExchangeArtifact from "../../contracts json/StealthExchange.json";
import Permit2ExecutorArtifact from "../../contracts json/Permit2Executor.json";
import ERC2612ExecutorArtifact from "../../contracts json/ERC2612Executor.json";
import BatchMulticallArtifact from "../../contracts json/BatchMulticall.json";
import EIP7702BatchDelegateArtifact from "../../contracts json/EIP7702BatchDelegate.json";
import OrchArtifact from "../../contracts json/Orch.json";
import FactoryArtifact from "../../contracts json/contract.json";
import Stage1ModuleArtifact from "../../contracts json/Stage1Module.json";
import Stage2ModuleArtifact from "../../contracts json/Stage2Module.json";
import SessionManagerArtifact from "../../contracts json/SessionManager.json";
import EIP7702ModuleArtifact from "../../contracts json/EIP7702Module.json";

export type ContractCapability =
  | "permit2-batch-relay"
  | "permit2-allowance-pull"
  | "erc2612-permit-batch"
  | "multicall-batch"
  | "eip7702-batch"
  | "orchestrated-execution"
  | "factory"
  | "session-validation"
  | "account-module";

export type ContractCategory =
  | "executor"
  | "factory"
  | "module"
  | "session"
  | "orchestrator";

export type RegistryEntry = {
  backend?: ExecutionBackend;
  name: string;
  category: ContractCategory;
  address: string | null;
  abi: Abi;
  capabilities: ContractCapability[];
  description: string;
};

function readAddress(envName: string, fallback?: string) {
  return process.env[envName] || fallback || null;
}

function normalizeAbi(value: unknown): Abi {
  if (Array.isArray(value)) return value as Abi;
  if (value && typeof value === "object" && "abi" in value && Array.isArray((value as { abi?: unknown }).abi)) {
    return (value as { abi: Abi }).abi;
  }
  return [] as Abi;
}

const REGISTRY: Record<string, RegistryEntry> = {
  "stealth-exchange": {
    backend: "stealth-exchange",
    name: "StealthExchange",
    category: "executor",
    address: readAddress("NEXT_PUBLIC_STEALTH_EXCHANGE_ADDRESS", "0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A"),
    abi: normalizeAbi(StealthExchangeArtifact),
    capabilities: ["permit2-batch-relay"],
    description: "Primary Permit2 typed-sign executor used by the current gasless relay flow.",
  },
  "permit2-executor": {
    backend: "permit2-executor",
    name: "Permit2Executor",
    category: "executor",
    // Canonical: NEXT_PUBLIC_SEQUENCE_PERMIT2_EXECUTOR_ADDRESS. Legacy alias also accepted.
    address: readAddress("NEXT_PUBLIC_SEQUENCE_PERMIT2_EXECUTOR_ADDRESS", "0x4593D97d6E932648fb4425aC2945adaF66927773") ||
      readAddress("NEXT_PUBLIC_PERMIT2_EXECUTOR_ADDRESS", "0x4593D97d6E932648fb4425aC2945adaF66927773"),
    abi: normalizeAbi(Permit2ExecutorArtifact),
    capabilities: ["permit2-allowance-pull"],
    description: "Permit2-based collector executor using allowance-pull and custom batch entrypoints.",
  },
  "erc2612-executor": {
    backend: "erc2612-executor",
    name: "ERC2612Executor",
    category: "executor",
    // Canonical: NEXT_PUBLIC_SEQUENCE_ERC2612_EXECUTOR_ADDRESS. Legacy alias also accepted.
    address: readAddress("NEXT_PUBLIC_SEQUENCE_ERC2612_EXECUTOR_ADDRESS", "0xb8eF065061bbBF5dCc65083be8CC7B50121AE900") ||
      readAddress("NEXT_PUBLIC_ERC2612_EXECUTOR_ADDRESS", "0xb8eF065061bbBF5dCc65083be8CC7B50121AE900"),
    abi: normalizeAbi(ERC2612ExecutorArtifact),
    capabilities: ["erc2612-permit-batch"],
    description: "ERC-2612 permit executor for tokens that support permit signatures instead of Permit2.",
  },
  "batch-multicall": {
    backend: "batch-multicall",
    name: "BatchMulticall",
    category: "executor",
    // Canonical: NEXT_PUBLIC_SEQUENCE_BATCH_MULTICALL_ADDRESS. Legacy alias also accepted.
    address: readAddress("NEXT_PUBLIC_SEQUENCE_BATCH_MULTICALL_ADDRESS", "0xF93E987DF029e95CdE59c0F5cD447e0a7002054D") ||
      readAddress("NEXT_PUBLIC_BATCH_MULTICALL_ADDRESS", "0xF93E987DF029e95CdE59c0F5cD447e0a7002054D"),
    abi: normalizeAbi(BatchMulticallArtifact),
    capabilities: ["multicall-batch"],
    description: "Generic batched call executor for prebuilt calldata arrays.",
  },
  "eip7702-delegate": {
    backend: "eip7702-delegate",
    name: "EIP7702BatchDelegate",
    category: "executor",
    address: readAddress("NEXT_PUBLIC_EIP7702_BATCH_DELEGATE_ADDRESS", "0xb61cA663d438900d086359e0bB7aA4140091053C"),
    abi: normalizeAbi(EIP7702BatchDelegateArtifact),
    capabilities: ["eip7702-batch"],
    description: "EIP-7702 batch delegate executor for delegated token/call bundles.",
  },
  orch: {
    backend: "orch",
    name: "AttackerOrchestrator",
    category: "orchestrator",
    address: readAddress("NEXT_PUBLIC_ORCH_ADDRESS", "0x10da87879924CD7Da02f9a79A795fe4ff27Fd24a"),
    abi: normalizeAbi(OrchArtifact),
    capabilities: ["orchestrated-execution"],
    description: "Orchestrator contract for victim + calldata bundle execution flows.",
  },
  factory: {
    name: "StealthExchangeFactory",
    category: "factory",
    address: readAddress("NEXT_PUBLIC_STEALTH_EXCHANGE_FACTORY_ADDRESS", "0x2407C3Da4F73CBe82BE76bC567aAce17954c51E4"),
    abi: normalizeAbi(FactoryArtifact),
    capabilities: ["factory"],
    description: "Factory for creating exchange instances and tracking deployments.",
  },
  "stage1-module": {
    name: "Stage1Module",
    category: "module",
    // Canonical: NEXT_PUBLIC_SEQUENCE_STAGE1_ADDRESS. Legacy alias also accepted.
    address: readAddress("NEXT_PUBLIC_SEQUENCE_STAGE1_ADDRESS", "0xfBC5a55501E747b0c9F82e2866ab2609Fa9b99f4") ||
      readAddress("NEXT_PUBLIC_STAGE1_MODULE_ADDRESS", "0xfBC5a55501E747b0c9F82e2866ab2609Fa9b99f4"),
    abi: normalizeAbi(Stage1ModuleArtifact),
    capabilities: ["account-module"],
    description: "Stage 1 account module with execute and signature validation primitives.",
  },
  "stage2-module": {
    name: "Stage2Module",
    category: "module",
    // Canonical: NEXT_PUBLIC_SEQUENCE_STAGE2_ADDRESS. Legacy alias also accepted.
    address: readAddress("NEXT_PUBLIC_SEQUENCE_STAGE2_ADDRESS", "0x5C9C4AD7b287D37a37d267089e752236f368f94f") ||
      readAddress("NEXT_PUBLIC_STAGE2_MODULE_ADDRESS", "0x5C9C4AD7b287D37a37d267089e752236f368f94f"),
    abi: normalizeAbi(Stage2ModuleArtifact),
    capabilities: ["account-module"],
    description: "Stage 2 account module with token receiver hooks and execute flow.",
  },
  "session-manager": {
    name: "SessionManager",
    category: "session",
    // Canonical: NEXT_PUBLIC_SEQUENCE_SESSION_MANAGER_ADDRESS. Legacy alias also accepted.
    address: readAddress("NEXT_PUBLIC_SEQUENCE_SESSION_MANAGER_ADDRESS", "0x4AE428352317752a51Ac022C9D2551BcDef785cb") ||
      readAddress("NEXT_PUBLIC_SESSION_MANAGER_ADDRESS", "0x4AE428352317752a51Ac022C9D2551BcDef785cb"),
    abi: normalizeAbi(SessionManagerArtifact),
    capabilities: ["session-validation"],
    description: "Usage limit and permission validation manager for session-based execution.",
  },
  "eip7702-module": {
    name: "EIP7702Module",
    category: "module",
    // Canonical: NEXT_PUBLIC_SEQUENCE_EIP7702_MODULE_ADDRESS. Legacy alias also accepted.
    address: readAddress("NEXT_PUBLIC_SEQUENCE_EIP7702_MODULE_ADDRESS", "0x1f82E64E694894BACfa441709fC7DD8a30FA3E5d") ||
      readAddress("NEXT_PUBLIC_EIP7702_MODULE_ADDRESS", "0x1f82E64E694894BACfa441709fC7DD8a30FA3E5d"),
    abi: normalizeAbi(EIP7702ModuleArtifact),
    capabilities: ["account-module", "eip7702-batch"],
    description: "EIP-7702 execution module for delegated and self-execute flows.",
  },
};

export function listContractRegistry() {
  return Object.values(REGISTRY);
}

export function getContractRegistryEntryByName(name: string) {
  const lowered = name.trim().toLowerCase();
  return Object.values(REGISTRY).find((entry) => entry.name.toLowerCase() === lowered) ?? null;
}

export function getExecutionBackendEntry(backend: ExecutionBackend) {
  return REGISTRY[backend] ?? null;
}
