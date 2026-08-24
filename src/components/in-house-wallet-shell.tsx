"use client";

import { useState } from "react";
import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, X, PlugZap, ShieldCheck } from "lucide-react";

function shortAddress(value?: string) {
  if (!value) return "";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function InHouseWalletShell() {
  const [openShell, setOpenShell] = useState(false);
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { disconnect } = useDisconnect();

  return (
    <>
      <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
        <CardHeader className="border-b border-border/40">
          <Badge variant="outline" className="w-fit rounded-none border-primary/20 bg-primary/10 font-mono uppercase tracking-widest text-primary">
            Reown Shell
          </Badge>
          <CardTitle className="font-display text-2xl uppercase tracking-wide">In-House Wallet Shell</CardTitle>
          <CardDescription>
            Your own branded shell opens first, then it triggers the real Reown/AppKit wallet connection flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="rounded-none border border-border/40 bg-black/20 p-4 text-sm text-muted-foreground">
            {isConnected ? `Connected: ${shortAddress(address || undefined)} (${status})` : "No wallet connected yet."}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setOpenShell(true)} className="rounded-none gap-2">
              <Wallet className="h-4 w-4" />
              Open In-House Shell
            </Button>
            {isConnected ? (
              <Button onClick={() => void disconnect()} variant="outline" className="rounded-none gap-2">
                <X className="h-4 w-4" />
                Disconnect
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {openShell ? (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/75 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[480px] rounded-[30px] border border-white/10 bg-[#101018] p-6 text-white shadow-[0_24px_100px_rgba(0,0,0,0.45)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#b7b2ff]">StealthV26 Secure Shell</p>
                <h2 className="mt-2 text-3xl font-semibold leading-none">Connect Wallet</h2>
                <p className="mt-3 text-sm text-zinc-400">
                  This shell stays under your branding. Reown only handles the actual wallet connection flow underneath.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenShell(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setOpenShell(false);
                  void open({ view: "Connect" });
                }}
                className="flex w-full items-center justify-between rounded-[24px] border border-[#7C73FF]/50 bg-[#7C73FF]/10 px-4 py-4 text-left"
              >
                <div>
                  <p className="text-sm font-semibold">Open Wallet Connect Flow</p>
                  <p className="mt-1 text-xs text-zinc-300">Trigger the real Reown connect modal from your shell.</p>
                </div>
                <PlugZap className="h-5 w-5 text-[#b7b2ff]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenShell(false);
                  void open({ view: "Account" });
                }}
                className="flex w-full items-center justify-between rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-left"
              >
                <div>
                  <p className="text-sm font-semibold">Open Account View</p>
                  <p className="mt-1 text-xs text-zinc-400">Jump directly into the account surface when already connected.</p>
                </div>
                <ShieldCheck className="h-5 w-5 text-zinc-300" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
