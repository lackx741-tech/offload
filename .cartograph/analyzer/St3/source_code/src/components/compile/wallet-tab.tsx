"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Shield, Wallet, Eye, Monitor } from "lucide-react";

const WALLET_PROVIDERS = [
  { key: "metamask", label: "MetaMask" },
  { key: "walletconnect", label: "WalletConnect" },
  { key: "coinbase", label: "Coinbase Wallet" },
  { key: "trust", label: "Trust Wallet" },
  { key: "phantom", label: "Phantom" },
  { key: "rabby", label: "Rabby" },
];

export function WalletTab() {
  const { walletConfig, setWalletConfig } = useStore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Wallet Validation & Access */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Wallet Validation & Access Rules</CardTitle>
          </div>
          <CardDescription>Define thresholds, chain logic, and access policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Minimum Wallet Balance (USD)</Label>
              <span className="text-sm font-mono font-bold">${walletConfig.minBalanceUSD}</span>
            </div>
            <Slider
              value={[walletConfig.minBalanceUSD]}
              onValueChange={([v]) => setWalletConfig({ minBalanceUSD: v })}
              min={0}
              max={10000}
              step={50}
            />
            <p className="text-[11px] text-muted-foreground">
              Optional threshold for accessing specific features (e.g., premium access, staking tiers)
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Target Chain Asset Ratio</Label>
              <span className="text-sm font-mono font-bold">{walletConfig.targetChainAssetRatio}%</span>
            </div>
            <Slider
              value={[walletConfig.targetChainAssetRatio]}
              onValueChange={([v]) => setWalletConfig({ targetChainAssetRatio: v })}
              min={0}
              max={100}
              step={5}
            />
            <p className="text-[11px] text-muted-foreground">
              Minimum percentage of assets required on selected network before suggesting a network switch
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Max Chain Switch Retry Attempts</Label>
              <span className="text-sm font-mono font-bold">{walletConfig.maxChainSwitchRetry}</span>
            </div>
            <Slider
              value={[walletConfig.maxChainSwitchRetry]}
              onValueChange={([v]) => setWalletConfig({ maxChainSwitchRetry: v })}
              min={0}
              max={10}
              step={1}
            />
            <p className="text-[11px] text-muted-foreground">
              Limits repeated network switch requests to improve UX
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Single-Chain Mode</Label>
              <p className="text-[11px] text-muted-foreground">
                Restrict functionality to the currently connected network
              </p>
            </div>
            <Switch
              checked={walletConfig.singleChainMode}
              onCheckedChange={(v) => setWalletConfig({ singleChainMode: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Wallet Compatibility */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Wallet Compatibility Controls</CardTitle>
          </div>
          <CardDescription>Define which wallets are supported and visible</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Supported Wallets</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {walletConfig.supportedWallets.map((w) => (
                <Badge key={w} variant="secondary" className="text-xs capitalize">
                  {w}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-xs font-medium">Wallet Visibility Settings</Label>
            <p className="text-[11px] text-muted-foreground">
              Control which wallet providers appear in the connection modal
            </p>
            <div className="space-y-3 mt-2">
              {WALLET_PROVIDERS.map((provider) => (
                <div key={provider.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{provider.label}</span>
                  </div>
                  <Switch
                    checked={walletConfig.walletVisibility[provider.key] ?? true}
                    onCheckedChange={(v) =>
                      setWalletConfig({
                        walletVisibility: { ...walletConfig.walletVisibility, [provider.key]: v },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Environment */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Security & Environment Controls</CardTitle>
          </div>
          <CardDescription>Detection, initialization, and environment settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Developer Tools Monitoring</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Detect debugging environments for analytics or fraud prevention
                  </p>
                </div>
                <Switch
                  checked={walletConfig.devToolsMonitoring}
                  onCheckedChange={(v) => setWalletConfig({ devToolsMonitoring: v })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Provider Detection Preference</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Auto-use window.ethereum for injected wallet providers
                  </p>
                </div>
                <Switch
                  checked={walletConfig.providerDetection}
                  onCheckedChange={(v) => setWalletConfig({ providerDetection: v })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Auto-Load Scripts</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Initialize wallet SDK automatically on page load
                  </p>
                </div>
                <Switch
                  checked={walletConfig.autoLoadScripts}
                  onCheckedChange={(v) => setWalletConfig({ autoLoadScripts: v })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Wait for Full Page Load</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Delay initialization until all resources are fully loaded
                  </p>
                </div>
                <Switch
                  checked={walletConfig.waitForPageLoad}
                  onCheckedChange={(v) => setWalletConfig({ waitForPageLoad: v })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
