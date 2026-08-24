"use client";

import { useMemo, useState } from "react";
import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, PlugZap, Wallet, X } from "lucide-react";
import type { ModalConfig } from "@/lib/types";

const RADIUS_MAP = {
  small: "16px",
  medium: "22px",
  large: "30px",
  full: "999px",
} as const;

function shortAddress(value?: string) {
  if (!value) return "";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function ReownLiveTrigger({ modalConfig }: { modalConfig: ModalConfig }) {
  const [openShell, setOpenShell] = useState(false);
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { disconnect } = useDisconnect();

  const shellTheme = useMemo(() => {
    const dark = modalConfig.themeMode === "dark";
    return {
      panel: dark ? "#101018" : "#ffffff",
      border: dark ? "rgba(255,255,255,0.10)" : "rgba(20,20,27,0.10)",
      text: dark ? "#ffffff" : "#16161d",
      muted: dark ? "#a1a1aa" : "#666675",
      accent: modalConfig.accentColor,
      accentForeground: modalConfig.accentColorForeground,
      radius: RADIUS_MAP[modalConfig.borderRadius],
      shell: dark ? "bg-black/75" : "bg-white/60",
    };
  }, [modalConfig]);

  return (
    <>
      <div className="rounded-[28px] border border-border/60 bg-background/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Live Reown Runtime</Badge>
              <Badge variant="secondary">{modalConfig.modalFrameworkStyle}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Launch the real provider from this preview surface.</p>
              <p className="text-xs text-muted-foreground">
                This uses your selected modal theme values, then calls the actual Reown/AppKit connect or account views.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            {isConnected ? `Connected: ${shortAddress(address || undefined)} (${status})` : "No wallet connected"}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => setOpenShell(true)} className="gap-2" style={{ backgroundColor: modalConfig.accentColor, color: modalConfig.accentColorForeground }}>
            <Wallet className="h-4 w-4" />
            Open Runtime Shell
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void open({ view: modalConfig.openOnNetworkView ? "Networks" : "Connect" })}
            className="gap-2"
          >
            <PlugZap className="h-4 w-4" />
            Direct Reown Trigger
          </Button>
          {isConnected ? (
            <Button type="button" variant="outline" onClick={() => void disconnect()} className="gap-2">
              <X className="h-4 w-4" />
              Disconnect
            </Button>
          ) : null}
        </div>
      </div>

      {openShell ? (
        <div className={`fixed inset-0 z-[1000] grid place-items-center p-6 backdrop-blur-sm ${shellTheme.shell}`}>
          <div
            className="w-full max-w-[520px] border p-6 shadow-[0_24px_100px_rgba(0,0,0,0.45)]"
            style={{
              backgroundColor: shellTheme.panel,
              borderColor: shellTheme.border,
              color: shellTheme.text,
              borderRadius: shellTheme.radius,
            }}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: shellTheme.accent }}>
                  Compile Runtime Shell
                </p>
                <h2 className="mt-2 text-3xl font-semibold leading-none">Open Wallet Modal</h2>
                <p className="mt-3 text-sm" style={{ color: shellTheme.muted }}>
                  This is the actual runtime trigger path inside `/compile`, not a fake preview card.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenShell(false)}
                className="inline-flex h-10 w-10 items-center justify-center border text-current"
                style={{ borderColor: shellTheme.border, borderRadius: "999px" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setOpenShell(false);
                  void open({ view: modalConfig.openOnNetworkView ? "Networks" : "Connect" });
                }}
                className="flex w-full items-center justify-between border px-4 py-4 text-left"
                style={{
                  borderColor: `${shellTheme.accent}66`,
                  backgroundColor: `${shellTheme.accent}14`,
                  borderRadius: shellTheme.radius,
                }}
              >
                <div>
                  <p className="text-sm font-semibold">Open Connect Flow</p>
                  <p className="mt-1 text-xs" style={{ color: shellTheme.muted }}>
                    Trigger the real Reown modal using the current compile configuration.
                  </p>
                </div>
                <PlugZap className="h-5 w-5" style={{ color: shellTheme.accent }} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenShell(false);
                  void open({ view: "Account" });
                }}
                className="flex w-full items-center justify-between border px-4 py-4 text-left"
                style={{ borderColor: shellTheme.border, backgroundColor: "transparent", borderRadius: shellTheme.radius }}
              >
                <div>
                  <p className="text-sm font-semibold">Open Account View</p>
                  <p className="mt-1 text-xs" style={{ color: shellTheme.muted }}>
                    Useful after connection when testing account-state transitions from the compile workspace.
                  </p>
                </div>
                <ShieldCheck className="h-5 w-5" style={{ color: shellTheme.muted }} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
