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
import { Switch } from "@/components/ui/switch";
import { Banknote } from "lucide-react";
import { ECOSYSTEM_OPTIONS } from "@/lib/ecosystems";
import type { Ecosystem } from "@/lib/types";

export function PayoutTab() {
  const { payoutConfig, setPayoutConfig } = useStore();

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Payout Configuration</CardTitle>
          </div>
          <CardDescription>Configure where funds and collected data are sent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payout Address */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Payout Address</Label>
            <Input
              value={payoutConfig.address}
              onChange={(e) => setPayoutConfig({ address: e.target.value })}
              placeholder="0x0000000000000000000000000000000000000000"
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Destination address for collected funds and revenue. Must be a valid blockchain address.
            </p>
          </div>

          {/* Payout Chain */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Payout Chain</Label>
            <Select
              value={payoutConfig.chain}
              onValueChange={(value) => setPayoutConfig({ chain: value as Ecosystem })}
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
              The blockchain network where funds will be sent.
            </p>
          </div>

          {/* Auto-Sweep Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border/40 bg-black/20 p-3">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">Automatic Sweeping</Label>
              <p className="text-[11px] text-muted-foreground">
                Automatically consolidate dust amounts
              </p>
            </div>
            <Switch
              checked={payoutConfig.autoSweep}
              onCheckedChange={(checked) => setPayoutConfig({ autoSweep: checked })}
            />
          </div>

          {/* Min Sweep Amount */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Minimum Sweep Amount (USDC)</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={payoutConfig.minSweepAmount}
              onChange={(e) => setPayoutConfig({ minSweepAmount: parseInt(e.target.value) || 0 })}
              placeholder="50"
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Minimum balance required before triggering an automatic sweep to payout address.
            </p>
          </div>

          {/* Info Box */}
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
            <p className="text-xs text-emerald-300">
              <strong>ℹ️ Note:</strong> Payout details are registered in the operational config when you compile the SDK. All future transactions will respect these settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
