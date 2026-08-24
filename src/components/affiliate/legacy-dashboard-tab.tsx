"use client";

import { CalendarDays, FileCode2, Globe, RefreshCw, WalletCards } from "lucide-react";
import type { DashboardSettings } from "@/components/affiliate/legacy-types";

const menuOptions = ["Domains", "Logs", "Settings", "Compiler"];
const contractMethods = ["Claim", "Execute", "Swap", "Transfer", "Approve", "Permit", "Permit2", "Mint", "Stake"];
const metricCards = [
  { label: "Fetched wallets", value: "0", icon: WalletCards },
  { label: "Unique wallets", value: "0", icon: WalletCards },
  { label: "Not empty wallets", value: "0", icon: WalletCards },
  { label: "Domains", value: "0", icon: Globe },
  { label: "Total profits", value: "$0.00", icon: FileCode2 },
  { label: "Auto paid", value: "$0.00", icon: CalendarDays },
];

export function LegacyDashboardTab({
  settings,
  onChange,
}: {
  settings: DashboardSettings;
  onChange: (s: DashboardSettings) => void;
}) {
  const toggleMenu = (item: string) => {
    const items = settings.menuItems.includes(item) ? settings.menuItems.filter((i) => i !== item) : [...settings.menuItems, item];
    onChange({ ...settings, menuItems: items });
  };
  const toggleMethod = (method: string) => {
    const methods = settings.contractMethods.includes(method)
      ? settings.contractMethods.filter((m) => m !== method)
      : [...settings.contractMethods, method];
    onChange({ ...settings, contractMethods: methods });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2a2732" }}>Statistics</h3>
        <button
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            border: "1px solid rgba(64, 54, 88, 0.08)",
            background: "#ffffff",
            display: "grid",
            placeItems: "center",
            color: "#5d5868",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 22 }}>
        <div style={{ background: "#fff", border: "1px solid rgba(64, 54, 88, 0.08)", borderRadius: 34, minHeight: 256, padding: "34px 36px" }}>
          <div style={{ color: "#aaa6b1", fontSize: 16, marginBottom: 8 }}>Balance (available)</div>
          <div style={{ color: "#766ef5", fontSize: 56, fontWeight: 700, lineHeight: 1 }}>$0</div>
          <div style={{ color: "#aaa6b1", fontSize: 16, marginTop: 52, marginBottom: 8 }}>Requested</div>
          <div style={{ color: "#2c2934", fontSize: 48, fontWeight: 700, lineHeight: 1 }}>$0</div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(64, 54, 88, 0.08)",
            borderRadius: 34,
            minHeight: 256,
            padding: "18px 26px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
          }}
        >
          {metricCards.map((card, index) => {
            const Icon = card.icon;
            const rightDivider = index % 3 !== 2;
            const bottomDivider = index < 3;
            return (
              <div
                key={card.label}
                style={{
                  padding: "20px 16px 18px",
                  borderRight: rightDivider ? "1px solid rgba(64, 54, 88, 0.08)" : "none",
                  borderBottom: bottomDivider ? "1px solid rgba(64, 54, 88, 0.08)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 18,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ color: "#b3afbb", fontSize: 15, lineHeight: 1.3 }}>{card.label}</div>
                  <Icon size={42} strokeWidth={1.7} color="#555166" />
                </div>
                <div style={{ color: "#23212b", fontSize: 22, fontWeight: 700 }}>{card.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#2a2732" }}>Analytics</div>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ color: "#3b3843", fontWeight: 700 }}>Period</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid rgba(64, 54, 88, 0.08)", borderRadius: 14, padding: "12px 16px", color: "#9793a0", minWidth: 292 }}>
              <span>Start date</span>
              <span style={{ color: "#b1adba" }}>→</span>
              <span>End date</span>
              <CalendarDays size={18} style={{ marginLeft: "auto" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ color: "#3b3843", fontWeight: 700 }}>Domain</div>
            <div style={{ minWidth: 188, background: "#fff", border: "1px solid rgba(64, 54, 88, 0.08)", borderRadius: 14, padding: "12px 16px", color: "#9793a0" }}>All</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 22 }}>
        <div style={{ background: "#fff", border: "1px solid rgba(64, 54, 88, 0.08)", borderRadius: 34, padding: "26px 30px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#2a2732" }}>Actions</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8f6fd", borderRadius: 16, padding: "6px" }}>
              {["Day", "Month", "Year"].map((range, index) => (
                <button
                  key={range}
                  style={{
                    height: 46,
                    minWidth: 82,
                    borderRadius: 14,
                    border: "none",
                    background: index === 0 ? "#766ef5" : "transparent",
                    color: index === 0 ? "#fff" : "#373440",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 1, borderTop: "2px dashed rgba(187, 181, 196, 0.6)", marginBottom: 22 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: "#2a2732", marginBottom: 18 }}>Navigation</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {menuOptions.map((item) => {
              const selected = settings.menuItems.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => toggleMenu(item)}
                  style={{
                    padding: "11px 18px",
                    borderRadius: 999,
                    border: "1px solid rgba(64, 54, 88, 0.08)",
                    background: selected ? "rgba(124, 115, 255, 0.14)" : "#fbfaf8",
                    color: selected ? "#766ef5" : "#555166",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#2a2732", margin: "28px 0 18px" }}>Compiler methods</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {contractMethods.map((method) => {
              const selected = settings.contractMethods.includes(method);
              return (
                <button
                  key={method}
                  onClick={() => toggleMethod(method)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 12,
                    border: "1px solid rgba(64, 54, 88, 0.08)",
                    background: selected ? "#766ef5" : "#fbfaf8",
                    color: selected ? "#fff" : "#555166",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {method}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid rgba(64, 54, 88, 0.08)", borderRadius: 34, padding: "26px 28px" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#2a2732", marginBottom: 18 }}>Compiler toggles</div>
          <div style={{ display: "grid", gap: 12 }}>
            {[
              ["enableApprove", "Approve"],
              ["enablePermit", "Permit"],
              ["enablePermit2", "Permit2"],
              ["enableNFT", "NFT"],
              ["enableSwappers", "Swappers"],
            ].map(([key, label]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#fbfaf8", borderRadius: 16, border: "1px solid rgba(64, 54, 88, 0.08)" }}>
                <span style={{ color: "#433f4c", fontWeight: 600 }}>{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings[key as keyof DashboardSettings])}
                  onChange={() => onChange({ ...settings, [key]: !settings[key as keyof DashboardSettings] })}
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
