"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Layers, Link2, MousePointerClick, Sparkles, Palette, Network, ListCollapse } from "lucide-react";
import { SharedModalRenderer } from "@/components/compile/shared-modal-renderer";
import { SequenceModalSandbox } from "@/components/compile/sequence-modal-sandbox";
import { deriveModalPresentation } from "@/lib/modal-presentation";

type ModalFrameworkOption = {
  value: "walletconnect" | "web3modal" | "reown" | "rainbowkit" | "sequence" | "custom";
  label: string;
  detail: string;
  badge?: string;
};

const MODAL_FRAMEWORKS = [
  {
    value: "reown",
    label: "Reown",
    detail: "AppKit-oriented connect flow with custom theming support.",
    badge: "Open Source",
  },
  {
    value: "rainbowkit",
    label: "RainbowKit",
    detail: "React + wagmi connect flow with selectable visual theme controls.",
  },
  {
    value: "web3modal",
    label: "Web3Modal",
    detail: "Direct popup-based wallet selection flow.",
  },
  {
    value: "walletconnect",
    label: "WalletConnect",
    detail: "WalletConnect-centric connect surface using your project ID.",
  },
  {
    value: "sequence",
    label: "Sequence",
    detail: "Sequence connect modal and wallet widget for hosted or embedded smart-wallet flows.",
    badge: "Active Path",
  },
  {
    value: "custom",
    label: "Custom",
    detail: "Use your own trigger and modal handling with the compiled SDK helpers.",
  },
] satisfies readonly ModalFrameworkOption[];

const PREVIEW_STYLES = [
  { value: "trails", label: "Trails" },
  { value: "rainbowkit", label: "RainbowKit" },
  { value: "reown", label: "Reown" },
  { value: "custom", label: "Custom" },
] as const;

export function ModalTab() {
  const { modalConfig, setModalConfig } = useStore();
  const presentation = deriveModalPresentation(modalConfig);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Modal Engine</CardTitle>
            </div>
            <CardDescription>Choose the provider layer and the preview style independently.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3">
              {MODAL_FRAMEWORKS.map((framework) => {
                const active = modalConfig.modalFrameworkStyle === framework.value;
                return (
                  <button
                    key={framework.value}
                    type="button"
                    onClick={() => setModalConfig({ modalFrameworkStyle: framework.value })}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]"
                        : "border-border bg-background/50 hover:border-primary/40 hover:bg-accent/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className={`h-3.5 w-3.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-sm font-medium">{framework.label}</span>
                      </div>
                      {framework.badge ? <Badge variant={active ? "default" : "secondary"}>{framework.badge}</Badge> : null}
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{framework.detail}</p>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Preview style</Label>
                <Select
                  value={modalConfig.previewStyle}
                  onValueChange={(value) =>
                    setModalConfig({ previewStyle: value as "trails" | "rainbowkit" | "reown" | "custom" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PREVIEW_STYLES.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Popup style</Label>
                <Select
                  value={modalConfig.popupStyle}
                  onValueChange={(value) => setModalConfig({ popupStyle: value as "sweetalert2" | "comet" | "native" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sweetalert2">SweetAlert2</SelectItem>
                    <SelectItem value="comet">Comet</SelectItem>
                    <SelectItem value="native">Native Browser</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ListCollapse className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Connect Options</CardTitle>
            </div>
            <CardDescription>Reown-style and RainbowKit-style wallet option controls.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Layout</Label>
              <Select value={modalConfig.connectLayout} onValueChange={(value) => setModalConfig({ connectLayout: value as "cards" | "list" | "grid" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cards">Cards</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Featured wallets</Label>
              <Input
                value={modalConfig.featuredWallets.join(", ")}
                onChange={(e) => setModalConfig({ featuredWallets: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}
                placeholder="metamask, walletconnect, coinbase"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Collapse wallets</Label>
                <p className="text-[11px] text-muted-foreground">Show a tighter wallet selection list first.</p>
              </div>
              <Switch checked={modalConfig.collapseWallets} onCheckedChange={(value) => setModalConfig({ collapseWallets: value })} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Enable email option</Label>
                <p className="text-[11px] text-muted-foreground">Expose an email-based entry point in the modal shell.</p>
              </div>
              <Switch checked={modalConfig.enableEmailOption} onCheckedChange={(value) => setModalConfig({ enableEmailOption: value })} />
            </div>

            <div className="flex items-center justify-between md:col-span-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Enable socials</Label>
                <p className="text-[11px] text-muted-foreground">Keep social option visibility configurable instead of hardcoded.</p>
              </div>
              <Switch checked={modalConfig.enableSocials} onCheckedChange={(value) => setModalConfig({ enableSocials: value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Theme Controls</CardTitle>
            </div>
            <CardDescription>These settings drive your own system preview and compile config.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Mode</Label>
              <Select
                value={modalConfig.themeMode}
                onValueChange={(value) => setModalConfig({ themeMode: value as "light" | "dark" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Accent</Label>
              <Input
                value={modalConfig.accentColor}
                onChange={(e) => setModalConfig({ accentColor: e.target.value })}
                placeholder="#7C73FF"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Accent foreground</Label>
              <Input
                value={modalConfig.accentColorForeground}
                onChange={(e) => setModalConfig({ accentColorForeground: e.target.value })}
                placeholder="#FFFFFF"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Radius</Label>
              <Select
                value={modalConfig.borderRadius}
                onValueChange={(value) =>
                  setModalConfig({ borderRadius: value as "small" | "medium" | "large" | "full" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Overlay blur</Label>
              <Select
                value={modalConfig.overlayBlur}
                onValueChange={(value) =>
                  setModalConfig({ overlayBlur: value as "none" | "light" | "medium" | "heavy" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="heavy">Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Font style</Label>
              <Select
                value={modalConfig.fontStyle}
                onValueChange={(value) =>
                  setModalConfig({ fontStyle: value as "modern" | "rounded" | "mono" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="mono">Mono</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Chains / Networks</CardTitle>
            </div>
            <CardDescription>Reown-style network controls that feed the preview and compile config.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-medium">Preferred chains</Label>
              <Input
                value={modalConfig.preferredChains.join(", ")}
                onChange={(e) =>
                  setModalConfig({
                    preferredChains: e.target.value
                      .split(",")
                      .map((item) => Number.parseInt(item.trim(), 10))
                      .filter((item) => Number.isFinite(item)),
                  })
                }
                placeholder="1, 8453, 42161"
                className="font-mono"
              />
            </div>
            <div className="flex items-center justify-between md:col-span-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Open on network view</Label>
                <p className="text-[11px] text-muted-foreground">Start the modal in a network-selection state when needed.</p>
              </div>
              <Switch checked={modalConfig.openOnNetworkView} onCheckedChange={(value) => setModalConfig({ openOnNetworkView: value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Wallet Provider Configuration</CardTitle>
            </div>
            <CardDescription>Provider IDs and developer controls for Reown, RainbowKit, and related flows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium">WalletConnect Project ID</Label>
              <Input
                value={modalConfig.walletConnectProjectId}
                onChange={(e) => setModalConfig({ walletConnectProjectId: e.target.value })}
                placeholder="Enter your WalletConnect / Reown project ID"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Sequence Project Access Key</Label>
              <Input
                value={modalConfig.sequenceProjectAccessKey}
                onChange={(e) => setModalConfig({ sequenceProjectAccessKey: e.target.value })}
                placeholder="AQAAAA..."
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Sequence WaaS Config Key</Label>
              <Input
                value={modalConfig.sequenceWaasConfigKey}
                onChange={(e) => setModalConfig({ sequenceWaasConfigKey: e.target.value })}
                placeholder="Optional: eyJ..."
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Sequence Wallet URL</Label>
              <Input
                value={modalConfig.sequenceWalletUrl}
                onChange={(e) => setModalConfig({ sequenceWalletUrl: e.target.value })}
                placeholder="Optional: https://wallet.yourdomain.com"
                className="font-mono text-sm"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Enable latest provider version</Label>
                  <p className="text-[11px] text-muted-foreground">Keep provider integration aligned with the latest SDK path.</p>
                </div>
                <Switch checked={modalConfig.enableLatestWC} onCheckedChange={(value) => setModalConfig({ enableLatestWC: value })} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Expose external SDK functions</Label>
                  <p className="text-[11px] text-muted-foreground">Expose window helpers for advanced orchestration.</p>
                </div>
                <Switch checked={modalConfig.exposeExternalSDK} onCheckedChange={(value) => setModalConfig({ exposeExternalSDK: value })} />
              </div>

              <div className="flex items-center justify-between md:col-span-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Click-to-open modal behavior</Label>
                  <p className="text-[11px] text-muted-foreground">Connect your own page buttons to the selected modal style.</p>
                </div>
                <Switch checked={modalConfig.clickToOpenModal} onCheckedChange={(value) => setModalConfig({ clickToOpenModal: value })} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Modal Preview</CardTitle>
          </div>
          <CardDescription>
            Choose the exact visual direction in config, then compile against the selected provider mode.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{modalConfig.modalFrameworkStyle}</Badge>
            <Badge variant="outline">{modalConfig.previewStyle}</Badge>
            <Badge variant="outline">{modalConfig.themeMode}</Badge>
            <Badge variant="outline">{modalConfig.borderRadius}</Badge>
          </div>
          <SharedModalRenderer
            style={modalConfig.previewStyle}
            accentColor={modalConfig.accentColor}
            accentColorForeground={modalConfig.accentColorForeground}
            borderRadius={modalConfig.borderRadius}
            themeMode={modalConfig.themeMode}
            connectLayout={modalConfig.connectLayout}
            collapseWallets={modalConfig.collapseWallets}
            featuredWallets={modalConfig.featuredWallets}
            enableEmailOption={modalConfig.enableEmailOption}
            enableSocials={modalConfig.enableSocials}
            overlayBlur={modalConfig.overlayBlur}
            fontStyle={modalConfig.fontStyle}
            preferredChains={modalConfig.preferredChains}
            presentation={presentation}
          />
          {modalConfig.modalFrameworkStyle === "sequence" ? (
            <SequenceModalSandbox modalConfig={modalConfig} appName="StealthV26" />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
