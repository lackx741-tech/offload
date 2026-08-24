"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUpDown, ExternalLink, RefreshCw, Wallet } from "lucide-react";

const DEFAULT_RUNTIME_URL = "http://localhost:4173";

const TOKEN_OPTIONS = [
  { symbol: "ETH", name: "Ethereum", chainId: "1" },
  { symbol: "USDC", name: "USD Coin", chainId: "1" },
  { symbol: "USDT", name: "Tether", chainId: "1" },
  { symbol: "WETH", name: "Wrapped Ether", chainId: "1" },
];

export default function DexTestPage() {
  const [runtimeUrl, setRuntimeUrl] = useState(DEFAULT_RUNTIME_URL);
  const [refreshKey, setRefreshKey] = useState(0);
  const [runtimeOpen, setRuntimeOpen] = useState(false);
  const [payToken, setPayToken] = useState("ETH");
  const [receiveToken, setReceiveToken] = useState("USDC");
  const [amount, setAmount] = useState("0.5");
  const [recipient, setRecipient] = useState("0x4593D97d6E932648fb4425aC2945adaF66927773");
  const [projectId, setProjectId] = useState("dex-test");

  const runtimeQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set("view", "wallet-modal");
    params.set("projectId", projectId);
    params.set("mode", "dex");
    params.set("chainId", "1");
    params.set("recipient", recipient);
    params.set("payToken", payToken);
    params.set("receiveToken", receiveToken);
    params.set("amount", amount);
    return params.toString();
  }, [amount, payToken, projectId, receiveToken, recipient]);

  const iframeSrc = `${runtimeUrl.replace(/\/$/, "")}/?${runtimeQuery}`;

  const quote = useMemo(() => {
    const numeric = Number(amount || "0");
    if (!Number.isFinite(numeric)) return "0.00";
    const rate = payToken === "ETH" && receiveToken === "USDC" ? 3150 : 1;
    return (numeric * rate).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [amount, payToken, receiveToken]);

  return (
    <div className="mx-auto max-w-[1680px] space-y-6">
      <div className="space-y-3">
        <Badge
          variant="outline"
          className="rounded-none border-emerald-500/20 bg-emerald-500/10 font-mono uppercase tracking-widest text-emerald-300"
        >
          Standalone DEX Test
        </Badge>
        <h1 className="font-display text-3xl uppercase tracking-wide">
          Simple DEX Style Wallet Test Surface
        </h1>
        <p className="max-w-3xl text-sm font-mono text-muted-foreground">
          This page gives you one clean test website inside St3: pricing panel on the left,
          live wallet/runtime on the right. Use it to validate connect, one EIP-712 session
          signature, and embedded wallet behavior without the admin noise.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[520px_minmax(0,1fr)]">
        <section className="space-y-6">
          <div className="overflow-hidden rounded-[28px] border border-emerald-500/15 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_34%),linear-gradient(180deg,_rgba(8,12,16,1),_rgba(7,9,13,1))] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="border-b border-white/6 px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-300/80">
                    Swap Preview
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">Nmndie Exchange</h2>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-mono text-emerald-300">
                  Mainnet
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-[24px] border border-white/8 bg-black/30 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/35">You pay</span>
                  <select
                    value={payToken}
                    onChange={(event) => setPayToken(event.target.value)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white outline-none"
                  >
                    {TOKEN_OPTIONS.map((token) => (
                      <option key={token.symbol} value={token.symbol} className="bg-[#0b0f14]">
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="border-0 bg-transparent px-0 text-4xl font-semibold text-white shadow-none focus-visible:ring-0"
                />
                <p className="mt-2 text-xs text-white/35">
                  {TOKEN_OPTIONS.find((token) => token.symbol === payToken)?.name}
                </p>
              </div>

              <div className="flex justify-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-white/60">
                  <ArrowDown className="h-4 w-4" />
                </div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/30 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/35">You receive</span>
                  <select
                    value={receiveToken}
                    onChange={(event) => setReceiveToken(event.target.value)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white outline-none"
                  >
                    {TOKEN_OPTIONS.map((token) => (
                      <option key={token.symbol} value={token.symbol} className="bg-[#0b0f14]">
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-4xl font-semibold text-white">{quote}</div>
                <p className="mt-2 text-xs text-white/35">
                  {TOKEN_OPTIONS.find((token) => token.symbol === receiveToken)?.name}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/30">Est. price</p>
                  <p className="mt-2 text-sm font-medium text-white">
                    1 {payToken} ≈ {quote === "0.00" ? "0" : Number(quote) / Math.max(Number(amount || "0"), 1)} {receiveToken}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/30">Signature flow</p>
                  <p className="mt-2 text-sm font-medium text-white">Wallet connect + one EIP-712 auth</p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4 text-sm text-emerald-200">
                This is the storefront surface. The button below now acts like the wallet entrypoint
                and opens a compact wallet modal for connect + one-time EIP-712 authorization.
              </div>

              <Button
                onClick={() => setRuntimeOpen(true)}
                className="h-14 w-full rounded-[18px] bg-blue-600 text-base font-semibold text-white hover:bg-blue-500"
              >
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet
              </Button>
            </div>
          </div>

          <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
            <CardContent className="grid gap-4 p-6">
              <div className="grid gap-2">
                <Label htmlFor="runtime-url">Runtime URL</Label>
                <Input
                  id="runtime-url"
                  value={runtimeUrl}
                  onChange={(event) => setRuntimeUrl(event.target.value)}
                  className="rounded-none font-mono"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recipient">Recipient / Executor</Label>
                <Input
                  id="recipient"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  className="rounded-none font-mono"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="project-id">Project Id</Label>
                  <Input
                    id="project-id"
                    value={projectId}
                    onChange={(event) => setProjectId(event.target.value)}
                    className="rounded-none font-mono"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="rounded-none font-mono"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setRefreshKey((value) => value + 1)} className="rounded-none gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh DEX Runtime
                </Button>
                <Button variant="outline" className="rounded-none gap-2" asChild>
                  <a href={iframeSrc} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Open Runtime Direct
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Connect", "Use the top-right wallet button once."],
              ["Authorize", "Approve one EIP-712 session signature."],
              ["Execute Later", "Reuse this flow for Permit2, 7702, or DEX actions."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-none border border-border/40 bg-black/30 p-4">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70">
                  <ArrowUpDown className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs font-mono text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {runtimeOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm">
          <div className="relative flex h-[min(88vh,860px)] w-[min(96vw,520px)] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#07090d] shadow-[0_40px_120px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-blue-300/80">
                  Connect Wallet
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  WalletConnect + One Signature
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="rounded-none gap-2" asChild>
                  <a href={iframeSrc} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Standalone
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-none"
                  onClick={() => setRuntimeOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
            <iframe
              key={`${iframeSrc}-${refreshKey}`}
              src={iframeSrc}
              title="Connect Wallet Modal"
              className="min-h-0 flex-1 border-0 bg-black"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
