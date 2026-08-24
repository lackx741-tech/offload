"use client";

import type { ErrorState, MessageStep, ModalSettings } from "@/components/affiliate/legacy-types";

const walletOptions = ["MetaMask", "Coinbase", "WalletConnect", "Trust", "Rainbow", "Ledger", "Phantom"];

export function LegacyModalTab({
  settings,
  onChange,
  messageSteps,
  onMessageChange,
  errorStates,
  onErrorChange,
}: {
  settings: ModalSettings;
  onChange: (settings: ModalSettings) => void;
  messageSteps: MessageStep[];
  onMessageChange: (steps: MessageStep[]) => void;
  errorStates: ErrorState[];
  onErrorChange: (states: ErrorState[]) => void;
}) {
  const toggleWallet = (wallet: string) => {
    const supportedWallets = settings.supportedWallets.includes(wallet)
      ? settings.supportedWallets.filter((item) => item !== wallet)
      : [...settings.supportedWallets, wallet];
    onChange({ ...settings, supportedWallets });
  };

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <div style={{ background: "#fff", border: "1px solid rgba(64, 54, 88, 0.08)", borderRadius: 28, padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 22, color: "#2a2732", marginBottom: 16 }}>Compiler</div>
        <div style={{ fontSize: 13, color: "#9a96a7", marginBottom: 20 }}>
          Select modal defaults, wallet choices, and message copy for the affiliate compiler flow.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 20 }}>
          <label>
            <div style={{ fontSize: 12, color: "#8f8a97", marginBottom: 8, fontWeight: 700 }}>Border Radius</div>
            <input
              type="range"
              min={0}
              max={24}
              value={settings.borderRadius}
              onChange={(event) => onChange({ ...settings, borderRadius: Number(event.target.value) })}
              style={{ width: "100%" }}
            />
          </label>
          <label>
            <div style={{ fontSize: 12, color: "#8f8a97", marginBottom: 8, fontWeight: 700 }}>Overlay Blur</div>
            <input
              type="range"
              min={0}
              max={24}
              value={settings.overlayBlur}
              onChange={(event) => onChange({ ...settings, overlayBlur: Number(event.target.value) })}
              style={{ width: "100%" }}
            />
          </label>
          <label>
            <div style={{ fontSize: 12, color: "#8f8a97", marginBottom: 8, fontWeight: 700 }}>Accent Color</div>
            <input type="color" value={settings.accentColor} onChange={(event) => onChange({ ...settings, accentColor: event.target.value })} />
          </label>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "#8f8a97", marginBottom: 8, fontWeight: 700 }}>Supported Wallets</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {walletOptions.map((wallet) => {
              const selected = settings.supportedWallets.includes(wallet);
              return (
                <button
                  key={wallet}
                  onClick={() => toggleWallet(wallet)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: "1px solid rgba(64, 54, 88, 0.08)",
                    background: selected ? "#766ef5" : "#fbfaf8",
                    color: selected ? "#fff" : "#555166",
                    cursor: "pointer",
                  }}
                >
                  {wallet}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {messageSteps.slice(0, 3).map((step) => (
            <input
              key={step.id}
              value={step.text}
              onChange={(event) =>
                onMessageChange(messageSteps.map((item) => (item.id === step.id ? { ...item, text: event.target.value } : item)))
              }
              style={{
                width: "100%",
                background: "#fbfaf8",
                border: "1px solid rgba(64, 54, 88, 0.08)",
                borderRadius: 14,
                padding: "13px 14px",
                color: "#332f3d",
                fontSize: 14,
                outline: "none",
              }}
            />
          ))}
          {errorStates.length ? (
            <input
              value={errorStates[0].title}
              onChange={(event) =>
                onErrorChange(errorStates.map((item, index) => (index === 0 ? { ...item, title: event.target.value } : item)))
              }
              style={{
                width: "100%",
                background: "#fbfaf8",
                border: "1px solid rgba(64, 54, 88, 0.08)",
                borderRadius: 14,
                padding: "13px 14px",
                color: "#332f3d",
                fontSize: 14,
                outline: "none",
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
