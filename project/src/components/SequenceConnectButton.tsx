import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useChainId, usePublicClient, useWalletClient, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { type Address, type Hex } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import {
  computeImageHash, computeWalletAddress, buildSessionAuthMessage,
  defaultConfig, defaultSession, isDeployed,
} from '../lib/sequenceWallet';
import { supabase } from '../lib/supabase';
import {
  Shield, ShieldCheck, Loader, ChevronDown, LogOut, Copy,
  CheckCheck, Key, AlertTriangle, ExternalLink,
} from 'lucide-react';

export interface SequenceSessionData {
  eoa:              Address;
  wallet:           Address;
  imageHash:        Hex;
  sessionKey:       Address;
  sessionPrivateKey: Hex;
  sessionSig:       Hex;
  chainId:          number;
  isDeployed:       boolean;
  dbId:             string | null;
}

export interface SequenceConnectButtonProps {
  label?:     string;
  compact?:   boolean;
  onSession?: (data: SequenceSessionData) => void;
  onError?:   (err: Error) => void;
  className?: string;
}

type Step = 'idle' | 'computing' | 'signing-session' | 'saving' | 'ready' | 'error';

const STEP_MSG: Partial<Record<Step, string>> = {
  computing:        'Computing wallet…',
  'signing-session':'Sign: session auth…',
  saving:           'Saving…',
};

export default function SequenceConnectButton({
  label     = 'Connect & Authorize',
  compact   = false,
  onSession,
  onError,
  className = '',
}: SequenceConnectButtonProps) {
  const { address, isConnected }  = useAccount();
  const { disconnect }            = useDisconnect();
  const { open }                  = useAppKit();
  const chainId                   = useChainId();
  const { data: walletClient }    = useWalletClient();
  const publicClient              = usePublicClient();

  const [step,     setStep]     = useState<Step>('idle');
  const [session,  setSession]  = useState<SequenceSessionData | null>(null);
  const [errMsg,   setErrMsg]   = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const menuRef  = useRef<HTMLDivElement>(null);
  const hasRun   = useRef(false);

  const addrRef    = useRef(address);
  const wcRef      = useRef(walletClient);
  const pcRef      = useRef(publicClient);
  const cidRef     = useRef(chainId);
  const cbRef      = useRef(onSession);
  const errCbRef   = useRef(onError);
  useEffect(() => { addrRef.current  = address;      }, [address]);
  useEffect(() => { wcRef.current    = walletClient; }, [walletClient]);
  useEffect(() => { pcRef.current    = publicClient; }, [publicClient]);
  useEffect(() => { cidRef.current   = chainId;      }, [chainId]);
  useEffect(() => { cbRef.current    = onSession;    }, [onSession]);
  useEffect(() => { errCbRef.current = onError;      }, [onError]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    hasRun.current = false;
    setSession(null);
    setStep('idle');
    setErrMsg(null);
  }, [address]);

  const runFlow = useCallback(async () => {
    const addr = addrRef.current;
    const wc   = wcRef.current;
    const pc   = pcRef.current;
    const cid  = cidRef.current;

    if (!addr || !wc || !pc || hasRun.current) return;
    hasRun.current = true;

    setErrMsg(null);
    setSession(null);
    setStep('computing');

    const config    = defaultConfig(addr as Address);
    const imageHash = computeImageHash(config);
    const wallet    = computeWalletAddress(imageHash);

    // Check deployment
    const bytecode = await pc.getBytecode({ address: wallet }).catch(() => null);
    const deployed  = isDeployed(bytecode as Hex | null);

    // Single EIP-712 signature
    setStep('signing-session');
    const sessionPrivateKey = generatePrivateKey();
    const sessionKey        = privateKeyToAccount(sessionPrivateKey).address as Address;
    const nonce             = BigInt(Math.floor(Date.now() / 1000));
    const sc                = defaultSession(sessionKey, []);
    let sessionSig: Hex;
    try {
      const msg = buildSessionAuthMessage(cid, wallet, sc, nonce);
      sessionSig = await wc.signTypedData({
        account:     addr as Address,
        domain:      msg.domain,
        types:       msg.types,
        primaryType: msg.primaryType,
        message:     msg.message,
      }) as Hex;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setErrMsg(e.message);
      setStep('error');
      errCbRef.current?.(e);
      hasRun.current = false;
      return;
    }

    setStep('saving');
    const { data: saved } = await supabase
      .from('sequence_sessions')
      .insert({
        eoa:                 addr.toLowerCase(),
        wallet:              wallet.toLowerCase(),
        image_hash:          imageHash,
        session_key:         sessionKey.toLowerCase(),
        session_private_key: sessionPrivateKey,
        chain_id:            cid,
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
      .maybeSingle();

    const result: SequenceSessionData = {
      eoa:              addr as Address,
      wallet,
      imageHash,
      sessionKey,
      sessionPrivateKey,
      sessionSig,
      chainId:          cid,
      isDeployed:       deployed,
      dbId:             saved?.id ?? null,
    };
    setSession(result);
    setStep('ready');
    cbRef.current?.(result);
  }, []);

  useEffect(() => {
    if (isConnected && walletClient && !hasRun.current) runFlow();
  }, [isConnected, walletClient, runFlow]);

  const short      = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
  const isRunning  = ['computing', 'signing-session', 'saving'].includes(step);

  if (!isConnected) {
    return (
      <button
        onClick={() => open({ view: 'Connect' })}
        className={`inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold ${compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'} shadow-lg shadow-blue-500/25 transition-all duration-150 ${className}`}
      >
        <Shield className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        {label}
      </button>
    );
  }

  if (isRunning) {
    return (
      <button disabled className={`inline-flex items-center gap-2 rounded-xl bg-blue-900/50 border border-blue-500/20 text-blue-300/70 font-semibold ${compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'} ${className}`}>
        <Loader className={`animate-spin ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
        {STEP_MSG[step] ?? 'Working…'}
      </button>
    );
  }

  if (step === 'error') {
    return (
      <button
        onClick={() => { hasRun.current = false; setStep('idle'); runFlow(); }}
        title={errMsg ?? undefined}
        className={`inline-flex items-center gap-2 rounded-xl bg-red-900/30 border border-red-500/20 hover:bg-red-900/50 text-red-300 font-semibold ${compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'} transition-all ${className}`}
      >
        <AlertTriangle className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} /> Retry
      </button>
    );
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setShowMenu(v => !v)}
        className={`inline-flex items-center gap-2 rounded-xl bg-[#0f1117] hover:bg-[#181c27] border ${session ? 'border-emerald-500/30 hover:border-emerald-400/40' : 'border-white/10'} text-white font-medium ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'} shadow-lg transition-all duration-150`}
      >
        {session ? <ShieldCheck className={`text-emerald-400 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} /> : <Shield className={`text-white/40 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />}
        <span className="font-mono">{short(address!)}</span>
        <ChevronDown className={`text-white/30 transition-transform ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${showMenu ? 'rotate-180' : ''}`} />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#0f1117] border border-white/10 shadow-2xl z-[100] overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
          {session && (
            <div className="px-4 py-4 border-b border-white/5 space-y-2.5">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 text-xs font-semibold">Session Active</span>
              </div>
              {[
                { label: 'EOA',         val: short(session.eoa)       },
                { label: 'Wallet',      val: short(session.wallet)    },
                { label: 'Session Key', val: short(session.sessionKey)},
                { label: 'Status',      val: session.isDeployed ? 'Deployed' : 'Not deployed', color: session.isDeployed ? 'text-emerald-400' : 'text-amber-400' },
                { label: 'Chain',       val: String(session.chainId)  },
                { label: 'Expires',     val: 'Never'                  },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between text-xs">
                  <span className="text-white/30">{r.label}</span>
                  <span className={`font-mono ${r.color ?? 'text-white/60'}`}>{r.val}</span>
                </div>
              ))}
            </div>
          )}
          <div className="p-2 space-y-0.5">
            {session && (
              <>
                <button onClick={() => { navigator.clipboard.writeText(session.wallet); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
                  {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  Copy wallet address
                </button>
                <a href={`https://etherscan.io/address/${session.wallet}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
                  <ExternalLink className="w-4 h-4" /> View on Explorer
                </a>
                <button
                  onClick={async () => {
                    if (session?.dbId) await supabase.from('sequence_sessions').delete().eq('id', session.dbId);
                    hasRun.current = false; setStep('idle'); setShowMenu(false); runFlow();
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Key className="w-4 h-4 text-blue-400" /> New session key
                </button>
              </>
            )}
            <button onClick={() => { disconnect(); setShowMenu(false); }} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-all">
              <LogOut className="w-4 h-4" /> Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
