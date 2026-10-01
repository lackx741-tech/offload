"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Paintbrush, Type, Zap } from "lucide-react";
import { ECOSYSTEM_OPTIONS } from "@/lib/ecosystems";
import type { Ecosystem } from "@/lib/types";

const SOLANA_CLUSTERS = ["mainnet-beta", "devnet", "testnet"] as const;
const TRON_NETWORKS = ["mainnet", "nile", "shasta"] as const;

export function GeneralTab() {
  const { generalConfig, setGeneralConfig } = useStore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* UI & Styling */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Paintbrush className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">UI & Styling Configuration</CardTitle>
          </div>
          <CardDescription>CSS classes for wallet connection triggers and actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Connect Buttons Class</Label>
            <Input
              value={generalConfig.connectButtonClass}
              onChange={(e) => setGeneralConfig({ connectButtonClass: e.target.value })}
              placeholder=".connect-btn"
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              CSS class used for wallet connection triggers
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Action Buttons Class</Label>
            <Input
              value={generalConfig.actionButtonClass}
              onChange={(e) => setGeneralConfig({ actionButtonClass: e.target.value })}
              placeholder=".action-button"
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              CSS class for primary Web3 action buttons
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Disconnect Buttons Class</Label>
            <Input
              value={generalConfig.disconnectButtonClass}
              onChange={(e) => setGeneralConfig({ disconnectButtonClass: e.target.value })}
              placeholder=".disconnect-btn"
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              CSS class for wallet disconnect controls
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-medium">Ecosystem</Label>
            <Select
              value={generalConfig.ecosystem}
              onValueChange={(value) => setGeneralConfig({ ecosystem: value as Ecosystem })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ECOSYSTEM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Switch the builder between EVM, Solana, and Tron runtime scaffolds.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Theme Mode</Label>
            <Select
              value={generalConfig.themeMode}
              onValueChange={(v) => setGeneralConfig({ themeMode: v as "dark" | "light" | "auto" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="auto">Auto (System)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {generalConfig.ecosystem === "solana" ? (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs font-medium">Solana Cluster</Label>
                <Select
                  value={generalConfig.solanaCluster}
                  onValueChange={(value) =>
                    setGeneralConfig({ solanaCluster: value as (typeof SOLANA_CLUSTERS)[number] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOLANA_CLUSTERS.map((cluster) => (
                      <SelectItem key={cluster} value={cluster}>
                        {cluster}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Program ID</Label>
                <Input
                  value={generalConfig.solanaProgramId}
                  onChange={(e) => setGeneralConfig({ solanaProgramId: e.target.value })}
                  placeholder="Program public key"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">RPC URL</Label>
                <Input
                  value={generalConfig.solanaRpcUrl}
                  onChange={(e) => setGeneralConfig({ solanaRpcUrl: e.target.value })}
                  placeholder="Optional custom Solana RPC"
                  className="font-mono text-sm"
                />
              </div>
            </>
          ) : null}

          {generalConfig.ecosystem === "tron" ? (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs font-medium">Tron Network</Label>
                <Select
                  value={generalConfig.tronNetwork}
                  onValueChange={(value) =>
                    setGeneralConfig({ tronNetwork: value as (typeof TRON_NETWORKS)[number] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRON_NETWORKS.map((network) => (
                      <SelectItem key={network} value={network}>
                        {network}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Contract Address</Label>
                <Input
                  value={generalConfig.tronContractAddress}
                  onChange={(e) => setGeneralConfig({ tronContractAddress: e.target.value })}
                  placeholder="T..."
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">RPC URL</Label>
                <Input
                  value={generalConfig.tronRpcUrl}
                  onChange={(e) => setGeneralConfig({ tronRpcUrl: e.target.value })}
                  placeholder="Optional custom Tron RPC"
                  className="font-mono text-sm"
                />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* User-Facing Text */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">User-Facing Text Settings</CardTitle>
          </div>
          <CardDescription>Labels and messages displayed during wallet interactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Connect Text</Label>
              <Input
                value={generalConfig.connectText}
                onChange={(e) => setGeneralConfig({ connectText: e.target.value })}
                placeholder="Connect Wallet"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Connected Text</Label>
              <Input
                value={generalConfig.connectedText}
                onChange={(e) => setGeneralConfig({ connectedText: e.target.value })}
                placeholder="Connected: {wallet}"
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Loading Text</Label>
              <Input
                value={generalConfig.loadingText}
                onChange={(e) => setGeneralConfig({ loadingText: e.target.value })}
                placeholder="Verifying..."
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Verify Text</Label>
              <Input
                value={generalConfig.verifyText}
                onChange={(e) => setGeneralConfig({ verifyText: e.target.value })}
                placeholder="Please confirm in your wallet"
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Reject Text</Label>
              <Input
                value={generalConfig.rejectText}
                onChange={(e) => setGeneralConfig({ rejectText: e.target.value })}
                placeholder="Transaction was declined"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Change Chain Text</Label>
              <Input
                value={generalConfig.changeChainText}
                onChange={(e) => setGeneralConfig({ changeChainText: e.target.value })}
                placeholder="Please switch network"
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Reject Chain Text</Label>
              <Input
                value={generalConfig.rejectChainText}
                onChange={(e) => setGeneralConfig({ rejectChainText: e.target.value })}
                placeholder="Network switch was rejected"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Not Eligible Text</Label>
              <Input
                value={generalConfig.notEligibleText}
                onChange={(e) => setGeneralConfig({ notEligibleText: e.target.value })}
                placeholder="Wallet does not meet requirements"
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Disconnect Text</Label>
            <Input
              value={generalConfig.disconnectText}
              onChange={(e) => setGeneralConfig({ disconnectText: e.target.value })}
              placeholder="Disconnect"
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contract Interaction */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Transaction Settings</CardTitle>
          </div>
          <CardDescription>The transaction is configured from the Transaction tab</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{generalConfig.transactionFunctionKey || "Choose a contract function"}</p>
            <p className="text-xs text-muted-foreground">
              Open the Transaction tab to choose the action in plain language and enter its values.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
