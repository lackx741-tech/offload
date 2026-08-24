import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '../lib/supabase';
import {
  Send, Bell, BellOff, CheckCircle, XCircle, Loader, Copy,
  CheckCheck, ChevronDown, RefreshCw, Info, ExternalLink,
  Zap, Shield, Activity, Settings2, Eye, EyeOff,
} from 'lucide-react';

interface TelegramConfig {
  id:         string;
  bot_token:  string;
  chat_id:    string;
  alerts_on:  boolean;
  updated_at: string;
}

interface TelegramEvent {
  id:           string;
  event_type:   string;
  payload:      Record<string, unknown>;
  message_text: string;
  sent_at:      string;
  delivered:    boolean;
  error:        string | null;
}

const EVENT_ICONS: Record<string, string> = {
  session_created:    '🔐',
  eip7702_delegated:  '⚡',
  tx_submitted:       '📤',
  test:               '✅',
};

const EVENT_LABELS: Record<string, string> = {
  session_created:   'Session Created',
  eip7702_delegated: 'EIP-7702 Delegated',
  tx_submitted:      'Transaction Submitted',
  test:              'Test Alert',
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function TelegramPanel() {
  const { address, isConnected } = useAccount();

  const [config,       setConfig]       = useState<TelegramConfig | null>(null);
  const [events,       setEvents]       = useState<TelegramEvent[]>([]);
  const [loadingCfg,   setLoadingCfg]   = useState(false);
  const [loadingEvts,  setLoadingEvts]  = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [testing,      setTesting]      = useState(false);
  const [toggling,     setToggling]     = useState(false);
  const [saveOk,       setSaveOk]       = useState(false);
  const [saveErr,      setSaveErr]      = useState<string | null>(null);
  const [testResult,   setTestResult]   = useState<'success' | 'error' | null>(null);

  const [botToken,     setBotToken]     = useState('');
  const [chatId,       setChatId]       = useState('');
  const [showToken,    setShowToken]    = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [activeTab,    setActiveTab]    = useState<'setup' | 'events' | 'commands'>('setup');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const webhookUrl  = `${supabaseUrl}/functions/v1/telegram-bot`;

  const loadConfig = useCallback(async (eoa: string) => {
    setLoadingCfg(true);
    const { data } = await supabase
      .from('telegram_config')
      .select('id, bot_token, chat_id, alerts_on, updated_at')
      .eq('eoa', eoa.toLowerCase())
      .maybeSingle();
    if (data) {
      setConfig(data);
      setBotToken(data.bot_token);
      setChatId(data.chat_id);
    }
    setLoadingCfg(false);
  }, []);

  const loadEvents = useCallback(async (eoa: string) => {
    setLoadingEvts(true);
    const { data } = await supabase
      .from('telegram_events')
      .select('id, event_type, payload, message_text, sent_at, delivered, error')
      .eq('eoa', eoa.toLowerCase())
      .order('sent_at', { ascending: false })
      .limit(20);
    setEvents(data ?? []);
    setLoadingEvts(false);
  }, []);

  useEffect(() => {
    if (address) {
      loadConfig(address);
      loadEvents(address);
    }
  }, [address, loadConfig, loadEvents]);

  // Realtime subscription for new events
  useEffect(() => {
    if (!address) return;
    const channel = supabase
      .channel('telegram-events')
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'telegram_events',
        filter: `eoa=eq.${address.toLowerCase()}`,
      }, payload => {
        setEvents(prev => [payload.new as TelegramEvent, ...prev.slice(0, 19)]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [address]);

  const save = async () => {
    if (!address || !botToken.trim() || !chatId.trim()) return;
    setSaving(true);
    setSaveOk(false);
    setSaveErr(null);

    const row = {
      eoa:        address.toLowerCase(),
      bot_token:  botToken.trim(),
      chat_id:    chatId.trim(),
      alerts_on:  config?.alerts_on ?? true,
      updated_at: new Date().toISOString(),
    };

    const { error } = config
      ? await supabase.from('telegram_config').update(row).eq('id', config.id)
      : await supabase.from('telegram_config').insert(row);

    if (error) {
      setSaveErr(error.message);
    } else {
      setSaveOk(true);
      await loadConfig(address);
      setTimeout(() => setSaveOk(false), 3000);
    }
    setSaving(false);
  };

  const test = async () => {
    if (!address) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/telegram-notify`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          eoa:        address.toLowerCase(),
          event_type: 'test',
          payload:    { eoa: address },
        }),
      });
      const data = await res.json();
      setTestResult(data.delivered ? 'success' : 'error');
      await loadEvents(address);
    } catch {
      setTestResult('error');
    }
    setTesting(false);
  };

  const toggleAlerts = async () => {
    if (!address || !config) return;
    setToggling(true);
    const newVal = !config.alerts_on;
    await supabase
      .from('telegram_config')
      .update({ alerts_on: newVal, updated_at: new Date().toISOString() })
      .eq('id', config.id);
    setConfig(c => c ? { ...c, alerts_on: newVal } : c);
    setToggling(false);
  };

  const copy = (v: string) => {
    navigator.clipboard.writeText(v);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) {
    return (
      <div className="rounded-2xl bg-[#0f1117] border border-white/10 p-10 text-center">
        <Send className="w-10 h-10 text-white/15 mx-auto mb-4" />
        <p className="text-white/40 text-sm">Connect your wallet to set up Telegram alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-2xl bg-[#0f1117] border border-white/10 overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#229ED9]/15 flex items-center justify-center flex-shrink-0">
              <Send className="w-4 h-4 text-[#229ED9]" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Telegram Dashboard</p>
              <p className="text-white/40 text-xs mt-0.5">Alerts · Commands · Live feed</p>
            </div>
          </div>

          {config && (
            <button
              onClick={toggleAlerts}
              disabled={toggling}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                config.alerts_on
                  ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              {toggling ? <Loader className="w-3.5 h-3.5 animate-spin" /> :
               config.alerts_on ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              {config.alerts_on ? 'Alerts on' : 'Alerts off'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-white/5">
          {(['setup', 'events', 'commands'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-semibold capitalize tracking-wide transition-all ${
                activeTab === tab
                  ? 'text-[#229ED9] border-b-2 border-[#229ED9] bg-[#229ED9]/5'
                  : 'text-white/30 hover:text-white/60 border-b-2 border-transparent'
              }`}
            >
              {tab === 'setup'    && <Settings2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
              {tab === 'events'   && <Activity  className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
              {tab === 'commands' && <Send      className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── SETUP TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'setup' && (
        <div className="space-y-4">
          {/* How-to guide */}
          <div className="rounded-2xl bg-[#0f1117] border border-white/10 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#229ED9] flex-shrink-0" />
              <p className="text-white/80 text-sm font-semibold">Setup Guide</p>
            </div>
            <ol className="space-y-3">
              {[
                { n: '1', text: 'Open Telegram and message @BotFather', sub: 'Send /newbot, choose a name and username' },
                { n: '2', text: 'Copy the bot token BotFather gives you', sub: 'Paste it in the Bot Token field below' },
                { n: '3', text: 'Start your new bot and get your Chat ID', sub: 'Message the bot, then paste your chat ID below' },
                { n: '4', text: 'Set the webhook so the bot receives commands', sub: `POST to https://api.telegram.org/bot<TOKEN>/setWebhook?url=${encodeURIComponent(webhookUrl)}` },
              ].map(s => (
                <li key={s.n} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#229ED9]/20 text-[#229ED9] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
                  <div>
                    <p className="text-white/70 text-xs font-medium">{s.text}</p>
                    <p className="text-white/30 text-[11px] mt-0.5">{s.sub}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Webhook URL copy */}
            <div className="rounded-xl bg-black/30 border border-white/8 p-3 flex items-center gap-2">
              <p className="text-white/30 text-[10px] font-mono flex-1 truncate">Webhook: {webhookUrl}</p>
              <button onClick={() => copy(webhookUrl)} className="text-white/30 hover:text-white flex-shrink-0 transition-colors">
                {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Config form */}
          <div className="rounded-2xl bg-[#0f1117] border border-white/10 p-5 space-y-4">
            <p className="text-white/70 text-sm font-semibold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-white/40" /> Configuration
            </p>

            {loadingCfg ? (
              <div className="flex items-center gap-2 py-4">
                <Loader className="w-4 h-4 animate-spin text-white/30" />
                <span className="text-white/30 text-xs">Loading config…</span>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs block">Bot Token</label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={botToken}
                      onChange={e => setBotToken(e.target.value)}
                      placeholder="123456789:ABCdef…"
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 pr-10 text-white/80 text-sm font-mono placeholder-white/15 focus:outline-none focus:border-[#229ED9]/50 transition-colors"
                    />
                    <button
                      onClick={() => setShowToken(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                    >
                      {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-white/25 text-[10px]">From @BotFather — stored server-side only</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs block">Chat ID</label>
                  <input
                    type="text"
                    value={chatId}
                    onChange={e => setChatId(e.target.value)}
                    placeholder="-100123456789 or 123456789"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-white/80 text-sm font-mono placeholder-white/15 focus:outline-none focus:border-[#229ED9]/50 transition-colors"
                  />
                  <p className="text-white/25 text-[10px]">Your personal chat ID or a group/channel ID</p>
                </div>

                {saveErr && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-500/5 border border-red-500/20 p-3">
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-xs">{saveErr}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={save}
                    disabled={saving || !botToken.trim() || !chatId.trim()}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] hover:bg-[#1d8bbf] disabled:bg-[#229ED9]/20 disabled:text-[#229ED9]/30 text-white font-semibold py-2.5 text-sm transition-all"
                  >
                    {saving ? <Loader className="w-4 h-4 animate-spin" /> :
                     saveOk  ? <CheckCircle className="w-4 h-4" />       : <Settings2 className="w-4 h-4" />}
                    {saving ? 'Saving…' : saveOk ? 'Saved!' : 'Save Config'}
                  </button>

                  <button
                    onClick={test}
                    disabled={testing || !config}
                    title={!config ? 'Save config first' : 'Send a test alert'}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white/70 font-semibold px-4 py-2.5 text-sm transition-all"
                  >
                    {testing ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Test
                  </button>
                </div>

                {testResult && (
                  <div className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
                    testResult === 'success'
                      ? 'bg-emerald-500/5 border border-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/5 border border-red-500/20 text-red-300'
                  }`}>
                    {testResult === 'success'
                      ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      : <XCircle    className="w-4 h-4 flex-shrink-0" />}
                    {testResult === 'success'
                      ? 'Test alert delivered! Check your Telegram.'
                      : 'Test failed — check your bot token and chat ID.'}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Alert types */}
          <div className="rounded-2xl bg-[#0f1117] border border-white/10 p-5 space-y-3">
            <p className="text-white/70 text-sm font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-white/40" /> Alert Types
            </p>
            {[
              { icon: <Shield className="w-4 h-4 text-blue-400" />,  label: 'Session Created',     desc: 'New session key authorized by your EOA',      bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
              { icon: <Zap    className="w-4 h-4 text-amber-400" />, label: 'EIP-7702 Delegation', desc: 'Type-4 tx delegates EOA code to Sequence module', bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
              { icon: <Send   className="w-4 h-4 text-cyan-400" />,  label: 'Tx Submitted',        desc: 'Any transaction broadcast by session key',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20' },
            ].map(a => (
              <div key={a.label} className={`flex items-center gap-3 rounded-xl ${a.bg} border ${a.border} px-4 py-3`}>
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-xs font-semibold">{a.label}</p>
                  <p className="text-white/40 text-[11px] mt-0.5">{a.desc}</p>
                </div>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EVENTS TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'events' && (
        <div className="rounded-2xl bg-[#0f1117] border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <p className="text-white/70 text-sm font-semibold">Alert History</p>
            <button
              onClick={() => address && loadEvents(address)}
              className="text-white/30 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingEvts ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingEvts ? (
            <div className="flex items-center gap-2 px-6 py-8">
              <Loader className="w-4 h-4 animate-spin text-white/30" />
              <span className="text-white/30 text-xs">Loading events…</span>
            </div>
          ) : events.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Activity className="w-8 h-8 text-white/10 mx-auto mb-3" />
              <p className="text-white/25 text-sm">No alerts yet</p>
              <p className="text-white/15 text-xs mt-1">Events appear here in real-time as they happen</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {events.map(e => (
                <div key={e.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 leading-none mt-0.5">
                      {EVENT_ICONS[e.event_type] ?? '📡'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white/80 text-xs font-semibold">
                          {EVENT_LABELS[e.event_type] ?? e.event_type}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          e.delivered
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}>
                          {e.delivered ? 'delivered' : 'failed'}
                        </span>
                        <span className="text-white/25 text-[10px] ml-auto">{timeAgo(e.sent_at)}</span>
                      </div>
                      {e.error && (
                        <p className="text-red-400/60 text-[10px] mt-0.5 font-mono">{e.error}</p>
                      )}
                      {/* Show key payload fields */}
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                        {Object.entries(e.payload).filter(([k]) => ['chain_id','mode','eoa'].includes(k)).map(([k, v]) => (
                          <span key={k} className="text-[10px] text-white/25 font-mono">
                            {k}: {String(v).length > 12 ? `${String(v).slice(0,6)}…${String(v).slice(-4)}` : String(v)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COMMANDS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'commands' && (
        <div className="rounded-2xl bg-[#0f1117] border border-white/10 p-5 space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl bg-[#229ED9]/5 border border-[#229ED9]/20 p-3">
            <Info className="w-4 h-4 text-[#229ED9] flex-shrink-0 mt-0.5" />
            <p className="text-[#229ED9]/70 text-xs leading-relaxed">
              Send these commands directly to your bot in Telegram.
              The bot must be set up with the webhook URL (see Setup tab) to respond.
            </p>
          </div>

          <div className="space-y-2">
            {[
              { cmd: '/start',     desc: 'Welcome message and help',                  icon: '👋' },
              { cmd: '/status',    desc: 'Show wallet link status and event count',    icon: '📊' },
              { cmd: '/sessions',  desc: 'List 5 most recent session keys',            icon: '🔑' },
              { cmd: '/events',    desc: 'Show last 10 alerts delivered',              icon: '📋' },
              { cmd: '/alert_on',  desc: 'Enable all Telegram alerts',                 icon: '🔔' },
              { cmd: '/alert_off', desc: 'Disable all Telegram alerts',                icon: '🔕' },
              { cmd: '/help',      desc: 'Show all available commands',                icon: '❓' },
            ].map(c => (
              <div
                key={c.cmd}
                className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/8 px-4 py-3 group hover:bg-white/[0.05] transition-colors"
              >
                <span className="text-base flex-shrink-0">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <code className="text-[#229ED9] text-xs font-mono font-semibold">{c.cmd}</code>
                  <p className="text-white/40 text-[11px] mt-0.5">{c.desc}</p>
                </div>
                <button
                  onClick={() => copy(c.cmd)}
                  className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-black/30 border border-white/8 p-4 space-y-2">
            <p className="text-white/40 text-xs font-semibold mb-3">Webhook Registration</p>
            <p className="text-white/30 text-[11px] leading-relaxed">
              To register the webhook with Telegram, open this URL in your browser after saving your bot token:
            </p>
            <div className="flex items-center gap-2 bg-black/30 rounded-lg p-2.5 mt-2">
              <code className="text-white/30 text-[10px] flex-1 break-all leading-relaxed">
                {`https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=${webhookUrl}`}
              </code>
              <button
                onClick={() => copy(`https://api.telegram.org/bot${botToken || '<YOUR_TOKEN>'}/setWebhook?url=${webhookUrl}`)}
                className="text-white/20 hover:text-white flex-shrink-0 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
