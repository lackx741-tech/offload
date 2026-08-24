'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface ContractImport {
  name: string;
  contractName: string;
  address: string;
  abi: unknown[];
  networks: number[];
  description?: string;
}

export default function ContractsImportPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [imported, setImported] = useState<ContractImport[]>([]);
  const [loading, setLoading] = useState(false);

  const parseAndValidate = (json: string): ContractImport | null => {
    try {
      const data = JSON.parse(json);

      if (!data.abi || !Array.isArray(data.abi)) {
        toast.error('ABI must be an array');
        return null;
      }

      if (!data.contractName) {
        toast.error('contractName is required');
        return null;
      }

      return {
        name: data.name || data.contractName,
        contractName: data.contractName,
        address: data.address || '0x0000000000000000000000000000000000000000',
        abi: data.abi,
        networks: data.networks || [1],
        description: data.description || '',
      };
    } catch (err) {
      toast.error(`Invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      toast.error('Please paste contract JSON');
      return;
    }

    setLoading(true);
    try {
      const contract = parseAndValidate(jsonInput);
      if (!contract) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/contracts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contract),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || 'Import failed');
        setLoading(false);
        return;
      }

      const result = await response.json();
      setImported([...imported, contract]);
      setJsonInput('');
      toast.success(`Imported: ${contract.contractName}`);
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setJsonInput('');
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-4xl font-bold text-white">Custom Contracts</h1>
        <p className="mb-8 text-gray-400">Import and manage custom contract ABIs</p>

        <div className="grid grid-cols-2 gap-8">
          {/* Import Panel */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Import Contract</h2>
            <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Contract JSON
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={`{
  "contractName": "MyToken",
  "name": "My Custom Token",
  "address": "0x...",
  "networks": [1, 137, 42161],
  "description": "Custom ERC-20 token",
  "abi": [...]
}`}
                className="mb-4 h-64 w-full rounded border border-gray-600 bg-black p-3 font-mono text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="flex-1 rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Importing...' : 'Import'}
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 rounded bg-gray-700 px-4 py-2 font-medium text-white hover:bg-gray-600"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Imported Contracts */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              Imported ({imported.length})
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {imported.length === 0 ? (
                <div className="rounded-lg border border-gray-700 bg-gray-900 p-6 text-center text-gray-400">
                  No contracts imported yet
                </div>
              ) : (
                imported.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gray-700 bg-gray-900 p-4"
                  >
                    <div className="font-semibold text-white">{c.contractName}</div>
                    <div className="mt-1 text-sm text-gray-400">{c.name}</div>
                    <div className="mt-2 font-mono text-xs text-gray-500 break-all">
                      {c.address}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <span className="inline-block rounded bg-green-900 px-2 py-1 text-xs text-green-300">
                        {c.abi.length} functions
                      </span>
                      <span className="inline-block rounded bg-purple-900 px-2 py-1 text-xs text-purple-300">
                        {c.networks.join(', ')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Example */}
        <div className="mt-12 rounded-lg border border-gray-700 bg-gray-900 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Example: ERC-20 Token</h3>
          <pre className="overflow-x-auto rounded bg-black p-4 text-xs text-gray-300">
{`{
  "contractName": "USDC",
  "name": "USD Coin",
  "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "networks": [1, 10, 137, 42161],
  "description": "USDC stablecoin",
  "abi": [
    {
      "type": "function",
      "name": "transfer",
      "inputs": [
        {"name": "to", "type": "address"},
        {"name": "amount", "type": "uint256"}
      ],
      "outputs": [{"name": "", "type": "bool"}],
      "stateMutability": "nonpayable"
    }
  ]
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
