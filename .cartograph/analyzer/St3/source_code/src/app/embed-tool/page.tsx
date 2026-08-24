"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ExternalLink, RefreshCw, Frame, Code2 } from "lucide-react";
import { toast } from "sonner";

function buildHtmlSnippet(url: string, height: number, referrerPolicy: string, sandbox: boolean) {
  const attrs = [
    `src="${url}"`,
    `title="Embedded Site"`,
    `style="width:100%;height:${height}px;border:0;display:block;"`,
    `loading="lazy"`,
    `referrerpolicy="${referrerPolicy}"`,
  ];

  if (sandbox) {
    attrs.push(`sandbox="allow-scripts allow-same-origin allow-forms allow-popups"`);
  }

  return `<iframe\n  ${attrs.join("\n  ")}\n></iframe>`;
}

export default function EmbedToolPage() {
  const [url, setUrl] = useState("https://demo.trails.build/widget");
  const [height, setHeight] = useState("800");
  const [referrerPolicy, setReferrerPolicy] = useState("no-referrer");
  const [sandbox, setSandbox] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const parsedHeight = Number.parseInt(height, 10) || 800;

  const snippet = useMemo(() => {
    return buildHtmlSnippet(url.trim(), parsedHeight, referrerPolicy, sandbox);
  }, [url, parsedHeight, referrerPolicy, sandbox]);

  const bookmarklet = useMemo(() => {
    const js = `
      (function(){
        var target = prompt("Enter a URL to embed:", "${url.trim()}");
        if(!target) return;
        var w = window.open("", "_blank");
        if(!w) return alert("Popup blocked");
        w.document.write('<!doctype html><html><head><title>Embed Preview</title><style>html,body{margin:0;padding:0;background:#0b0b10}iframe{width:100%;height:100vh;border:0;display:block}</style></head><body><iframe src="' + target.replace(/"/g, "&quot;") + '" referrerpolicy="${referrerPolicy}"></iframe></body></html>');
        w.document.close();
      })();
    `.trim().replace(/\s+/g, " ");
    return `javascript:${encodeURIComponent(js)}`;
  }, [url, referrerPolicy]);

  async function copyText(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  }

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <div className="space-y-2">
        <Badge variant="outline" className="rounded-none border-primary/20 bg-primary/10 font-mono uppercase tracking-widest text-primary">
          Embed Tool
        </Badge>
        <h1 className="font-display text-3xl uppercase tracking-wide">Paste Any URL And Build The Iframe</h1>
        <p className="text-sm text-muted-foreground font-mono">
          Use this page as your reusable embed workbench for other projects and websites that allow iframe rendering.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="flex items-center gap-2 font-display text-xl uppercase tracking-wide">
              <Frame className="h-4 w-4 text-primary" />
              Builder
            </CardTitle>
            <CardDescription>
              Paste a URL, change the iframe options, preview it, then copy the generated snippet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Label htmlFor="embed-url">URL</Label>
              <Input
                id="embed-url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/widget"
                className="rounded-none font-mono"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="embed-height">Height</Label>
                <Input
                  id="embed-height"
                  value={height}
                  onChange={(event) => setHeight(event.target.value)}
                  placeholder="800"
                  className="rounded-none font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="embed-referrer">Referrer Policy</Label>
                <Input
                  id="embed-referrer"
                  value={referrerPolicy}
                  onChange={(event) => setReferrerPolicy(event.target.value)}
                  placeholder="no-referrer"
                  className="rounded-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-none border border-border/40 bg-black/20 p-3">
              <div>
                <p className="text-sm">Use sandbox</p>
                <p className="text-xs text-muted-foreground">Enable only if you need tighter restrictions.</p>
              </div>
              <Switch checked={sandbox} onCheckedChange={setSandbox} />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setRefreshKey((value) => value + 1)} className="rounded-none gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh Preview
              </Button>
              <Button variant="outline" className="rounded-none gap-2" asChild>
                <a href={url.trim()} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open URL
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl overflow-hidden">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="font-display text-xl uppercase tracking-wide">Live Preview</CardTitle>
            <CardDescription>The site below is embedded exactly the same way your own project would embed it.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              key={`${url}-${parsedHeight}-${referrerPolicy}-${sandbox}-${refreshKey}`}
              src={url.trim()}
              title="Embed Preview"
              style={{ width: "100%", height: parsedHeight, border: 0, display: "block" }}
              referrerPolicy={referrerPolicy as React.HTMLAttributeReferrerPolicy}
              sandbox={sandbox ? "allow-scripts allow-same-origin allow-forms allow-popups" : undefined}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="flex items-center gap-2 font-display text-xl uppercase tracking-wide">
              <Code2 className="h-4 w-4 text-primary" />
              Generated Iframe Snippet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <Textarea value={snippet} readOnly className="min-h-[220px] rounded-none font-mono text-xs" />
            <Button onClick={() => void copyText(snippet, "Iframe snippet")} className="rounded-none gap-2">
              <Copy className="h-4 w-4" />
              Copy Snippet
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="font-display text-xl uppercase tracking-wide">Bookmarklet</CardTitle>
            <CardDescription>
              Save this as a bookmark. When you click it later, it asks for a URL and opens a new embed preview window.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <Textarea value={bookmarklet} readOnly className="min-h-[220px] rounded-none font-mono text-xs" />
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void copyText(bookmarklet, "Bookmarklet")} className="rounded-none gap-2">
                <Copy className="h-4 w-4" />
                Copy Bookmarklet
              </Button>
              <Button variant="outline" className="rounded-none" asChild>
                <a href={bookmarklet}>Run Bookmarklet</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
