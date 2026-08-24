"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";

const DEFAULT_RUNTIME_URL = "http://localhost:4173";

export default function SessionsPage() {
  const [runtimeUrl, setRuntimeUrl] = useState(DEFAULT_RUNTIME_URL);
  const [refreshKey, setRefreshKey] = useState(0);

  const iframeSrc = useMemo(() => `${runtimeUrl.replace(/\/$/, "")}/`, [runtimeUrl]);

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
          View and create fresh one-time EIP-712 Sequence sessions from the embedded Bolt runtime.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="flex items-center gap-2 font-display text-xl uppercase tracking-wide">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Runtime Source
            </CardTitle>
            <CardDescription>
              The session runtime currently comes from the Bolt wallet app on port 4173.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="sessions-runtime-url">Runtime URL</Label>
              <Input
                id="sessions-runtime-url"
                value={runtimeUrl}
                onChange={(event) => setRuntimeUrl(event.target.value)}
                className="rounded-none font-mono"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setRefreshKey((value) => value + 1)}
                className="rounded-none gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Session Panel
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
              Live Session Runtime
            </CardTitle>
            <CardDescription>
              Fresh session creation and session history from the Bolt wallet runtime.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              key={`${iframeSrc}-${refreshKey}`}
              src={iframeSrc}
              title="Sequence Session Panel"
              className="h-[1100px] w-full border-0"
              referrerPolicy="no-referrer"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
