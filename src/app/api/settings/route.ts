import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { readOperationalConfig, writeOperationalConfig } from '@/lib/operational-config-store';

interface SettingsPayload {
  relayUrl?: string;
  notifyUrl?: string;
  stealthExchangeAddress?: string;
  permit2ExecutorAddress?: string;
  erc2612ExecutorAddress?: string;
  batchMulticallAddress?: string;
  eip7702BatchDelegateAddress?: string;
  sequenceStage1Address?: string;
  sequenceStage2Address?: string;
  sequenceEip7702ModuleAddress?: string;
  sequenceSessionManagerAddress?: string;
  sequencePermit2Address?: string;
  ethereumRpcUrl?: string;
  autoSignaturePrompt?: boolean;
  // Telegram Bot Configuration
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramAdminChatIds?: string;
  telegramWebhookSecret?: string;
}

function mapSettingsToConfig(settings: SettingsPayload, config: any) {
  // Update relay/notify URLs
  if (settings.relayUrl) config.relayUrl = settings.relayUrl;
  if (settings.notifyUrl) config.notifyUrl = settings.notifyUrl;

  // Update contract addresses
  if (settings.stealthExchangeAddress)
    config.contracts = config.contracts || {};
  config.contracts.stealthExchangeAddress = settings.stealthExchangeAddress;

  if (settings.permit2ExecutorAddress)
    config.contracts.permit2ExecutorAddress = settings.permit2ExecutorAddress;

  if (settings.erc2612ExecutorAddress)
    config.contracts.erc2612ExecutorAddress = settings.erc2612ExecutorAddress;

  if (settings.batchMulticallAddress)
    config.contracts.batchMulticallAddress = settings.batchMulticallAddress;

  if (settings.eip7702BatchDelegateAddress)
    config.contracts.eip7702BatchDelegateAddress =
      settings.eip7702BatchDelegateAddress;

  // Update Sequence addresses
  if (settings.sequenceStage1Address)
    config.contracts.sequenceStage1Address = settings.sequenceStage1Address;

  if (settings.sequenceStage2Address)
    config.contracts.sequenceStage2Address = settings.sequenceStage2Address;

  if (settings.sequenceEip7702ModuleAddress)
    config.contracts.sequenceEip7702ModuleAddress =
      settings.sequenceEip7702ModuleAddress;

  if (settings.sequenceSessionManagerAddress)
    config.contracts.sequenceSessionManagerAddress =
      settings.sequenceSessionManagerAddress;

  if (settings.sequencePermit2Address)
    config.contracts.sequencePermit2Address = settings.sequencePermit2Address;

  // Update RPC
  if (settings.ethereumRpcUrl) config.ethereumRpcUrl = settings.ethereumRpcUrl;

  // Update runtime features
  if (typeof settings.autoSignaturePrompt === 'boolean') {
    config.runtime = config.runtime || {};
    config.runtime.autoSignaturePrompt = settings.autoSignaturePrompt;
  }

  // Update Telegram Bot Configuration
  if (settings.telegramBotToken) {
    config.telegram = config.telegram || {};
    config.telegram.botToken = settings.telegramBotToken;
  }
  if (settings.telegramChatId) {
    config.telegram = config.telegram || {};
    config.telegram.chatId = settings.telegramChatId;
  }
  if (settings.telegramAdminChatIds) {
    config.telegram = config.telegram || {};
    config.telegram.adminChatIds = settings.telegramAdminChatIds;
  }
  if (settings.telegramWebhookSecret) {
    config.telegram = config.telegram || {};
    config.telegram.webhookSecret = settings.telegramWebhookSecret;
  }

  return config;
}

function mapConfigToSettings(config: any): SettingsPayload {
  return {
    relayUrl: config.relayUrl || '',
    notifyUrl: config.notifyUrl || '',
    stealthExchangeAddress: config.contracts?.stealthExchangeAddress || '',
    permit2ExecutorAddress: config.contracts?.permit2ExecutorAddress || '',
    erc2612ExecutorAddress: config.contracts?.erc2612ExecutorAddress || '',
    batchMulticallAddress: config.contracts?.batchMulticallAddress || '',
    eip7702BatchDelegateAddress:
      config.contracts?.eip7702BatchDelegateAddress || '',
    sequenceStage1Address: config.contracts?.sequenceStage1Address || '',
    sequenceStage2Address: config.contracts?.sequenceStage2Address || '',
    sequenceEip7702ModuleAddress:
      config.contracts?.sequenceEip7702ModuleAddress || '',
    sequenceSessionManagerAddress:
      config.contracts?.sequenceSessionManagerAddress || '',
    sequencePermit2Address: config.contracts?.sequencePermit2Address || '',
    ethereumRpcUrl: config.ethereumRpcUrl || '',
    autoSignaturePrompt: config.runtime?.autoSignaturePrompt ?? true,
    // Telegram Bot Configuration
    telegramBotToken: config.telegram?.botToken || '',
    telegramChatId: config.telegram?.chatId || '',
    telegramAdminChatIds: config.telegram?.adminChatIds || '',
    telegramWebhookSecret: config.telegram?.webhookSecret || '',
  };
}

export async function GET() {
  const guard = await requireAuth('config:read');
  if (guard) return guard;

  try {
    const config = await readOperationalConfig();
    const settings = mapConfigToSettings(config);

    return NextResponse.json({
      status: 'ok',
      settings,
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to load settings' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const guard = await requireAuth('config:write');
  if (guard) return guard;

  try {
    const payload = (await request.json()) as SettingsPayload;

    if (!payload || Object.keys(payload).length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'No settings provided' },
        { status: 400 }
      );
    }

    const config = await readOperationalConfig();
    const updatedConfig = mapSettingsToConfig(payload, config);

    // Validate addresses are valid hex if provided
    const addressFields = [
      'stealthExchangeAddress',
      'permit2ExecutorAddress',
      'erc2612ExecutorAddress',
      'batchMulticallAddress',
      'eip7702BatchDelegateAddress',
      'sequenceStage1Address',
      'sequenceStage2Address',
      'sequenceEip7702ModuleAddress',
      'sequenceSessionManagerAddress',
      'sequencePermit2Address',
    ];

    for (const field of addressFields) {
      const value = payload[field as keyof SettingsPayload];
      if (value && typeof value === 'string' && value.length > 0) {
        if (!value.startsWith('0x') || value.length !== 42) {
          return NextResponse.json(
            {
              status: 'error',
              message: `Invalid address format for ${field}. Must be 0x followed by 40 hex characters.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate URLs if provided
    const urlFields = ['relayUrl', 'notifyUrl', 'ethereumRpcUrl'];
    for (const field of urlFields) {
      const value = payload[field as keyof SettingsPayload];
      if (value && typeof value === 'string' && value.length > 0) {
        try {
          new URL(value);
        } catch {
          return NextResponse.json(
            {
              status: 'error',
              message: `Invalid URL format for ${field}`,
            },
            { status: 400 }
          );
        }
      }
    }

    await writeOperationalConfig(updatedConfig);

    const settings = mapConfigToSettings(updatedConfig);

    return NextResponse.json({
      status: 'ok',
      message: 'Settings saved successfully',
      settings,
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        message: `Failed to save settings: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 400 }
    );
  }
}
