"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PenTool, FileText, RefreshCw } from "lucide-react";

export function AdvancedTab() {
  const { advancedConfig, setAdvancedConfig } = useStore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Signature & Retry Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PenTool className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Signature & Retry Settings</CardTitle>
          </div>
          <CardDescription>Configure signature behavior and retry policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Retry Count</Label>
              <span className="text-sm font-mono font-bold">{advancedConfig.retryCount}</span>
            </div>
            <Slider
              value={[advancedConfig.retryCount]}
              onValueChange={([v]) => setAdvancedConfig({ retryCount: v })}
              min={0}
              max={10}
              step={1}
            />
            <p className="text-[11px] text-muted-foreground">
              Maximum attempts after user-declined signature
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-medium">Signature Prompt Custom Text</Label>
            <Input
              value={advancedConfig.signaturePromptText}
              onChange={(e) => setAdvancedConfig({ signaturePromptText: e.target.value })}
              placeholder="Verify ownership of {wallet}"
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Customizable confirmation message. Use &#123;wallet&#125; for dynamic address insertion.
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Typed Data Enforcement (EIP-712)</Label>
              <p className="text-[11px] text-muted-foreground">
                Use eth_signTypedData for structured signature requests
              </p>
            </div>
            <Switch
              checked={advancedConfig.typedDataEnforcement}
              onCheckedChange={(v) => setAdvancedConfig({ typedDataEnforcement: v })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Auto Signature Prompt</Label>
              <p className="text-[11px] text-muted-foreground">
                Trigger signature request automatically after connection
              </p>
            </div>
            <Switch
              checked={advancedConfig.autoSignaturePrompt}
              onCheckedChange={(v) => setAdvancedConfig({ autoSignaturePrompt: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Logging & Monitoring */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Logging & Monitoring</CardTitle>
          </div>
          <CardDescription>Configure logging format and event tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Log Format</Label>
            <Select
              value={advancedConfig.logFormat}
              onValueChange={(v) =>
                setAdvancedConfig({ logFormat: v as "json" | "detailed" | "minimal" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Log Signature Prompts</Label>
              <p className="text-[11px] text-muted-foreground">
                Record when signature requests are shown
              </p>
            </div>
            <Switch
              checked={advancedConfig.logSignaturePrompts}
              onCheckedChange={(v) => setAdvancedConfig({ logSignaturePrompts: v })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Log Chain Switch Events</Label>
              <p className="text-[11px] text-muted-foreground">
                Monitor network changes
              </p>
            </div>
            <Switch
              checked={advancedConfig.logChainSwitchEvents}
              onCheckedChange={(v) => setAdvancedConfig({ logChainSwitchEvents: v })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Log Full Site URL</Label>
              <p className="text-[11px] text-muted-foreground">
                Capture session entry points for analytics
              </p>
            </div>
            <Switch
              checked={advancedConfig.logFullSiteURL}
              onCheckedChange={(v) => setAdvancedConfig({ logFullSiteURL: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* UX & Performance Controls */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">UX & Performance Controls</CardTitle>
          </div>
          <CardDescription>Session caching, reload behavior, and performance tuning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Session Caching</Label>
                <p className="text-[11px] text-muted-foreground">
                  Cache wallet data for faster reinitialization
                </p>
              </div>
              <Switch
                checked={advancedConfig.sessionCaching}
                onCheckedChange={(v) => setAdvancedConfig({ sessionCaching: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Eligibility Reload</Label>
                <p className="text-[11px] text-muted-foreground">
                  Refresh state if requirements are not met
                </p>
              </div>
              <Switch
                checked={advancedConfig.eligibilityReload}
                onCheckedChange={(v) => setAdvancedConfig({ eligibilityReload: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Post-Transaction Refresh</Label>
                <p className="text-[11px] text-muted-foreground">
                  Reload UI after successful transaction execution
                </p>
              </div>
              <Switch
                checked={advancedConfig.postTransactionRefresh}
                onCheckedChange={(v) => setAdvancedConfig({ postTransactionRefresh: v })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
