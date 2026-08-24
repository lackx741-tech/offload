"use client";

import { Bell, CircleUserRound, Search } from "lucide-react";

export function LegacyTopNav({
  walletConnected,
  walletAddress,
  onConnect,
}: {
  walletConnected: boolean;
  walletAddress: string;
  onConnect: () => void;
}) {
  return (
    <header
      style={{
        height: 66,
        background: "#f7f6f3",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px 0 28px",
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9b96a4", fontWeight: 700 }}>
        Affiliate Workspace
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {[Search, Bell].map((Icon, index) => (
          <button
            key={index}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              border: "1px solid rgba(64, 54, 88, 0.08)",
              background: "#ffffff",
              display: "grid",
              placeItems: "center",
              color: "#676372",
              cursor: "pointer",
            }}
          >
            <Icon size={18} />
          </button>
        ))}
        <button
          onClick={walletConnected ? undefined : onConnect}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderRadius: 16,
            border: "1px solid rgba(64, 54, 88, 0.08)",
            background: "#ffffff",
            padding: "10px 14px",
            color: "#2d2b36",
            cursor: walletConnected ? "default" : "pointer",
          }}
        >
          <CircleUserRound size={20} color="#766ef5" />
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {walletConnected ? walletAddress : "Connect wallet"}
          </span>
        </button>
      </div>
    </header>
  );
}
