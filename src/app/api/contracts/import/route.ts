import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { readOperationalConfig, writeOperationalConfig } from '@/lib/operational-config-store';

interface CustomContract {
  name: string;
  contractName: string;
  address: string;
  abi: unknown[];
  networks: number[];
  description?: string;
}

export async function POST(request: Request) {
  const guard = await requireAuth('config:write');
  if (guard) return guard;

  try {
    const body = (await request.json()) as CustomContract;

    if (!body.contractName || !body.abi || !Array.isArray(body.abi)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid contract: contractName and abi (array) required' },
        { status: 400 }
      );
    }

    if (body.abi.length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'ABI cannot be empty' },
        { status: 400 }
      );
    }

    const config = await readOperationalConfig();
    if (!config.customContracts) {
      config.customContracts = [];
    }

    const existing = config.customContracts.findIndex(
      (c: any) => c.contractName === body.contractName
    );

    if (existing >= 0) {
      config.customContracts[existing] = body;
    } else {
      config.customContracts.push(body);
    }

    await writeOperationalConfig(config);

    return NextResponse.json({
      status: 'ok',
      message: `Contract "${body.contractName}" saved`,
      contract: body,
      total: config.customContracts.length,
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: `Import failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 400 }
    );
  }
}

export async function GET() {
  const guard = await requireAuth('config:read');
  if (guard) return guard;

  try {
    const config = await readOperationalConfig();
    const contracts = config.customContracts || [];

    return NextResponse.json({
      status: 'ok',
      total: contracts.length,
      contracts,
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to load custom contracts' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const guard = await requireAuth('config:write');
  if (guard) return guard;

  try {
    const { contractName } = await request.json();

    if (!contractName) {
      return NextResponse.json(
        { status: 'error', message: 'contractName required' },
        { status: 400 }
      );
    }

    const config = await readOperationalConfig();
    if (!config.customContracts) {
      return NextResponse.json(
        { status: 'error', message: 'Contract not found' },
        { status: 404 }
      );
    }

    config.customContracts = config.customContracts.filter((c: any) => c.contractName !== contractName);
    await writeOperationalConfig(config);

    return NextResponse.json({
      status: 'ok',
      message: `Deleted "${contractName}"`,
      total: config.customContracts.length,
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: 'Delete failed' },
      { status: 400 }
    );
  }
}
