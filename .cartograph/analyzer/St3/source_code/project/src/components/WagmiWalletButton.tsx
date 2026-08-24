import { useState, useRef, useEffect } from 'react';
import { useAccount, useChainId, useDisconnect } from 'wagmi';
import { useAppKit, useAppKitNetwork } from '@reown/appkit/react';
import { Wallet, ChevronDown, LogOut, Copy, CheckCheck, ExternalLink } from 'lucide-react';

export default function WagmiWalletButton() {
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const { caipNetwork } = useAppKitNetwork();
  const chainId = useChainId();

  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerBase =
    chainId === 1       ? 'https://etherscan.io'          :
    chainId === 11155111 ? 'https://sepolia.etherscan.io'  :
    chainId === 137     ? 'https://polygonscan.com'        :
    chainId === 10      ? 'https://optimistic.etherscan.io':
    chainId === 42161   ? 'https://arbiscan.io'            :
    chainId === 8453    ? 'https://basescan.org'           :
                          'https://etherscan.io';

  const explorerUrl  = `${explorerBase}/address/${address}`;
  const networkName  = caipNetwork?.name ?? '';

  if (!isConnected) {
    return (
      <button
        onClick={() => open({ view: 'Connect' })}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold px-5 py-2.5 text-sm shadow-lg shadow-blue-500/25 transition-all duration-150"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(v => !v)}
        className="inline-flex items-center gap-2.5 rounded-xl bg-[#0f1117] hover:bg-[#181c27] border border-white/10 hover:border-blue-500/30 text-white px-4 py-2.5 text-sm font-medium shadow-lg transition-all duration-150"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/60" />
        <span className="font-mono">{shortAddress}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#0f1117] border border-white/10 shadow-2xl z-50 overflow-hidden"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        >
          {/* Account info */}
          <div className="px-4 py-4 border-b border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {address?.slice(2, 4).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white font-mono text-sm truncate">{shortAddress}</p>
                <p className="text-white/40 text-xs mt-0.5">
                  {connector?.name}{networkName ? ` · ${networkName}` : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyAddress}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 py-1.5 text-xs text-white/60 hover:text-white transition-all"
              >
                {copied ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 py-1.5 text-xs text-white/60 hover:text-white transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                Explorer
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={() => { setShowDropdown(false); open({ view: 'Networks' }); }}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Switch Network
            </button>
            <button
              onClick={() => { setShowDropdown(false); open({ view: 'Account' }); }}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
            >
              <Wallet className="w-4 h-4 text-white/40" />
              Account Details
            </button>
            <button
              onClick={() => { disconnect(); setShowDropdown(false); }}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
