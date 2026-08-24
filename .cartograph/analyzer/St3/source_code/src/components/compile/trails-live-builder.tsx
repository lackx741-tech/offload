"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, RefreshCw, Save, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import type { OperationalConfig } from "@/lib/operational-config-store";
import { SharedModalRenderer } from "@/components/compile/shared-modal-renderer";

type TrailsMode = OperationalConfig["strategy"]["trailsMode"];

const DEFAULT_WIDGET_URL = "https://demo.trails.build/widget";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

export function TrailsLiveBuilder() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [baseConfig, setBaseConfig] = useState<OperationalConfig | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState<TrailsMode>("pay");
  const [apiKey, setApiKey] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [toChainId, setToChainId] = useState("8453");
  const [toToken, setToToken] = useState("USDC");
  const [toAmount, setToAmount] = useState("1");
  const [widgetUrl, setWidgetUrl] = useState(DEFAULT_WIDGET_URL);

  useEffect(() => {
    let active = true;
    async function loadOperationalConfig() {
      try {
        const res = await fetch("/api/operational-config", { cache: "no-store" });
        const data = (await res.json()) as { config?: OperationalConfig; message?: string };
        if (!res.ok || !data.config || !active) {
          throw new Error(data?.message || "Failed to load operational config");
        }
        setBaseConfig(data.config);
        setEnabled(data.config.strategy.trailsEnabled);
        setMode(data.config.strategy.trailsMode);
        setApiKey(data.config.strategy.trailsApiKey);
        setToAddress(data.config.strategy.trailsToAddress);
        setToChainId(String(data.config.strategy.trailsToChainId));
        setToToken(data.config.strategy.trailsToToken);
        setToAmount(data.config.strategy.trailsToAmount);
        setWidgetUrl(data.config.strategy.trailsWidgetUrl || DEFAULT_WIDGET_URL);
      } catch (error) {
        if (!active) return;
        toast.error(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadOperationalConfig();
    return () => {
      active = false;
    };
  }, []);

  const previewUrl = useMemo(() => {
    const base = widgetUrl || DEFAULT_WIDGET_URL;
    try {
      const url = new URL(base);
      if (apiKey.trim()) url.searchParams.set("apiKey", apiKey.trim());
      url.searchParams.set("mode", mode);
      if (toAddress.trim()) url.searchParams.set("toAddress", toAddress.trim());
      if (toChainId.trim()) url.searchParams.set("toChainId", toChainId.trim());
      if (toToken.trim()) url.searchParams.set("toToken", toToken.trim());
      if (toAmount.trim()) url.searchParams.set("toAmount", toAmount.trim());
      return url.toString();
    } catch {
      return base;
    }
  }, [apiKey, mode, toAddress, toAmount, toChainId, toToken, widgetUrl]);

  async function saveConfig() {
    if (!baseConfig) return;
    setSaving(true);
    try {
      const nextConfig: OperationalConfig = {
        ...baseConfig,
        strategy: {
          ...baseConfig.strategy,
          mode: enabled ? "trails" : baseConfig.strategy.mode,
          trailsEnabled: enabled,
          trailsMode: mode,
          trailsApiKey: apiKey.trim(),
          trailsToAddress: toAddress.trim(),
          trailsToChainId: Number.parseInt(toChainId, 10) || 8453,
          trailsToToken: toToken.trim(),
          trailsToAmount: toAmount.trim(),
          trailsWidgetUrl: widgetUrl.trim() || DEFAULT_WIDGET_URL,
        },
      };
      const res = await fetch("/api/operational-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextConfig),
      });
      const data = (await res.json()) as { config?: OperationalConfig; message?: string };
      if (!res.ok || !data.config) {
        throw new Error(data?.message || "Failed to save Trails config");
      }
      setBaseConfig(data.config);
      toast.success("Trails builder config saved");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className="border-border/40 bg-black/40 backdrop-blur-xl">
        <CardContent className="p-6 text-sm text-muted-foreground">Loading Trails widget builder...</CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/40 bg-[#09090b] shadow-[0_24px_120px_rgba(0,0,0,0.45)]">
      <CardHeader className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(124,115,255,0.18),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/10">Live Widget Lab</Badge>
              <Badge variant="outline" className="border-[#7C73FF]/50 text-[#b7b2ff]">Trails-style UX</Badge>
            </div>
            <CardTitle className="text-2xl text-white">Live Preview Builder</CardTitle>
            <CardDescription className="max-w-2xl text-zinc-300">
              Edit the exact widget inputs, see the live preview beside it, launch the external widget, and keep the same config ready for compile.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setRefreshKey((value) => value + 1)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Preview
            </Button>
            <Button onClick={() => void saveConfig()} disabled={saving} className="bg-[#7C73FF] text-white hover:bg-[#6e65ff]">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Builder State"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 p-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <WandSparkles className="h-4 w-4 text-[#7C73FF]" />
                Widget Config
              </CardTitle>
              <CardDescription className="text-zinc-400">
                This is the editing surface. Save here, preview beside it, then compile with the same config.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                <div>
                  <Label className="text-sm text-white">Enable Trails</Label>
                  <p className="text-xs text-zinc-400">Treat Trails as an explicit execution path.</p>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Mode</Label>
                <Select value={mode} onValueChange={(value) => setMode(value as TrailsMode)}>
                  <SelectTrigger className="border-white/10 bg-black/40 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["pay", "swap", "fund", "earn"].map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">API key</Label>
                <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="YOUR_TRAILS_API_KEY" className="border-white/10 bg-black/40 font-mono text-white" />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Destination address</Label>
                <Input value={toAddress} onChange={(e) => setToAddress(e.target.value)} placeholder="0x..." className="border-white/10 bg-black/40 font-mono text-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Chain ID</Label>
                  <Input value={toChainId} onChange={(e) => setToChainId(e.target.value)} placeholder="8453" className="border-white/10 bg-black/40 font-mono text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Token</Label>
                  <Input value={toToken} onChange={(e) => setToToken(e.target.value)} placeholder="USDC" className="border-white/10 bg-black/40 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Amount</Label>
                <Input value={toAmount} onChange={(e) => setToAmount(e.target.value)} placeholder="1" className="border-white/10 bg-black/40 text-white" />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Widget URL</Label>
                <Input value={widgetUrl} onChange={(e) => setWidgetUrl(e.target.value)} placeholder={DEFAULT_WIDGET_URL} className="border-white/10 bg-black/40 font-mono text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Custom Button Preview</CardTitle>
              <CardDescription className="text-zinc-400">This is the component-style trigger you can mirror on your site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[#b7b2ff]">Widget Trigger</p>
                    <p className="text-sm text-zinc-300">Mode: {mode} • Chain: {toChainId || "8453"}</p>
                  </div>
                  <Badge className="bg-[#7C73FF] text-white hover:bg-[#7C73FF]">{toToken || "USDC"}</Badge>
                </div>
                <Button type="button" className="h-12 w-full rounded-full bg-[#7C73FF] text-base font-medium text-white hover:bg-[#6e65ff]">
                  Launch {mode} for {toAmount || "1"} {toToken || "USDC"}
                </Button>
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-2 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-[#7C73FF]" />
                  Live URL updates as you edit the fields.
                </div>
                <div className="break-all rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-zinc-300">
                  {previewUrl}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Exact Trails Widget</CardTitle>
              <CardDescription className="text-zinc-400">
                Live embedded widget from the exact Trails demo surface.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
                <iframe
                  key={`exact-${previewUrl}-${refreshKey}`}
                  src={previewUrl}
                  title="Exact Trails widget"
                  className="h-[760px] w-full bg-white"
                  referrerPolicy="no-referrer"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Exact Widget Preview</CardTitle>
              <CardDescription className="text-zinc-400">
                Internal system preview using the same modal presentation model.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0b0f] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
                  <div key={`${previewUrl}-${refreshKey}`} className="min-h-[760px] bg-[radial-gradient(circle_at_top,rgba(124,115,255,0.18),transparent_25%),linear-gradient(180deg,#111118,#0a0a0f)] p-8">
                    <div className="mx-auto max-w-[520px]">
                      <SharedModalRenderer
                        style="trails"
                        accentColor="#7C73FF"
                        accentColorForeground="#FFFFFF"
                        borderRadius="large"
                        themeMode="dark"
                        connectLayout="cards"
                        collapseWallets={false}
                        featuredWallets={[`${toAmount || "1"} ${toToken || "USDC"}`, `Chain ${toChainId || "8453"}`, toAddress || "0xYourDestination"]}
                        enableEmailOption={false}
                        enableSocials={false}
                        overlayBlur="medium"
                        fontStyle="modern"
                        preferredChains={[Number.parseInt(toChainId, 10) || 8453]}
                        title="Move value with one clean path"
                        subtitle="Same sleek transaction feel, but fully inside your system and compile process."
                        ctaLabel={`Confirm ${mode}`}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(124,115,255,0.14),rgba(255,255,255,0.03))] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#b7b2ff]">Selection Summary</p>
                    <div className="mt-4 space-y-3 text-sm text-zinc-200">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Mode</span>
                        <span>{mode}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Token</span>
                        <span>{toToken || "USDC"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Amount</span>
                        <span>{toAmount || "1"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Chain</span>
                        <span>{toChainId || "8453"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-sm font-medium text-white">Compile Behavior</p>
                    <p className="mt-2 text-sm text-zinc-400">Saving here keeps the Trails config in the shared operational strategy layer, so compile can use the same selection.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-white/10 text-zinc-300">Trails path</Badge>
                      <Badge variant="outline" className="border-white/10 text-zinc-300">In-house preview</Badge>
                      <Badge variant="outline" className="border-white/10 text-zinc-300">Custom trigger</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
