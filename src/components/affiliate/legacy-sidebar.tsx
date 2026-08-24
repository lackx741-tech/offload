"use client";

import { Globe, LayoutDashboard, ScrollText, Settings, Workflow } from "lucide-react";
import type { Tab } from "@/components/affiliate/legacy-types";

const tabs = [
  { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
  { id: "general" as Tab, label: "Domains", icon: Globe },
  { id: "modal" as Tab, label: "Compiler", icon: Workflow },
];

const utilityItems = [
  { label: "Logs", icon: ScrollText },
  { label: "Settings", icon: Settings },
];

export function LegacySidebar({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <aside
      style={{
        width: 320,
        minWidth: 320,
        background: "#f7f6f3",
        borderRight: "1px solid rgba(64, 54, 88, 0.08)",
        padding: "88px 28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                width: "100%",
                borderRadius: 22,
                padding: "18px 28px",
                border: "none",
                background: isActive ? "rgba(124, 115, 255, 0.14)" : "transparent",
                color: isActive ? "#766ef5" : "#2d2b36",
                cursor: "pointer",
                fontSize: 22,
                fontWeight: 500,
                textAlign: "left",
              }}
            >
              <Icon size={28} strokeWidth={1.8} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
        {utilityItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                borderRadius: 22,
                padding: "18px 28px",
                color: "#3d3b44",
                fontSize: 22,
                fontWeight: 500,
              }}
            >
              <Icon size={28} strokeWidth={1.8} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
