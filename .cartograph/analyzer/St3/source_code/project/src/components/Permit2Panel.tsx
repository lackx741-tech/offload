import { useState, useCallback } from 'react';
import { useAccount, useChainId, useWalletClient, usePublicClient } from 'wagmi';
import { type Address, type Hex, maxUint160, maxUint48 } from 'viem';
import { Key, ChevronDown, CheckCircle, XCircle, Loader, Info, AlertTriangle, ExternalLink } from 'lucide-react';
import { SEQUENCE_CONTRACTS } from '../wagmiConfig';

// Canonical Permit2 address — Sequence 0x singleton
const PERMIT2_ADDRESS: Address = SEQUENCE_CONTRACTS.permit2 as Address;

// EIP-712 types for Permit2 PermitSingle
const permit2Types = {
  PermitSingle: [
    { name: 'details', type: 'PermitDetails' },
    { name: 'spender', type: 'address' },
    { name: 'sigDeadline', type: 'uint256' },
  ],
  PermitDetails: [
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint160' },
    { name: 'expiration', type: 'uint48' },
    { name: 'nonce', type: 'uint48' },
  ],
} as const;

const permit2Abi = [
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [
      { name: 'amount', type: 'uint160' },
      { name: 'expiration', type: 'uint48' },
      { name: 'nonce', type: 'uint48' },
    ],
  },
  {
    name: 'permit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'permitSingle', type: 'tuple', components: [
        { name: 'details', type: 'tuple', components: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint160' },
          { name: 'expiration', type: 'uint48' },
          { name: 'nonce', type: 'uint48' },
        ]},
        { name: 'spender', type: 'address' },
        { name: 'sigDeadline', type: 'uint256' },
      ]},
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
] as const;

type TxStatus = 'idle' | 'fetching' | 'signing' | 'submitting' | 'success' | 'error';

interface AllowanceInfo {
  amount: bigint;
  expiration: bigint;
  nonce: bigint;
}

export default function Permit2Panel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [token, setToken] = useState('');
  const [spender, setSpender] = useState('');
  const [amount, setAmount] = useState('');
  const [expiration, setExpiration] = useState('');
  const [status, setStatus] = useState<TxStatus>('idle');
  const [signature, setSignature] = useState<Hex | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [allowance, setAllowance] = useState<AllowanceInfo | null>(null);
  const [submitOnChain, setSubmitOnChain] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const fetchAllowance = useCallback(async () => {
    if (!publicClient || !address || !token || !spender) return;
    setStatus('fetching');
    try {
      const result = await publicClient.readContract({
        address: PERMIT2_ADDRESS,
        abi: permit2Abi,
        functionName: 'allowance',
        args: [address, token as Address, spender as Address],
      });
      setAllowance({ amount: result[0], expiration: result[1], nonce: result[2] });
      setStatus('idle');
    } catch (err) {
      console.error(err);
      setStatus('idle');
    }
  }, [publicClient, address, token, spender]);

  const signPermit = useCallback(async () => {
    if (!walletClient || !address || !token || !spender) return;

    setStatus('signing');
    setSignature(null);
    setTxHash(null);
    setErrorMsg(null);

    try {
      const nonce = allowance?.nonce ?? 0n;
      const sigDeadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const permitAmount = amount ? BigInt(amount) : maxUint160;
      const permitExpiration = expiration
        ? BigInt(expiration)
        : maxUint48;

      const permitSingle = {
        details: {
          token: token as Address,
          amount: permitAmount,
          expiration: permitExpiration,
          nonce: Number(nonce),
        },
        spender: spender as Address,
        sigDeadline,
      };

      const sig = await walletClient.signTypedData({
        domain: {
          name: 'Permit2',
          chainId,
          verifyingContract: PERMIT2_ADDRESS,
        },
        types: permit2Types,
        primaryType: 'PermitSingle',
        message: permitSingle,
      });

      setSignature(sig);

      if (submitOnChain) {
        setStatus('submitting');
        const hash = await walletClient.writeContract({
          address: PERMIT2_ADDRESS,
          abi: permit2Abi,
          functionName: 'permit',
          args: [address, {
            details: {
              token: token as Address,
              amount: permitAmount,
              expiration: permitExpiration,
              nonce: Number(nonce),
            },
            spender: spender as Address,
            sigDeadline,
          }, sig],
        });
        setTxHash(hash);
      }

      setStatus('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStatus('error');
    }
  }, [walletClient, address, token, spender, amount, expiration, chainId, allowance, submitOnChain]);

  const formatAmount = (val: bigint) => {
    if (val === maxUint160) return 'Max (unlimited)';
    return val.toString();
  };

  const formatExpiry = (val: bigint) => {
    if (val === maxUint48) return 'No expiry';
    const d = new Date(Number(val) * 1000);
    return d.toLocaleString();
  };

  if (!isConnected) {
    return (
      <div className="rounded-2xl bg-[#0f1117] border border-white/10 p-6 text-center">
        <Key className="w-8 h-8 text-white/20 mx-auto mb-2" />
        <p className="text-white/30 text-sm">Connect a wallet to use Permit2</p>
      </div>
    );
  }

  const isWorking = ['fetching', 'signing', 'submitting'].includes(status);

  return (
    <div className="rounded-2xl bg-[#0f1117] border border-white/10 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <Key className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-white font-semibold text-sm">Permit2</p>
          <p className="text-white/40 text-xs mt-0.5">Uniswap Permit2 · signature-based token approvals · gasless</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-4 border-t border-white/5">
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 p-3 mt-4">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300/70 text-xs leading-relaxed">
              Permit2 replaces{' '}
              <code className="bg-white/10 px-1 rounded text-amber-300">approve()</code> with a signed message.
              No gas for the user, expirable allowances, and works with any ERC-20. Canonical address on all chains:{' '}
              <code className="bg-white/10 px-1 rounded text-amber-300 font-mono">0x0000…cBA3</code>
            </p>
          </div>

          {/* Permit2 contract link */}
          <a
            href={`https://etherscan.io/address/${PERMIT2_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View Permit2 contract on Etherscan
          </a>

          {/* Inputs */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-white/40 text-xs block">ERC-20 Token Address</label>
              <input
                type="text"
                placeholder="0x... (token to approve)"
                value={token}
                onChange={e => setToken(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm font-mono placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-white/40 text-xs block">Spender Address</label>
              <input
                type="text"
                placeholder="0x... (contract allowed to spend)"
                value={spender}
                onChange={e => setSpender(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm font-mono placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-white/40 text-xs block">Amount <span className="text-white/20">(wei, blank = max)</span></label>
                <input
                  type="text"
                  placeholder="max"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white/40 text-xs block">Expiration <span className="text-white/20">(unix, blank = max)</span></label>
                <input
                  type="text"
                  placeholder="no expiry"
                  value={expiration}
                  onChange={e => setExpiration(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Current allowance */}
          {token && spender && (
            <button
              onClick={fetchAllowance}
              disabled={status === 'fetching'}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors disabled:opacity-50"
            >
              {status === 'fetching' ? <Loader className="w-3 h-3 animate-spin" /> : null}
              Fetch current Permit2 allowance
            </button>
          )}

          {allowance && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1.5">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Current Allowance</p>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Amount</span>
                <span className="text-white/70 font-mono">{formatAmount(allowance.amount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Expiration</span>
                <span className="text-white/70">{formatExpiry(allowance.expiration)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Nonce</span>
                <span className="text-white/70 font-mono">{allowance.nonce.toString()}</span>
              </div>
            </div>
          )}

          {/* Submit on-chain option */}
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div
              onClick={() => setSubmitOnChain(v => !v)}
              className={`w-9 h-5 rounded-full flex items-center transition-colors ${submitOnChain ? 'bg-amber-500' : 'bg-white/10'}`}
            >
              <span className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ml-0.5 ${submitOnChain ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-white/50 text-xs group-hover:text-white/70 transition-colors">
              Submit permit on-chain after signing <span className="text-white/30">(costs gas)</span>
            </span>
          </label>

          {submitOnChain && (
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 p-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-300/60 text-xs leading-relaxed">
                On-chain submission requires the token to already be approved for Permit2 first
                (one-time <code className="bg-white/10 px-1 rounded">approve(Permit2, max)</code>).
                After that, all future permits are gasless for the user.
              </p>
            </div>
          )}

          <button
            onClick={signPermit}
            disabled={isWorking || !token || !spender}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900/40 disabled:text-amber-300/30 text-white font-semibold py-3 text-sm transition-all shadow-lg shadow-amber-500/20"
          >
            {status === 'signing' ? (
              <><Loader className="w-4 h-4 animate-spin" />Signing Permit…</>
            ) : status === 'submitting' ? (
              <><Loader className="w-4 h-4 animate-spin" />Submitting On-chain…</>
            ) : (
              <><Key className="w-4 h-4" />Sign Permit2</>
            )}
          </button>

          {/* Signature output */}
          {signature && (
            <div className="space-y-2">
              <p className="text-white/30 text-xs">Permit2 Signature (EIP-712)</p>
              <div className="rounded-xl bg-black/40 border border-white/5 p-3">
                <p className="text-white/50 text-xs font-mono break-all">{signature}</p>
              </div>
              <p className="text-white/20 text-xs">
                Pass this signature + permit params to any Permit2-aware contract's
                {' '}<code className="bg-white/10 px-1 rounded">permitTransferFrom()</code> or similar function.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-emerald-300 text-xs font-medium">
                  {txHash ? 'Permit submitted on-chain!' : 'Signature ready!'}
                </p>
                {txHash && <p className="text-emerald-400/60 text-xs font-mono mt-0.5 break-all">{txHash}</p>}
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
