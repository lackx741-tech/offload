"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, RefreshCw, Wallet } from "lucide-react";

const DEFAULT_RUNTIME_URL = "http://localhost:4173";

export default function WalletRuntimePage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <WalletRuntimeInner />
    </Suspense>
  );
}

function WalletRuntimeInner() {
  const searchParams = useSearchParams();
  const [runtimeUrl, setRuntimeUrl] = useState(DEFAULT_RUNTIME_URL);
  const [refreshKey, setRefreshKey] = useState(0);

  const forwardedQuery = useMemo(() => {
    const next = new URLSearchParams();

    for (const key of ["projectId", "recipient", "mode", "chainId"]) {
      const value = searchParams.get(key);
      if (value) next.set(key, value);
    }

    const query = next.toString();
    return query ? `?${query}` : "";
  }, [searchParams]);

  const iframeSrc = `${runtimeUrl.replace(/\/$/, "")}/${forwardedQuery}`;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="space-y-2">
        <Badge
          variant="outline"
          className="rounded-none border-primary/20 bg-primary/10 font-mono uppercase tracking-widest text-primary"
        >
          Embedded Wallet Runtime
        </Badge>
        <h1 className="font-display text-3xl uppercase tracking-wide">
          Bolt Wallet Runtime Inside St3
        </h1>
        <p className="text-sm text-muted-foreground font-mono">
          This page embeds the working Bolt wallet/session app so St3 can use it today without
          rebuilding the wallet flow from scratch.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="flex items-center gap-2 font-display text-xl uppercase tracking-wide">
              <Wallet className="h-4 w-4 text-primary" />
              Runtime Source
            </CardTitle>
            <CardDescription>
              Point St3 to the running wallet app. The default is the local Bolt runtime on port
              4173.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="runtime-url">Wallet Runtime URL</Label>
              <Input
                id="runtime-url"
                value={runtimeUrl}
                onChange={(event) => setRuntimeUrl(event.target.value)}
                className="rounded-none font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Forwarded Query</Label>
              <div className="rounded-none border border-border/40 bg-black/20 px-3 py-2 font-mono text-xs text-muted-foreground">
                {forwardedQuery || "(none)"}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setRefreshKey((value) => value + 1)}
                className="rounded-none gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Runtime
              </Button>
              <Button variant="outline" className="rounded-none gap-2" asChild>
                <a href={iframeSrc} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open Runtime
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl overflow-hidden">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="font-display text-xl uppercase tracking-wide">
              Live Wallet Runtime
            </CardTitle>
            <CardDescription>
              Embedded wallet/session flow from the Bolt app.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              key={`${iframeSrc}-${refreshKey}`}
              src={iframeSrc}
              title="Embedded Wallet Runtime"
              className="h-[1100px] w-full border-0"
              referrerPolicy="no-referrer"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
