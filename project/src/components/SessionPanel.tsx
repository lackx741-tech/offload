import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { type Address, type Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import {
  computeImageHash,
  computeWalletAddress,
  buildSessionAuthMessage,
  defaultConfig,
  defaultSession,
  isDeployed,
  NO_EXPIRY,
} from '../lib/sequenceWallet';
import { SEQUENCE_CONTRACTS } from '../wagmiConfig';
import { supabase } from '../lib/supabase';
import {
  Shield, Key, Zap, CheckCircle, XCircle, Loader, Copy,
  CheckCheck, ChevronDown, RefreshCw, Plus, Trash2, ExternalLink,
  ShieldCheck, AlertTriangle, Info,
} from 'lucide-react';

type FlowStep = 'idle' | 'computing' | 'signing-session' | 'saving' | 'done' | 'error';

interface FlowState {
  imageHash:         Hex     | null;
  walletAddress:     Address | null;
  isDeployed:        boolean;
  sessionKey:        Address | null;
  sessionPrivateKey: Hex     | null;
  sessionSig:        Hex     | null;
  savedId:           string  | null;
  error:             string  | null;
}

const INIT: FlowState = {
  imageHash:         null,
  walletAddress:     null,
  isDeployed:        false,
  sessionKey:        null,
  sessionPrivateKey: null,
  sessionSig:        null,
  savedId:           null,
  error:             null,
};

const STEP_LABELS: Record<FlowStep, string> = {
  idle:             '',
  computing:        'Computing wallet address…',
  'signing-session':'Sign session key authorization (EIP-712)…',
  saving:           'Saving session to database…',
  done:             'Session created — persists to database',
  error:            'Error',
};

function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={className}
    >
      {copied ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function AddressRow({ label, value, mono = true, color = 'text-white/70' }: {
  label: string; value: string; mono?: boolean; color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-0">
      <span className="text-white/40 text-xs flex-shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`text-xs truncate ${mono ? 'font-mono' : ''} ${color}`}>
          {value.length > 42 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value}
        </span>
        <CopyButton value={value} className="flex-shrink-0 text-white/30 hover:text-white transition-colors" />
      </div>
    </div>
  );
}

export interface SessionResult {
  eoa:              Address;
  wallet:           Address;
  imageHash:        Hex;
  sessionKey:       Address;
  sessionPrivateKey: Hex;
  sessionSig:       Hex;
  chainId:          number;
  dbId:             string | null;
}

export default function SessionPanel({
  autoRun = false,
  onSession,
}: {
  autoRun?: boolean;
  onSession?: (s: SessionResult) => void;
}) {
  const { address, isConnected } = useAccount();
  const chainId                  = useChainId();
  const { data: walletClient }   = useWalletClient();
  const publicClient             = usePublicClient();

  const [step,         setStep]         = useState<FlowStep>('idle');
  const [state,        setState]        = useState<FlowState>(INIT);
  const [expanded,     setExpanded]     = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [extraTargets, setExtraTargets] = useState<string[]>([]);
  const [newTarget,    setNewTarget]    = useState('');
  const [pastSessions, setPastSessions] = useState<{
    id: string; eoa: string; wallet: string; session_key: string; chain_id: number;
    deadline: number; created_at: string; is_deployed: boolean;
  }[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const autoRunLockRef = useRef<string | null>(null);
  const runningRef = useRef(false);

  const loadHistory = useCallback(async (eoa?: string) => {
    setLoadingHistory(true);
    let query = supabase
      .from('sequence_sessions')
      .select('id, eoa, wallet, session_key, chain_id, deadline, created_at, is_deployed')
      .order('created_at', { ascending: false })
      .limit(20);

    if (eoa) {
      query = query.eq('eoa', eoa.toLowerCase());
    }

    const { data } = await query;
    setPastSessions(data ?? []);
    setLoadingHistory(false);
  }, []);

  useEffect(() => { loadHistory(address); }, [address, loadHistory]);
  useEffect(() => {
    setState(INIT);
    setStep('idle');
    runningRef.current = false;
    autoRunLockRef.current = null;
  }, [address, chainId]);

  const run = useCallback(async () => {
    if (!address || !walletClient || !publicClient || runningRef.current) return;
    runningRef.current = true;
    setState(INIT);
    setStep('computing');

    const config    = defaultConfig(address as Address);
    const imageHash = computeImageHash(config);
    const wallet    = computeWalletAddress(imageHash);

    // Check deployment
    const bytecode = await publicClient.getBytecode({ address: wallet }).catch(() => null);
    const deployed  = isDeployed(bytecode as Hex | null);
    setState(s => ({ ...s, imageHash, walletAddress: wallet, isDeployed: deployed }));

    // Sign session auth (single EIP-712 signature)
    setStep('signing-session');
    const sessionPrivKey = generatePrivateKey();
    const sessionAccount = privateKeyToAccount(sessionPrivKey);
    const sessionKey     = sessionAccount.address as Address;

    const defaultTargets: Address[] = [
      SEQUENCE_CONTRACTS.batchMulticall as Address,
      SEQUENCE_CONTRACTS.guest          as Address,
      SEQUENCE_CONTRACTS.sessionManager as Address,
      ...extraTargets.filter(t => t.startsWith('0x') && t.length === 42).map(t => t as Address),
    ];

    const sc    = defaultSession(sessionKey, defaultTargets);
    const nonce = BigInt(Math.floor(Date.now() / 1000));

    let sessionSig: Hex;
    try {
      const msg = buildSessionAuthMessage(chainId, wallet, sc, nonce);
      sessionSig = await walletClient.signTypedData({
        account:     address as Address,
        domain:      msg.domain,
        types:       msg.types,
        primaryType: msg.primaryType,
        message:     msg.message,
      }) as Hex;
    } catch (err) {
      setState(s => ({ ...s, error: err instanceof Error ? err.message : String(err) }));
      setStep('error');
      runningRef.current = false;
      return;
    }
    setState(s => ({ ...s, sessionKey, sessionPrivateKey: sessionPrivKey, sessionSig }));

    setStep('saving');
    const { data: saved, error: dbErr } = await supabase
      .from('sequence_sessions')
      .insert({
        eoa:                 address.toLowerCase(),
        wallet:              wallet.toLowerCase(),
        image_hash:          imageHash,
        session_key:         sessionKey.toLowerCase(),
        session_private_key: sessionPrivKey,
        chain_id:            chainId,
        signature:           sessionSig,
        deadline:            sc.deadline,
        nonce:               Number(nonce),
        permissions:         sc.permissions.map(p => ({
          target:     p.target,
          valueLimit: p.valueLimit.toString(),
          deadline:   p.deadline,
        })),
        is_deployed: deployed,
      })
      .select('id')
      .single();

    if (dbErr) {
      setState(s => ({ ...s, error: dbErr.message }));
      setStep('error');
      runningRef.current = false;
      return;
    }

    setState(s => ({ ...s, savedId: saved?.id ?? null }));
    setStep('done');
    onSession?.({
      eoa:              address as Address,
      wallet,
      imageHash,
      sessionKey,
      sessionPrivateKey: sessionPrivKey,
      sessionSig,
      chainId,
      dbId:             saved?.id ?? null,
    });
    loadHistory(address);
    runningRef.current = false;
  }, [address, walletClient, publicClient, chainId, extraTargets, loadHistory, onSession]);

  useEffect(() => {
    if (!autoRun || !isConnected || !walletClient || !address) return;
    const connectionKey = `${address.toLowerCase()}:${chainId}`;
    if (autoRunLockRef.current === connectionKey) return;
    if (step !== 'idle') return;
    autoRunLockRef.current = connectionKey;
    run();
  }, [autoRun, isConnected, walletClient, address, chainId, step, run]);

  const isRunning  = ['computing', 'signing-session', 'saving'].includes(step);
  const isFinished = step === 'done';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#0f1117] border border-white/10 overflow-hidden">
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-semibold text-sm">Session Key</p>
            <p className="text-white/40 text-xs mt-0.5">
              One EIP-712 signature → persistent session key stored in DB
            </p>
          </div>
          <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="px-6 pb-6 border-t border-white/5 space-y-5 pt-4">

            <div className="flex items-start gap-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15 p-3">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-blue-300/70 text-xs leading-relaxed">
                Creates a <strong className="text-blue-300">session key</strong> authorized to act on your behalf.
                Requires <strong className="text-blue-200">1 EIP-712 signature</strong> from your EOA.
                The session key + private key are stored persistently in the database,
                but this runtime now creates a <strong className="text-blue-200">fresh session every time</strong>
                you run it. The EIP-7702 tab uses the latest created session key as the transaction sender.
              </p>
            </div>

            {!isConnected && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200">
                Use the top-right <strong>Connect Wallet</strong> button first. This panel always stays visible and the
                history below shows recorded sessions even before the next connect.
              </div>
            )}

            {/* Steps */}
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'computing',        label: 'Compute',     icon: <Zap       className="w-3.5 h-3.5" /> },
                { id: 'signing-session',  label: 'Sign',        icon: <Key       className="w-3.5 h-3.5" /> },
                { id: 'saving',           label: 'Save',        icon: <CheckCircle className="w-3.5 h-3.5" /> },
              ] as const).map((s, idx) => {
                const order: FlowStep[] = ['computing', 'signing-session', 'saving', 'done'];
                const ci   = order.indexOf(step);
                const done   = isFinished || ci > idx + 1;
                const active = step === s.id;
                return (
                  <div key={s.id} className={`rounded-xl border px-3 py-2.5 text-center transition-all ${
                    active ? 'bg-blue-500/10 border-blue-500/30' :
                    done   ? 'bg-emerald-500/5 border-emerald-500/20' :
                             'bg-white/[0.02] border-white/10'
                  }`}>
                    <div className={`flex items-center justify-center mb-1 ${active ? 'text-blue-400' : done ? 'text-emerald-400' : 'text-white/20'}`}>
                      {active ? <Loader className="w-3.5 h-3.5 animate-spin" /> : done ? <CheckCircle className="w-3.5 h-3.5" /> : s.icon}
                    </div>
                    <p className={`text-[10px] font-medium leading-tight ${active ? 'text-blue-300' : done ? 'text-emerald-300' : 'text-white/25'}`}>{s.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Results */}
            {(state.imageHash || state.sessionKey) && (
              <div className="rounded-xl bg-black/30 border border-white/8 divide-y divide-white/5 px-4">
                {state.walletAddress && (
                  <div className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5">
                    <span className="text-white/40 text-xs flex-shrink-0">Wallet (CREATE2)</span>
                    <div className="flex items-center gap-2 min-w-0">
                      {state.isDeployed
                        ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      <span className="text-xs font-mono text-white/70 truncate">{state.walletAddress}</span>
                      <CopyButton value={state.walletAddress} className="text-white/30 hover:text-white" />
                    </div>
                  </div>
                )}
                {state.sessionKey        && <AddressRow label="Session Key"     value={state.sessionKey}         color="text-emerald-300/80" />}
                {state.sessionPrivateKey && <AddressRow label="Session Privkey" value={state.sessionPrivateKey}  color="text-amber-300/80" />}
                {state.sessionSig        && <AddressRow label="Session Sig"     value={state.sessionSig}         color="text-white/50" />}
                {state.savedId           && <AddressRow label="DB Record"       value={state.savedId}            mono={false} color="text-white/50" />}
              </div>
            )}

            {/* Status */}
            {step !== 'idle' && (
              <div className={`flex items-center gap-2.5 rounded-xl p-3 text-xs ${
                isFinished  ? 'bg-emerald-500/5 border border-emerald-500/20 text-emerald-300' :
                step === 'error' ? 'bg-red-500/5 border border-red-500/20 text-red-300' :
                                   'bg-blue-500/5 border border-blue-500/15 text-blue-300/70'
              }`}>
                {isFinished ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> :
                 step === 'error' ? <XCircle className="w-4 h-4 flex-shrink-0" /> :
                                    <Loader className="w-4 h-4 flex-shrink-0 animate-spin" />}
                <span>{step === 'error' ? state.error : STEP_LABELS[step]}</span>
              </div>
            )}

            {/* Advanced */}
            <div>
              <button
                onClick={() => setShowAdvanced(v => !v)}
                className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs transition-colors"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                Advanced: extra permission targets
              </button>
              {showAdvanced && (
                <div className="mt-3 space-y-3 rounded-xl bg-white/[0.02] border border-white/8 p-4">
                  <div className="space-y-2">
                    {extraTargets.map((t, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="flex-1 text-xs font-mono text-white/50 bg-black/20 border border-white/10 rounded-lg px-3 py-2 truncate">{t}</span>
                        <button onClick={() => setExtraTargets(a => a.filter((_, idx) => idx !== i))} className="text-red-400/60 hover:text-red-400 transition-colors px-2">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text" placeholder="0x… contract address" value={newTarget}
                        onChange={e => setNewTarget(e.target.value)}
                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-xs font-mono placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                      <button
                        onClick={() => { if (newTarget.startsWith('0x') && newTarget.length === 42) { setExtraTargets(a => [...a, newTarget]); setNewTarget(''); } }}
                        className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-white/30 text-xs mb-1">Default targets (always included)</p>
                    {[
                      { label: 'BatchMulticall', addr: SEQUENCE_CONTRACTS.batchMulticall },
                      { label: 'Guest Module',   addr: SEQUENCE_CONTRACTS.guest },
                      { label: 'SessionManager', addr: SEQUENCE_CONTRACTS.sessionManager },
                    ].map(t => (
                      <div key={t.addr} className="flex items-center justify-between text-xs">
                        <span className="text-white/30">{t.label}</span>
                        <span className="font-mono text-white/20">{t.addr.slice(0, 10)}…</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action */}
            <button
              onClick={async () => {
                if (!isConnected) return;
                if (isFinished && state.savedId) {
                  await supabase.from('sequence_sessions').delete().eq('id', state.savedId);
                }
                setState(INIT);
                setStep('idle');
                runningRef.current = false;
                autoRunLockRef.current = null;
                run();
              }}
              disabled={isRunning || !isConnected}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/40 disabled:text-blue-300/30 text-white font-semibold py-3 text-sm transition-all shadow-lg shadow-blue-500/20"
            >
              {isRunning ? (
                <><Loader className="w-4 h-4 animate-spin" />Running…</>
              ) : !isConnected ? (
                <><Shield className="w-4 h-4" />Connect Wallet First</>
              ) : isFinished ? (
                <><RefreshCw className="w-4 h-4" />New session</>
              ) : (
                <><Shield className="w-4 h-4" />Create Session</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* History */}
      <div className="rounded-2xl bg-[#0f1117] border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-white/40" />
            <div>
              <span className="text-white/70 text-sm font-semibold">Session History</span>
              <p className="text-white/25 text-[10px] mt-0.5">
                {address ? 'Showing sessions for the connected wallet' : 'Showing the most recent recorded wallet sessions'}
              </p>
            </div>
          </div>
          <button onClick={() => loadHistory(address)} className="text-white/30 hover:text-white transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {pastSessions.length === 0 ? (
          <div className="px-6 py-6 text-center text-white/25 text-xs">No sessions yet</div>
        ) : (
          <div className="divide-y divide-white/5">
            {pastSessions.map(s => {
              const matchesConnected = !!address && s.eoa === address.toLowerCase();
              return (
                <div key={s.id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-white/[0.02]">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.deadline >= NO_EXPIRY ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white/60 text-xs font-mono truncate">{s.wallet}</p>
                      {matchesConnected && (
                        <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-blue-300">
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-white/25 text-[10px] mt-0.5">
                      EOA {s.eoa.slice(0, 8)}…{s.eoa.slice(-6)} · Chain {s.chain_id} ·{' '}
                      {s.deadline >= NO_EXPIRY
                        ? <span className="text-emerald-400/70">Never expires</span>
                        : <span className="text-amber-400/70">Expires {new Date(s.deadline * 1000).toLocaleString()}</span>}
                      {s.is_deployed && <span className="ml-2 text-emerald-400/50">· deployed</span>}
                    </p>
                  </div>
                  <a href={`https://etherscan.io/address/${s.wallet}`} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white/50 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
