import { useState, useCallback } from 'react';
import { useAccount, useChainId, useWalletClient, usePublicClient } from 'wagmi';
import { type Hex, type Address, hashTypedData, encodeAbiParameters, parseAbiParameters } from 'viem';
import { Wind, ChevronDown, CheckCircle, XCircle, Loader, Info, AlertTriangle } from 'lucide-react';
import { SEQUENCE_CONTRACTS } from '../wagmiConfig';

// Minimal ForwardRequest type for EIP-2771 gasless meta-tx
interface ForwardRequest {
  from: Address;
  to: Address;
  value: string;
  gas: string;
  nonce: string;
  deadline: string;
  data: Hex;
}

type TxStatus = 'idle' | 'signing' | 'relaying' | 'success' | 'error';

// EIP-712 domain + types for a generic MinimalForwarder (OpenZeppelin-compatible)
function buildTypedData(request: ForwardRequest, chainId: number, forwarderAddress: Address) {
  return {
    domain: {
      name: 'MinimalForwarder',
      version: '0.0.1',
      chainId,
      verifyingContract: forwarderAddress,
    },
    types: {
      ForwardRequest: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'gas', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint48' },
        { name: 'data', type: 'bytes' },
      ],
    },
    primaryType: 'ForwardRequest' as const,
    message: {
      from: request.from,
      to: request.to as Address,
      value: BigInt(request.value || '0'),
      gas: BigInt(request.gas || '200000'),
      nonce: BigInt(request.nonce || '0'),
      deadline: BigInt(request.deadline),
      data: request.data,
    },
  };
}

export default function GaslessPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [forwarder, setForwarder] = useState(SEQUENCE_CONTRACTS.guest);
  const [relayerUrl, setRelayerUrl] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [callData, setCallData] = useState('0x');
  const [gasLimit, setGasLimit] = useState('200000');
  const [status, setStatus] = useState<TxStatus>('idle');
  const [signature, setSignature] = useState<Hex | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  // Read on-chain nonce from forwarder (nonces(address))
  const fetchNonce = useCallback(async (): Promise<bigint> => {
    if (!publicClient || !address || !forwarder) return 0n;
    try {
      const result = await publicClient.readContract({
        address: forwarder as Address,
        abi: [{ name: 'nonces', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }],
        functionName: 'nonces',
        args: [address],
      });
      return result as bigint;
    } catch {
      return 0n;
    }
  }, [publicClient, address, forwarder]);

  const signAndRelay = useCallback(async () => {
    if (!walletClient || !address || !toAddress || !forwarder) return;

    setStatus('signing');
    setSignature(null);
    setTxHash(null);
    setErrorMsg(null);

    try {
      const nonce = await fetchNonce();
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour

      const request: ForwardRequest = {
        from: address,
        to: toAddress as Address,
        value: '0',
        gas: gasLimit,
        nonce: nonce.toString(),
        deadline: deadline.toString(),
        data: (callData || '0x') as Hex,
      };

      const typedData = buildTypedData(request, chainId, forwarder as Address);

      // EIP-712 sign
      const sig = await walletClient.signTypedData(typedData);
      setSignature(sig);

      // Hash for display
      const digest = hashTypedData(typedData);

      if (relayerUrl) {
        setStatus('relaying');
        const response = await fetch(relayerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request,
            signature: sig,
            digest,
            forwarder,
            chainId,
          }),
        });
        if (!response.ok) throw new Error(`Relayer error: ${response.status} ${response.statusText}`);
        const json = await response.json() as { txHash?: string; hash?: string };
        setTxHash(json.txHash ?? json.hash ?? 'relayed');
      }

      setStatus('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStatus('error');
    }
  }, [walletClient, address, toAddress, forwarder, relayerUrl, callData, gasLimit, chainId, fetchNonce]);

  const encodedPayload = signature
    ? encodeAbiParameters(
        parseAbiParameters('address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data, bytes sig'),
        [address as Address, toAddress as Address || '0x0000000000000000000000000000000000000000', 0n, BigInt(gasLimit || '200000'), 0n, (callData || '0x') as Hex, signature]
      )
    : null;

  if (!isConnected) {
    return (
      <div className="rounded-2xl bg-[#0f1117] border border-white/10 p-6 text-center">
        <Wind className="w-8 h-8 text-white/20 mx-auto mb-2" />
        <p className="text-white/30 text-sm">Connect a wallet to use Gasless Batch</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#0f1117] border border-white/10 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Wind className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-white font-semibold text-sm">EIP-712 Gasless Batch</p>
          <p className="text-white/40 text-xs mt-0.5">Meta-transactions · EIP-2771 forwarder · relayer-sponsored</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-4 border-t border-white/5">
          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3 mt-4">
            <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-300/70 text-xs leading-relaxed">
              Sign a typed{' '}
              <code className="bg-white/10 px-1 rounded text-emerald-300">ForwardRequest</code> with EIP-712.
              A relayer pays gas and submits the tx on-chain via an EIP-2771 forwarder contract.
              No ETH required by the signer.
            </p>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 p-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300/70 text-xs leading-relaxed">
              Requires a deployed{' '}
              <code className="bg-white/10 px-1 rounded text-amber-300">MinimalForwarder</code> contract
              and a running relayer endpoint. Compatible with OpenZeppelin's EIP-2771 implementation.
            </p>
          </div>

          {/* Forwarder + Relayer */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-white/40 text-xs block">Forwarder Contract Address</label>
              <input
                type="text"
                placeholder="0x... (MinimalForwarder)"
                value={forwarder}
                onChange={e => setForwarder(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm font-mono placeholder-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-white/40 text-xs block">Relayer Endpoint URL <span className="text-white/20">(optional — sign only if empty)</span></label>
              <input
                type="text"
                placeholder="https://your-relayer.example.com/relay"
                value={relayerUrl}
                onChange={e => setRelayerUrl(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm font-mono placeholder-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Call params */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
            <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Transaction Details</span>
            <div className="space-y-2">
              <label className="text-white/40 text-xs block">Target Contract (to)</label>
              <input
                type="text"
                placeholder="0x..."
                value={toAddress}
                onChange={e => setToAddress(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm font-mono placeholder-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-white/40 text-xs block">Gas Limit</label>
                <input
                  type="text"
                  placeholder="200000"
                  value={gasLimit}
                  onChange={e => setGasLimit(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white/40 text-xs block">Call Data</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={callData}
                  onChange={e => setCallData(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm font-mono placeholder-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            onClick={signAndRelay}
            disabled={['signing', 'relaying'].includes(status) || !toAddress || !forwarder}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/40 disabled:text-emerald-300/30 text-white font-semibold py-3 text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            {status === 'signing' ? (
              <><Loader className="w-4 h-4 animate-spin" />Signing…</>
            ) : status === 'relaying' ? (
              <><Loader className="w-4 h-4 animate-spin" />Relaying…</>
            ) : (
              <><Wind className="w-4 h-4" />{relayerUrl ? 'Sign & Relay (Gasless)' : 'Sign Meta-Tx'}</>
            )}
          </button>

          {/* Signature output */}
          {signature && (
            <div className="space-y-2">
              <p className="text-white/30 text-xs">EIP-712 Signature</p>
              <div className="rounded-xl bg-black/40 border border-white/5 p-3">
                <p className="text-white/50 text-xs font-mono break-all">{signature}</p>
              </div>
              {encodedPayload && (
                <>
                  <p className="text-white/30 text-xs mt-2">ABI-encoded payload (for relayer)</p>
                  <div className="rounded-xl bg-black/40 border border-white/5 p-3">
                    <p className="text-white/50 text-xs font-mono break-all">{encodedPayload}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-emerald-300 text-xs font-medium">{txHash ? 'Transaction relayed!' : 'Signature ready!'}</p>
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
