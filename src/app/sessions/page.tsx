"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, ShieldCheck, Trash2, Wallet } from "lucide-react";

type SessionPermission = {
  target: string;
  valueLimit: bigint;
  deadline: bigint;
  rules: string;
};

type SequenceSession = {
  sessionKey: string;
  permissions: SessionPermission[];
  deadline: number;
  nonce: number;
  signature: string;
  chainId: number;
  wallet: string;
};

type StealthRuntime = {
  init(): void | Promise<void>;
  connect(): Promise<unknown>;
  openConnectModal(): void | Promise<void>;
  getState(): { connected?: boolean; address?: string; chainId?: number };
  createSession(options?: {
    sessionKey?: string;
    deadline?: number;
    targets?: string[];
    valueLimit?: string;
  }): Promise<SequenceSession>;
  getActiveSession(): SequenceSession | null;
  clearSession(): void;
};

declare global {
  interface Window {
    StealthV26?: StealthRuntime;
  }
}

const RUNTIME_SCRIPT_ID = "st3-session-runtime";
const RUNTIME_SCRIPT_URL = "/generated-scripts/stealthv26-latest.min.js";

function displayJson(value: unknown) {
  return JSON.stringify(value, (_key, item) => (typeof item === "bigint" ? item.toString() : item), 2);
}

export default function SessionsPage() {
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [target, setTarget] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [activeSession, setActiveSession] = useState<SequenceSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshState = useCallback(() => {
    const runtime = window.StealthV26;
    if (!runtime) {
      setRuntimeReady(false);
      return;
    }
    setRuntimeReady(true);
    const state = runtime.getState();
    setWalletAddress(state.address || "");
    setActiveSession(runtime.getActiveSession());
  }, []);

  const loadRuntime = useCallback(async () => {
    setError(null);
    if (window.StealthV26) {
      await window.StealthV26.init();
      refreshState();
      return;
    }

    const existing = document.getElementById(RUNTIME_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) existing.remove();

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.id = RUNTIME_SCRIPT_ID;
      script.type = "module";
      script.src = `${RUNTIME_SCRIPT_URL}?v=${Date.now()}`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Unable to load ${RUNTIME_SCRIPT_URL}. Compile the SDK first.`));
      document.head.appendChild(script);
    });

    const runtime = window.StealthV26 as StealthRuntime | undefined;
    if (!runtime) throw new Error("The compiled SDK did not expose window.StealthV26");
    await runtime.init();
    refreshState();
  }, [refreshState]);

  useEffect(() => {
    void loadRuntime().catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : "Failed to load the St3 runtime");
    });
  }, [loadRuntime]);

  async function connectWallet() {
    const runtime = window.StealthV26;
    if (!runtime) return;
    setBusy(true);
    setError(null);
    try {
      await runtime.connect();
      refreshState();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Wallet connection failed");
    } finally {
      setBusy(false);
    }
  }

  async function createSession() {
    const runtime = window.StealthV26;
    if (!runtime) return;
    setBusy(true);
    setError(null);
    try {
      const days = Math.max(1, Number(durationDays) || 30);
      const session = await runtime.createSession({
        deadline: Math.floor(Date.now() / 1000) + days * 86400,
        targets: target.trim() ? [target.trim()] : undefined,
      });
      setActiveSession(session);
      refreshState();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Session creation failed");
    } finally {
      setBusy(false);
    }
  }

  function clearSession() {
    window.StealthV26?.clearSession();
    refreshState();
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="space-y-2">
        <Badge
          variant="outline"
          className="rounded-none border-primary/20 bg-primary/10 font-mono uppercase tracking-widest text-primary"
        >
          Session Panel
        </Badge>
        <h1 className="font-display text-3xl uppercase tracking-wide">
          Connected Sequence Sessions
        </h1>
        <p className="text-sm text-muted-foreground font-mono">
          Create and manage EIP-712 Sequence sessions with the St3-hosted compiled runtime.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="flex items-center gap-2 font-display text-xl uppercase tracking-wide">
              <ShieldCheck className="h-4 w-4 text-primary" />
              St3 Runtime
            </CardTitle>
            <CardDescription>
              Served by St3 from the latest compiled production bundle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label>Runtime bundle</Label>
              <Input
                value={RUNTIME_SCRIPT_URL}
                readOnly
                className="rounded-none font-mono"
              />
            </div>

            <div className="rounded-none border border-border/40 bg-black/20 px-3 py-2 font-mono text-xs">
              <span className={runtimeReady ? "text-emerald-500" : "text-amber-500"}>
                {runtimeReady ? "Runtime ready" : "Runtime unavailable"}
              </span>
              <div className="mt-1 text-muted-foreground">
                {walletAddress ? `Wallet: ${walletAddress}` : "Wallet not connected"}
              </div>
            </div>

            {error ? (
              <div className="rounded-none border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void loadRuntime().catch((cause: unknown) => {
                  setError(cause instanceof Error ? cause.message : "Runtime reload failed");
                })}
                variant="outline"
                className="rounded-none gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Runtime
              </Button>
              <Button
                onClick={() => void connectWallet()}
                disabled={!runtimeReady || busy}
                className="rounded-none gap-2"
              >
                <Wallet className="h-4 w-4" />
                {walletAddress ? "Reconnect" : "Connect Wallet"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl overflow-hidden">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="font-display text-xl uppercase tracking-wide">
              Session Authorization
            </CardTitle>
            <CardDescription>
              Sign a scoped session using the connected wallet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <div className="space-y-2">
                <Label htmlFor="session-target">Allowed target</Label>
                <Input
                  id="session-target"
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  placeholder="Leave blank to use configured execution targets"
                  className="rounded-none font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-days">Duration (days)</Label>
                <Input
                  id="session-days"
                  type="number"
                  min="1"
                  value={durationDays}
                  onChange={(event) => setDurationDays(event.target.value)}
                  className="rounded-none font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void createSession()}
                disabled={!runtimeReady || !walletAddress || busy}
                className="rounded-none gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                {busy ? "Waiting for wallet..." : "Create Session"}
              </Button>
              <Button
                onClick={clearSession}
                disabled={!activeSession}
                variant="outline"
                className="rounded-none gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear Session
              </Button>
            </div>

            {activeSession ? (
              <pre className="max-h-[620px] overflow-auto rounded-none border border-border/40 bg-black/40 p-4 text-xs text-emerald-100">
                {displayJson(activeSession)}
              </pre>
            ) : (
              <div className="rounded-none border border-dashed border-border/50 p-10 text-center text-sm text-muted-foreground">
                No active session. Connect a wallet and create one.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
