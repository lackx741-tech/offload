import { useState, useCallback } from 'react';
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { parseEther, type Hex, type Address } from 'viem';
import { Layers, Plus, Trash2, ChevronDown, CheckCircle, XCircle, Loader, Info } from 'lucide-react';
import { SEQUENCE_CONTRACTS } from '../wagmiConfig';

interface Call {
  to: string;
  value: string;
  data: string;
}

type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export default function BatchCallsPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();

  const [calls, setCalls] = useState<Call[]>([
    { to: SEQUENCE_CONTRACTS.batchMulticall, value: '0', data: '0x' },
    { to: SEQUENCE_CONTRACTS.guest, value: '0', data: '0x' },
  ]);
  const [status, setStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [capabilities, setCapabilities] = useState<Record<string, unknown> | null>(null);

  const addCall = () => setCalls(c => [...c, { to: '', value: '0', data: '0x' }]);
  const removeCall = (i: number) => setCalls(c => c.filter((_, idx) => idx !== i));
  const updateCall = (i: number, field: keyof Call, val: string) =>
    setCalls(c => c.map((call, idx) => idx === i ? { ...call, [field]: val } : call));

  const checkCapabilities = useCallback(async () => {
    if (!walletClient || !address) return;
    try {
      const caps = await walletClient.request({
        // @ts-expect-error - wallet_getCapabilities not yet in viem types
        method: 'wallet_getCapabilities',
        params: [address],
      });
      setCapabilities(caps as Record<string, unknown>);
    } catch (err) {
      console.warn('wallet_getCapabilities not supported:', err);
      setCapabilities({});
    }
  }, [walletClient, address]);

  const sendCalls = useCallback(async () => {
    if (!walletClient || !address) return;
    if (calls.some(c => !c.to)) return;

    setStatus('pending');
    setTxHash(null);
    setErrorMsg(null);

    try {
      const result = await walletClient.request({
        // @ts-expect-error - wallet_sendCalls not yet in viem types
        method: 'wallet_sendCalls',
        params: [{
          version: '2.0.0',
          chainId: `0x${chainId.toString(16)}`,
          from: address,
          calls: calls.map(c => ({
            to: c.to as Address,
            value: `0x${parseEther(c.value || '0').toString(16)}`,
            data: (c.data || '0x') as Hex,
          })),
          capabilities: { atomicBatch: { supported: true } },
        }],
      }) as string;

      setTxHash(result);
      setStatus('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStatus('error');
    }
  }, [walletClient, address, chainId, calls]);

  if (!isConnected) {
    return (
      <div className="rounded-2xl bg-[#0f1117] border border-white/10 p-6 text-center">
        <Layers className="w-8 h-8 text-white/20 mx-auto mb-2" />
        <p className="text-white/30 text-sm">Connect a wallet to use Batch Calls</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#0f1117] border border-white/10 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <Layers className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-white font-semibold text-sm">Transaction Batch</p>
          <p className="text-white/40 text-xs mt-0.5">ERC-5792 · wallet_sendCalls · atomic execution</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-4 border-t border-white/5">
          <div className="flex items-start gap-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/15 p-3 mt-4">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-cyan-300/70 text-xs leading-relaxed">
              Bundle multiple transactions into one atomic batch. Either all succeed or all revert —
              no partial execution. Uses{' '}
              <code className="bg-white/10 px-1 rounded text-cyan-300">wallet_sendCalls</code> (ERC-5792).
            </p>
          </div>

          {/* Get capabilities */}
          <div className="flex items-center gap-2">
            <button
              onClick={checkCapabilities}
              className="text-xs text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors"
            >
              Check wallet capabilities
            </button>
            {capabilities !== null && (
              <span className="text-xs text-emerald-400/70">
                {Object.keys(capabilities).length > 0 ? 'Capabilities loaded' : 'No capabilities reported'}
              </span>
            )}
          </div>

          {capabilities && Object.keys(capabilities).length > 0 && (
            <pre className="rounded-xl bg-black/40 border border-white/5 p-3 text-xs font-mono text-white/50 overflow-x-auto">
              {JSON.stringify(capabilities, null, 2)}
            </pre>
          )}

          <div className="space-y-3">
            {calls.map((call, i) => (
              <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Call #{i + 1}</span>
                  {calls.length > 1 && (
                    <button onClick={() => removeCall(i)} className="text-red-400/60 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-white/40 text-xs block">To Address</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={call.to}
                    onChange={e => updateCall(i, 'to', e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm font-mono placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-white/40 text-xs block">Value (ETH)</label>
                    <input
                      type="text"
                      placeholder="0.0"
                      value={call.value}
                      onChange={e => updateCall(i, 'value', e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-white/40 text-xs block">Data (hex)</label>
                    <input
                      type="text"
                      placeholder="0x"
                      value={call.data}
                      onChange={e => updateCall(i, 'data', e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm font-mono placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addCall}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 hover:border-cyan-500/40 py-2.5 text-white/40 hover:text-cyan-400 text-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Call
          </button>

          <button
            onClick={sendCalls}
            disabled={status === 'pending' || calls.some(c => !c.to)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900/40 disabled:text-cyan-300/30 text-white font-semibold py-3 text-sm transition-all shadow-lg shadow-cyan-500/20"
          >
            {status === 'pending' ? (
              <><Loader className="w-4 h-4 animate-spin" />Sending Batch…</>
            ) : (
              <><Layers className="w-4 h-4" />Send Batch</>
            )}
          </button>

          {status === 'success' && txHash && (
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-emerald-300 text-xs font-medium">Batch submitted!</p>
                <p className="text-emerald-400/60 text-xs font-mono mt-0.5 break-all">{txHash}</p>
              </div>
            </div>
          )}
          {status === 'error' && errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-500/5 border border-red-500/20 p-3">
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-red-300 text-xs font-medium">Error</p>
                <p className="text-red-400/60 text-xs mt-0.5 break-all">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
