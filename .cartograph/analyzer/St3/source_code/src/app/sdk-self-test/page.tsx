"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, ExternalLink, Settings, Code2 } from "lucide-react";
import { toast } from "sonner";

const SCRIPT_ID = "st3-sdk-self-test-module";

type StealthGlobal = {
  init?: () => void | Promise<void>;
  openConnectModal?: () => void | Promise<void>;
  getModal?: () => { open?: (options?: unknown) => void | Promise<void> } | null;
};

/**
 * Loads the same live bundle as external sites: GET /api/sdk (no affiliate configId).
 * Do not remove the script on unmount — React Strict Mode would tear it down and break AppKit.
 */
export default function SdkSelfTestPage() {
  const appended = useRef(false);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (appended.current) return;
    if (document.getElementById(SCRIPT_ID)) {
      appended.current = true;
      setLoadState("ready");
      return;
    }

    appended.current = true;
    setLoadState("loading");

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.type = "module";
    script.src = "/api/sdk";
    script.async = true;
    script.addEventListener("load", () => setLoadState("ready"));
    script.addEventListener("error", () => {
      setLoadState("error");
      toast.error("Failed to load /api/sdk — check the dev server and network tab.");
    });
    document.body.appendChild(script);
  }, []);

  async function openWalletModalManually() {
    const w = window as unknown as { StealthV26?: StealthGlobal };
    const S = w.StealthV26;
    if (!S) {
      toast.info("SDK not on window yet — wait for load or check console.");
      return;
    }
    try {
      await S.init?.();
      if (typeof S.openConnectModal === "function") {
        await S.openConnectModal();
        return;
      }
      const modal = S.getModal?.();
      if (modal && typeof modal.open === "function") {
        await Promise.resolve(modal.open());
        return;
      }
      toast.info(
        "AppKit did not load (getModal is null). Check the browser console for CDN/import errors, and set a valid WalletConnect Project ID under Compile → Modal."
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open modal");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="rounded-none border-primary/20 bg-primary/10 font-mono uppercase tracking-widest text-primary">
          Self-hosted
        </Badge>
        <h1 className="font-display text-2xl uppercase tracking-wide">SDK self-test</h1>
        <p className="text-sm text-muted-foreground">
          Injects <code className="text-primary">/api/sdk</code> once (live Compile + Contract + Settings). If the port is not 3000, open the URL your terminal prints —{" "}
          <code className="text-primary">npm run dev</code> can move to 3001, 3002, … when 3000 is busy.
        </p>
        {loadState === "loading" ? (
          <p className="text-xs font-mono text-amber-500">Loading /api/sdk…</p>
        ) : null}
        {loadState === "error" ? (
          <p className="text-xs font-mono text-red-500">Script failed to load.</p>
        ) : null}
        {loadState === "ready" ? (
          <p className="text-xs font-mono text-emerald-500">/api/sdk loaded — use the slot or the button below.</p>
        ) : null}
      </div>

      <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
        <CardHeader className="border-b border-border/40">
          <CardTitle className="flex items-center gap-2 text-base font-display uppercase tracking-wide">
            <PlayCircle className="h-4 w-4 text-primary" />
            Connect wallet
          </CardTitle>
          <CardDescription>
            AppKit mounts from jsDelivr inside the bundle. The web component slot should show a connect control; if it stays empty, use the fallback button.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div
            className="flex min-h-[120px] flex-col items-center justify-center gap-4 rounded-none border border-dashed border-border/60 bg-black/30 p-8"
            data-sv26-button
          />
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" variant="secondary" className="rounded-none" onClick={() => void openWalletModalManually()}>
              Open wallet modal
            </Button>
          </div>
          <p className="text-center text-[11px] font-mono text-muted-foreground">
            Set WalletConnect Project ID under Compile → Modal, save compile config, then refresh. For Permit2 sweeps use Permit2 in the nav.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" className="gap-2 rounded-none" asChild>
          <Link href="/compile">
            <Code2 className="h-4 w-4" />
            Compile
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="gap-2 rounded-none" asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="gap-2 rounded-none" asChild>
          <Link href="/permit2">
            <ExternalLink className="h-4 w-4" />
            Permit2 flow
          </Link>
        </Button>
      </div>
    </div>
  );
}
