"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Settings,
  LayoutDashboard,
  Layers,
  MessageSquare,
  Check,
  ChevronDown,
  Info,
} from "lucide-react"

// ── Reusable primitives ────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-4 mt-6 first:mt-0 flex items-center gap-2">
      <span className="h-px flex-1" style={{ background: "#1e1e1e" }} />
      {children}
      <span className="h-px flex-1" style={{ background: "#1e1e1e" }} />
    </h3>
  )
}

function PanelRow({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b" style={{ borderColor: "#161616" }}>
      <div className="flex items-center gap-2 min-w-[140px]">
        <span className="text-xs font-mono text-foreground tracking-wide">{label}</span>
        {hint && (
          <button aria-label="Info" className="text-muted-foreground hover:text-foreground">
            <Info size={11} />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function SelectInput({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none text-xs font-mono text-foreground rounded px-3 py-2 pr-7 outline-none transition-all"
        style={{ background: "#111111", border: "1px solid #222222", minWidth: 160 }}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "—"}
      className="text-xs font-mono text-foreground rounded px-3 py-2 outline-none transition-all flex-1 max-w-[220px]"
      style={{ background: "#111111", border: "1px solid #222222" }}
    />
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer py-2">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-9 h-5 rounded-full transition-all duration-200 flex-shrink-0"
        style={{
          background: checked ? "#00ff41" : "#222222",
          boxShadow: checked ? "0 0 8px rgba(0,255,65,0.3)" : "none",
        }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
          style={{
            left: checked ? "calc(100% - 18px)" : "2px",
            background: checked ? "#000000" : "#555555",
          }}
        />
      </button>
      <span className="text-xs font-mono text-foreground tracking-wide">{label}</span>
    </label>
  )
}

function CheckChip({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-all duration-200"
      style={{
        background: checked ? "rgba(0,255,65,0.08)" : "#111111",
        border: `1px solid ${checked ? "rgba(0,255,65,0.3)" : "#222222"}`,
        color: checked ? "#00ff41" : "#888888",
      }}
    >
      <span
        className="w-3.5 h-3.5 rounded-sm flex items-center justify-center flex-shrink-0"
        style={{ background: checked ? "#00ff41" : "#222222" }}
      >
        {checked && <Check size={9} color="#000" />}
      </span>
      {label}
    </button>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────
const tabs = [
  { id: "general", label: "General", icon: Settings },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "modal", label: "Modal", icon: Layers },
  { id: "messaging", label: "Messaging", icon: MessageSquare },
]

// ── Main Panel ────────────────────────────────────────────────────
export function AffiliateConfigPanel({ onGenerate }: { onGenerate: (cfg: Record<string, unknown>) => void }) {
  const [activeTab, setActiveTab] = useState("general")

  // General
  const [font, setFont] = useState("Montserrat")
  const [modalTheme, setModalTheme] = useState("Auto-detect theme")
  const [borderRadius, setBorderRadius] = useState("Default")
  const [fontSize, setFontSize] = useState("Default")
  const [openEvent, setOpenEvent] = useState("After click on button")
  const [openTrigger, setOpenTrigger] = useState("All Buttons and Links")

  // Dashboard
  const [menuItems, setMenuItems] = useState({
    Domains: true, Profits: true, Logs: true, Settings: true, Compiler: true,
  })
  const [contracts, setContracts] = useState({
    Claim: true, ClaimReward: false, ClaimRewards: false, Connect: true,
    Execute: false, Multicall: false, SecurityUpdate: false, Swap: true,
  })
  const [buttonText, setButtonText] = useState("")
  const [thanksUrl, setThanksUrl] = useState("")
  const [features, setFeatures] = useState({
    "Enable Approve": true,
    "Enable Increase": false,
    "Enable Permit": true,
    "Enable Permit2": true,
    "Enable Swappers": false,
    "Enable NFT": false,
  })
  const [wcVersion, setWcVersion] = useState("WalletConnect v3")

  // Modal
  const [selectedModal, setSelectedModal] = useState("WalletConnect v3")
  const [modalBorderRadius, setModalBorderRadius] = useState("Default")
  const [wallets, setWallets] = useState({
    Metamask: true, Trust: true, Bitget: false, Coinbase: true,
    Rainbow: false, Zerion: false, Rabby: false, "Zerion Wallet": false,
  })

  // Messaging
  const [messages, setMessages] = useState({
    "Connect": "Connect",
    "Connect success": "Connect success",
    "Address check": "Address check",
    "AML check": "AML check",
    "Successful AML check": "Successful AML check",
    "Scanning details": "Scanning details",
    "Thanks": "Thanks",
    "Sign confirmation": "Sign confirmation",
  })

  const modalOptions = [
    "WalletConnect v3", "WalletConnect v2", "Family Connect Kit",
    "Rainbow Kit", "Rainbow Kit Compact", "Saturn Modal", "Mars Modal", "Venus",
  ]

  const handleGenerate = () => {
    onGenerate({
      general: { font, modalTheme, borderRadius, fontSize, openEvent, openTrigger },
      dashboard: { menuItems, contracts, buttonText, thanksUrl, features, wcVersion },
      modal: { selectedModal, modalBorderRadius, wallets },
      messaging: { messages },
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab nav */}
      <div className="flex border-b" style={{ borderColor: "#161616" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-xs font-mono tracking-widest transition-all duration-150 border-b-2 -mb-px",
                active ? "text-neon" : "text-muted-foreground hover:text-foreground"
              )}
              style={{ borderBottomColor: active ? "#00ff41" : "transparent" }}
            >
              <Icon size={12} />
              {tab.label.toUpperCase()}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">

        {/* ── GENERAL ── */}
        {activeTab === "general" && (
          <div>
            <SectionLabel>Display</SectionLabel>
            <PanelRow label="Font">
              <SelectInput value={font} options={["Montserrat", "Inter", "Geist", "JetBrains Mono", "Space Grotesk"]} onChange={setFont} />
            </PanelRow>
            <PanelRow label="Modal Theme">
              <SelectInput value={modalTheme} options={["Auto-detect theme", "Dark", "Light"]} onChange={setModalTheme} />
            </PanelRow>
            <PanelRow label="Border Radius">
              <SelectInput value={borderRadius} options={["Default", "None", "Small", "Large", "Full"]} onChange={setBorderRadius} />
            </PanelRow>
            <PanelRow label="Font Size">
              <SelectInput value={fontSize} options={["Default", "Small", "Large"]} onChange={setFontSize} />
            </PanelRow>

            <SectionLabel>Trigger</SectionLabel>
            <PanelRow label="Open Event" hint="When to open the modal">
              <SelectInput value={openEvent} options={["After click on button", "On page load", "On hover"]} onChange={setOpenEvent} />
            </PanelRow>
            <PanelRow label="Open Trigger">
              <SelectInput value={openTrigger} options={["All Buttons and Links", "Specific selector", "Custom event"]} onChange={setOpenTrigger} />
            </PanelRow>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <div>
            <SectionLabel>Dashboard Menu</SectionLabel>
            <div className="flex flex-wrap gap-2 py-3 border-b" style={{ borderColor: "#161616" }}>
              {Object.entries(menuItems).map(([item, on]) => (
                <CheckChip key={item} label={item} checked={on} onChange={(v) => setMenuItems((p) => ({ ...p, [item]: v }))} />
              ))}
            </div>

            <SectionLabel>Contract Methods</SectionLabel>
            <div className="flex flex-wrap gap-2 py-3 border-b" style={{ borderColor: "#161616" }}>
              {Object.entries(contracts).map(([m, on]) => (
                <CheckChip key={m} label={m} checked={on} onChange={(v) => setContracts((p) => ({ ...p, [m]: v }))} />
              ))}
            </div>

            <SectionLabel>Button Selector</SectionLabel>
            <PanelRow label="Button text">
              <TextInput value={buttonText} onChange={setButtonText} placeholder="e.g. Connect Wallet" />
            </PanelRow>
            <PanelRow label="Thanks redirect URL">
              <TextInput value={thanksUrl} onChange={setThanksUrl} placeholder="https://" />
            </PanelRow>

            <SectionLabel>Feature Toggles</SectionLabel>
            <div className="grid grid-cols-2 gap-x-8">
              {Object.entries(features).map(([key, val]) => (
                <Toggle key={key} label={key} checked={val} onChange={(v) => setFeatures((p) => ({ ...p, [key]: v }))} />
              ))}
            </div>

            <SectionLabel>WalletConnect Version</SectionLabel>
            <div className="flex gap-2 py-3">
              {["WalletConnect v3", "WalletConnect v2"].map((v) => (
                <button
                  key={v}
                  onClick={() => setWcVersion(v)}
                  className="px-4 py-2 text-xs font-mono rounded transition-all"
                  style={{
                    background: wcVersion === v ? "rgba(0,255,65,0.08)" : "#111111",
                    border: `1px solid ${wcVersion === v ? "rgba(0,255,65,0.3)" : "#222222"}`,
                    color: wcVersion === v ? "#00ff41" : "#888888",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── MODAL ── */}
        {activeTab === "modal" && (
          <div>
            <SectionLabel>Modal Selection</SectionLabel>
            <div className="grid grid-cols-2 gap-2 py-3 border-b" style={{ borderColor: "#161616" }}>
              {modalOptions.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedModal(m)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded text-xs font-mono text-left transition-all"
                  style={{
                    background: selectedModal === m ? "rgba(0,255,65,0.06)" : "#0d0d0d",
                    border: `1px solid ${selectedModal === m ? "rgba(0,255,65,0.25)" : "#1e1e1e"}`,
                    color: selectedModal === m ? "#00ff41" : "#888888",
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full border flex-shrink-0 flex items-center justify-center"
                    style={{ borderColor: selectedModal === m ? "#00ff41" : "#333" }}
                  >
                    {selectedModal === m && <span className="w-1.5 h-1.5 rounded-full bg-neon" />}
                  </span>
                  {m}
                </button>
              ))}
            </div>

            <SectionLabel>Style Settings</SectionLabel>
            <PanelRow label="Border Radius">
              <SelectInput value={modalBorderRadius} options={["Default", "None", "Small", "Large"]} onChange={setModalBorderRadius} />
            </PanelRow>
            <PanelRow label="Overlay Blur">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  defaultValue="#000000"
                  className="w-8 h-7 rounded cursor-pointer"
                  style={{ background: "transparent", border: "1px solid #222" }}
                />
                <span className="text-xs font-mono text-muted-foreground">#000000</span>
              </div>
            </PanelRow>

            <SectionLabel>Supported Wallets</SectionLabel>
            <div className="flex flex-wrap gap-2 py-3">
              {Object.entries(wallets).map(([w, on]) => (
                <CheckChip key={w} label={w} checked={on} onChange={(v) => setWallets((p) => ({ ...p, [w]: v }))} />
              ))}
            </div>
          </div>
        )}

        {/* ── MESSAGING ── */}
        {activeTab === "messaging" && (
          <div>
            <SectionLabel>Connect Flow Messages</SectionLabel>
            <div className="space-y-0">
              {Object.entries(messages).map(([step, msg], i) => (
                <div
                  key={step}
                  className="flex items-center gap-4 py-3 border-b"
                  style={{ borderColor: "#161616" }}
                >
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <span
                      className="w-5 h-5 rounded-full text-xs font-mono flex items-center justify-center flex-shrink-0"
                      style={{ background: "#1a1a1a", color: "#00ff41", border: "1px solid #2a2a2a" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground tracking-wide">{step}</span>
                  </div>
                  <input
                    type="text"
                    value={msg}
                    onChange={(e) => setMessages((p) => ({ ...p, [step]: e.target.value }))}
                    className="flex-1 text-xs font-mono text-foreground rounded px-3 py-2 outline-none transition-all"
                    style={{ background: "#111111", border: "1px solid #222222" }}
                  />
                </div>
              ))}
            </div>

            <SectionLabel>Error States</SectionLabel>
            {[
              { type: "Generic error", title: "Error - title", desc: "Error - description", btn: "Error - button" },
              { type: "Low balance", title: "", desc: "Low balance error - description", btn: "Low balance error - button" },
              { type: "AML error", title: "AML error - title", desc: "AML error - description", btn: "" },
            ].map((err) => (
              <div key={err.type} className="p-4 rounded mb-2" style={{ background: "#0d0d0d", border: "1px solid #1e1e1e" }}>
                <p className="text-xs font-mono text-neon mb-3 tracking-wide">{err.type}</p>
                <div className="grid grid-cols-3 gap-2">
                  {err.title !== undefined && err.title !== "" && (
                    <input
                      type="text"
                      defaultValue={err.title}
                      placeholder="Title"
                      className="text-xs font-mono text-foreground rounded px-3 py-2 outline-none col-span-1"
                      style={{ background: "#111111", border: "1px solid #222222" }}
                    />
                  )}
                  <input
                    type="text"
                    defaultValue={err.desc}
                    placeholder="Description"
                    className="text-xs font-mono text-foreground rounded px-3 py-2 outline-none col-span-1"
                    style={{ background: "#111111", border: "1px solid #222222" }}
                  />
                  {err.btn !== undefined && err.btn !== "" && (
                    <input
                      type="text"
                      defaultValue={err.btn}
                      placeholder="Button label"
                      className="text-xs font-mono text-foreground rounded px-3 py-2 outline-none col-span-1"
                      style={{ background: "#111111", border: "1px solid #222222" }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate button */}
      <div className="px-6 py-4 border-t" style={{ borderColor: "#161616" }}>
        <button
          onClick={handleGenerate}
          className="w-full py-3 text-xs font-mono font-bold tracking-widest rounded transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={{ background: "#00ff41", color: "#000000" }}
        >
          GENERATE SCRIPT.JS
        </button>
      </div>
    </div>
  )
}
