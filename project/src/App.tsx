import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig, wagmiAdapter, SEQUENCE_CONTRACTS } from './wagmiConfig';
import WagmiWalletButton from './components/WagmiWalletButton';
import SessionPanel from './components/SessionPanel';
import { Shield, Wallet, Key, ExternalLink, CheckCircle2 } from 'lucide-react';

const queryClient = new QueryClient();

const CONTRACT_ROWS: { label: string; value: string; desc: string }[] = [
  { label: 'Factory', value: SEQUENCE_CONTRACTS.factory, desc: 'CREATE2 smart wallet factory' },
  { label: 'SessionManager', value: SEQUENCE_CONTRACTS.sessionManager, desc: 'Sequence session authorization manager' },
  { label: 'EIP-7702 Module', value: SEQUENCE_CONTRACTS.eip7702Module, desc: 'EOA delegation module' },
  { label: 'Permit2Executor', value: SEQUENCE_CONTRACTS.permit2Executor, desc: 'Permit2 execution target' },
];

function ContractsStrip() {
  return (
    <div className="rounded-2xl bg-[#0f1117] border border-white/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5">
        <p className="text-white font-semibold text-sm">Sequence 0x Runtime Contracts</p>
        <p className="text-white/40 text-xs mt-0.5">Reference addresses used by this one-signature runtime</p>
      </div>
      <div className="divide-y divide-white/5">
        {CONTRACT_ROWS.map((row) => (
          <div key={row.label} className="px-6 py-3.5 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-semibold">{row.label}</p>
              <p className="text-white/30 text-xs mt-0.5">{row.desc}</p>
            </div>
            <div className="text-white/40 text-xs font-mono hidden md:block">
              {row.value.slice(0, 8)}…{row.value.slice(-6)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletModalView() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_35%),#07090d] text-white">
      <div className="mx-auto flex min-h-screen max-w-[520px] items-center justify-center p-4">
        <div className="w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0f1117] shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
          <div className="border-b border-white/5 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-blue-300/80">
                    Connect Wallet
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    WalletConnect + One Signature
                  </p>
                </div>
              </div>
              <WagmiWalletButton />
            </div>
          </div>

          <div className="space-y-4 px-5 py-5">
            <div className="rounded-2xl border border-blue-500/15 bg-blue-500/5 px-4 py-3 text-sm text-blue-200">
              Use the wallet button once. After connect, the session flow below continues into a single EIP-712 authorization.
            </div>
            <SessionPanel autoRun />
          </div>
        </div>
      </div>
    </div>
  );
}

function DApp() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');

  if (view === 'wallet-modal') {
    return <WalletModalView />;
  }

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <header className="border-b border-white/5 backdrop-blur-md bg-black/30 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight">WagmiKit</span>
              <span className="ml-2 text-white/30 text-xs hidden sm:inline">One-Time EIP-712 Authorization</span>
            </div>
          </div>

          <WagmiWalletButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-blue-300 text-xs font-medium mb-6">
            <Shield className="w-3.5 h-3.5" />
            Sequence Session Authorization · One EIP-712 Signature
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            Single Signature
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
              Sequence Runtime
            </span>
          </h1>
          <p className="text-white/40 text-base max-w-2xl mx-auto leading-relaxed">
            Connect once, sign one EIP-712 session authorization, and persist the generated
            Sequence session for continued use.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
          {[
            {
              icon: <Key className="w-4 h-4 text-blue-400" />,
              label: 'One Signature',
              sub: 'Single EIP-712 session auth',
            },
            {
              icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
              label: 'Persisted Session',
              sub: 'Stored in Supabase sequence_sessions',
            },
            {
              icon: <ExternalLink className="w-4 h-4 text-cyan-400" />,
              label: 'Ready For St3',
              sub: 'Embedded runtime for wallet flows',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-4 space-y-2"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                {item.icon}
              </div>
              <p className="text-white text-sm font-semibold">{item.label}</p>
              <p className="text-white/40 text-xs">{item.sub}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-[#0f1117] border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <p className="text-white font-semibold text-sm">WalletConnect Flow</p>
              <p className="text-white/40 text-xs mt-0.5">
                Use the top-right wallet button once. After wallet connect, this page automatically asks for the single EIP-712 session signature.
              </p>
            </div>
            <div className="px-6 py-6">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-200">
                Top-right <span className="font-semibold">Connect Wallet</span> is the only connect action.
                Once connected, the session panel below immediately continues into one EIP-712 signature.
              </div>
            </div>
          </div>

          <SessionPanel autoRun />

          <ContractsStrip />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const config = wagmiAdapter.wagmiConfig ?? wagmiConfig;
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <DApp />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
