/**
 * Eip7702Panel — session-key-as-sender
 *
 * After a session has been created (SessionPanel), the stored session private
 * key is loaded from the database. That key — not the EOA — is used to:
 *   1. signAuthorization  (delegates EOA code → Sequence eip7702Module)
 *   2. sendTransaction    (broadcasts the Type-4 tx with any batch of calls)
 *
 * The EOA never needs to be online for this step.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import {
  createWalletClient, http, parseEther,
  type Hex, type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  mainnet, sepolia, polygon, optimism, arbitrum, base,
} from 'wagmi/chains';
import {
  Zap, Plus, Trash2, ChevronDown, CheckCircle, XCircle,
  Loader, Info, Key, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { SEQUENCE_CONTRACTS } from '../wagmiConfig';
import { supabase } from '../lib/supabase';
import { computeImageHash, computeWalletAddress, buildEip7702InitCalldata, defaultConfig } from '../lib/sequenceWallet';

// Map wagmi chainId → viem chain object for createWalletClient
const CHAIN_MAP: Record<number, typeof mainnet> = {
  [mainnet.id]:   mainnet,
  [sepolia.id]:   sepolia,
  [polygon.id]:   polygon,
  [optimism.id]:  optimism,
  [arbitrum.id]:  arbitrum,
  [base.id]:      base,
};

interface Call {
  to:    string;
  value: string;
  data:  string;
}

interface SessionInfo {
  sessionPrivateKey: Hex;
  sessionKey:        Address;
  wallet:            Address;
  eoa:               Address;
}

type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export default function Eip7702Panel() {
  const { address, isConnected } = useAccount();
  const chainId                  = useChainId();
  const publicClient             = usePublicClient();

  const [calls,     setCalls]     = useState<Call[]>([
    { to: SEQUENCE_CONTRACTS.batchMulticall, value: '0', data: '0x' },
  ]);
  const [session,   setSession]   = useState<SessionInfo | null>(null);
  const [loadingSess, setLoadingSess] = useState(false);
  const [status,    setStatus]    = useState<TxStatus>('idle');
  const [txHash,    setTxHash]    = useState<string | null>(null);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);
  const [expanded,  setExpanded]  = useState(true);

  // Load session from DB whenever address/chain changes
  const loadSession = useCallback(async (eoa: string, cid: number) => {
    setLoadingSess(true);
    setSession(null);
    const { data } = await supabase
      .from('sequence_sessions')
      .select('session_key, session_private_key, wallet')
      .eq('eoa', eoa.toLowerCase())
      .eq('chain_id', cid)
      .not('session_private_key', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.session_private_key) {
      setSession({
        sessionPrivateKey: data.session_private_key as Hex,
        sessionKey:        data.session_key as Address,
        wallet:            data.wallet as Address,
        eoa:               eoa as Address,
      });
    }
    setLoadingSess(false);
  }, []);

  useEffect(() => {
    if (address) loadSession(address, chainId);
  }, [address, chainId, loadSession]);

  const addCall    = () => setCalls(c => [...c, { to: '', value: '0', data: '0x' }]);
  const removeCall = (i: number) => setCalls(c => c.filter((_, idx) => idx !== i));
  const updateCall = (i: number, field: keyof Call, val: string) =>
    setCalls(c => c.map((call, idx) => idx === i ? { ...call, [field]: val } : call));

  const send = useCallback(async () => {
    if (!session || !publicClient) return;
    if (calls.some(c => !c.to)) return;

    setStatus('pending');
    setTxHash(null);
    setErrorMsg(null);

    try {
      const chain = CHAIN_MAP[chainId] ?? mainnet;

      // Build a local wallet client from the session private key
      const sessionAccount = privateKeyToAccount(session.sessionPrivateKey);
      const sessionClient  = createWalletClient({
        account:   sessionAccount,
        chain,
        transport: http(),
      });

      // Derive the EOA's wallet address and imageHash
      const config    = defaultConfig(session.eoa);
      const imageHash = computeImageHash(config);
      const wallet    = computeWalletAddress(imageHash);

      // 1. Session key signs EIP-7702 authorization delegating EOA → eip7702Module
      const authorization = await sessionClient.signAuthorization({
        account:         sessionAccount,
        contractAddress: SEQUENCE_CONTRACTS.eip7702Module as Address,
        // executor is the session key (not self-executing from EOA perspective)
      });

      // 2. Session key broadcasts the Type-4 tx:
      //    - authorizationList sets EOA's code to eip7702Module
      //    - data calls updateImageHash on the now-delegated EOA
      //    - additional user calls are encoded as a batch via batchMulticall
      const batchCalls = calls
        .filter(c => c.to)
        .map(c => ({
          to:    c.to as Address,
          value: parseEther(c.value || '0'),
          data:  (c.data || '0x') as Hex,
        }));

      // Encode the batch into a single multicall payload if more than 1 call,
      // otherwise send the single call directly
      const initData = buildEip7702InitCalldata(imageHash);

      const hash = await sessionClient.sendTransaction({
        account:           sessionAccount,
        to:                wallet,
        data:              initData,
        authorizationList: [authorization],
      });

      // 3. If there are additional user calls, send them separately now that delegation is set
      if (batchCalls.length > 0) {
        for (const call of batchCalls) {
          await sessionClient.sendTransaction({
            account: sessionAccount,
            to:      call.to,
            value:   call.value,
            data:    call.data,
          });
        }
      }

      setTxHash(hash);
      setStatus('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStatus('error');
    }
  }, [session, publicClient, chainId, calls]);

  if (!isConnected) return null;

  const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

  return (
    <div className="rounded-2xl bg-[#0f1117] border border-white/10 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-white font-semibold text-sm">EIP-7702 via Session Key</p>
          <p className="text-white/40 text-xs mt-0.5">Session key signs &amp; broadcasts the Type-4 delegation tx</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-4 border-t border-white/5 pt-4">

          {/* Session status */}
          {loadingSess ? (
            <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/8 p-3">
              <Loader className="w-4 h-4 text-white/30 animate-spin flex-shrink-0" />
              <span className="text-white/30 text-xs">Loading session from database…</span>
            </div>
          ) : session ? (
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-emerald-300 text-xs font-semibold">Session key loaded — ready to sign as sender</p>
                <p className="text-emerald-400/60 text-[11px] font-mono">
                  Session key: {short(session.sessionKey)}
                  <span className="mx-1.5 text-white/20">·</span>
                  Wallet: {short(session.wallet)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 text-xs font-semibold">No session found</p>
                <p className="text-amber-400/60 text-xs mt-0.5">
                  Go to the <strong>Session</strong> tab and create a session first. The session key will be used here as the EIP-7702 message sender.
                </p>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex items-start gap-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15 p-3">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-300/70 text-xs leading-relaxed">
              The <strong className="text-blue-200">session key</strong> (not your EOA) signs the EIP-7702 authorization and broadcasts the Type-4 transaction.
              Your EOA's code is delegated to the Sequence <code className="bg-white/10 px-1 rounded text-blue-200">eip7702Module</code> in that tx.
              Your EOA never needs to be online for this step.
            </p>
          </div>

          {/* Calls */}
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
                    type="text" placeholder="0x..." value={call.to}
                    onChange={e => updateCall(i, 'to', e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm font-mono placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-white/40 text-xs block">Value (ETH)</label>
                    <input
                      type="text" placeholder="0.0" value={call.value}
                      onChange={e => updateCall(i, 'value', e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-white/40 text-xs block">Data (hex)</label>
                    <input
                      type="text" placeholder="0x" value={call.data}
                      onChange={e => updateCall(i, 'data', e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm font-mono placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addCall}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 hover:border-blue-500/40 py-2.5 text-white/40 hover:text-blue-400 text-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Call
          </button>

          <button
            onClick={send}
            disabled={!session || status === 'pending' || calls.some(c => !c.to)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/40 disabled:text-blue-300/30 text-white font-semibold py-3 text-sm transition-all shadow-lg shadow-blue-500/20"
          >
            {status === 'pending' ? (
              <><Loader className="w-4 h-4 animate-spin" />Sending via session key…</>
            ) : (
              <><Key className="w-4 h-4" />Send EIP-7702 (session key as sender)</>
            )}
          </button>

          {status === 'success' && txHash && (
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-emerald-300 text-xs font-semibold">Delegation tx submitted by session key</p>
                <p className="text-emerald-400/60 text-xs font-mono mt-0.5 break-all">{txHash}</p>
              </div>
            </div>
          )}

          {status === 'error' && errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-500/5 border border-red-500/20 p-3">
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-red-300 text-xs font-semibold">Error</p>
                <p className="text-red-400/60 text-xs mt-0.5 break-all">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
