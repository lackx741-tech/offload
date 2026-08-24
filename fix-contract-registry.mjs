import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'src/lib/contract-registry.ts');

let content = fs.readFileSync(filePath, 'utf8');

// 1. Add types to the simple functions
content = content.replace(
  /export function getContractById\(id\)/g,
  'export function getContractById(id: string)'
);
content = content.replace(
  /export function getContractsByCategory\(category\)/g,
  'export function getContractsByCategory(category: ContractCategory)'
);
content = content.replace(
  /export function getContractRegistryEntryByName\(name\)/g,
  'export function getContractRegistryEntryByName(name: string)'
);

// 2. Safely replace the entire getExecutionBackendEntry function
const startMarker = 'export function getExecutionBackendEntry(';
const startIdx = content.indexOf(startMarker);

if (startIdx !== -1) {
  // Find the opening brace after the function header
  const braceIdx = content.indexOf('{', startIdx);
  if (braceIdx !== -1) {
    // Match the closing brace (with nesting)
    let depth = 0;
    let endIdx = braceIdx;
    for (let i = braceIdx; i < content.length; i++) {
      if (content[i] === '{') depth++;
      else if (content[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }

    // Extract current addresses from the existing map (if any) to preserve them
    const oldFunc = content.substring(startIdx, endIdx);
    const addressRegex = /("stealth-exchange"|"permit2-executor"|"erc2612-executor"|"batch-multicall")\s*:\s*\{[^}]*address\s*:\s*"([^"]+)"/g;
    const addresses = {};
    let match;
    while ((match = addressRegex.exec(oldFunc)) !== null) {
      addresses[match[1]] = match[2];
    }

    // Fallback addresses (these match your original)
    const defaultAddresses = {
      '"stealth-exchange"': '0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A',
      '"permit2-executor"': '0x4593D97d6E932648fb4425aC2945adaF66927773',
      '"erc2612-executor"': '0xb8eF0650771bBF5dCc65083be8CC7b50121AE900',
      '"batch-multicall"': '0xF93E987DF029e95CdE59c0F5cD447e0a7002054D',
    };
    const finalAddresses = { ...defaultAddresses, ...addresses };

    // Build the new function (fully typed)
    const newFunc = `export function getExecutionBackendEntry(backend: string) {\n` +
      `  const map: Record<string, { name?: string; address: string; abi: unknown[] }> = {\n` +
      `    "stealth-exchange": { name: "StealthExchange", address: "${finalAddresses['"stealth-exchange"']}", abi: StealthExchangeArtifact.abi },\n` +
      `    "permit2-executor": { name: "Permit2Executor", address: "${finalAddresses['"permit2-executor"']}", abi: Permit2ExecutorABI },\n` +
      `    "erc2612-executor": { name: "ERC2612Executor", address: "${finalAddresses['"erc2612-executor"']}", abi: ERC2612ExecutorABI },\n` +
      `    "batch-multicall":  { name: "BatchMulticall",  address: "${finalAddresses['"batch-multicall"']}", abi: BatchMulticallABI },\n` +
      `  };\n` +
      `  return map[backend] || null;\n` +
      `}`;

    // Replace the old function with the new one
    content = content.slice(0, startIdx) + newFunc + content.slice(endIdx);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ src/lib/contract-registry.ts – fixed.');
