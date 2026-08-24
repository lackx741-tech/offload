"use client";

import { useMemo } from "react";
import { SequenceConnect, useOpenConnectModal } from "@0xsequence/connect";
import { createConfig as createSequenceConfig } from "../../../node_modules/@0xsequence/connect/dist/esm/config/createConfig.js";
import { useAccount, useDisconnect } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildSequenceWaasConfig } from "@/lib/sequence-config";
import type { ModalConfig } from "@/lib/types";
import { ExternalLink, KeyRound, X } from "lucide-react";

function shortAddress(value?: string) {
  if (!value) return "";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function SequenceSandboxActions({ projectAccessKey, walletUrl }: { projectAccessKey: string; walletUrl: string }) {
  const { setOpenConnectModal } = useOpenConnectModal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const ready = Boolean(projectAccessKey);

  return (
    <Card className="rounded-none border-border/40 bg-black/30 backdrop-blur-xl">
      <CardHeader className="border-b border-border/40">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-none border-primary/20 bg-primary/10 font-mono uppercase tracking-widest text-primary">
            Sequence Sandbox
          </Badge>
          {walletUrl ? <Badge variant="secondary">Hosted Wallet</Badge> : <Badge variant="secondary">Connect Modal</Badge>}
        </div>
        <CardTitle className="font-display text-xl uppercase tracking-wide">Sequence Modal Runtime</CardTitle>
        <CardDescription>
          Real Sequence connect flow scoped to the compile workspace so you can test the modal without wrapping the whole app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="rounded-none border border-border/40 bg-black/20 p-4 text-sm text-muted-foreground">
          {isConnected ? `Connected wallet: ${shortAddress(address || undefined)}` : ready ? "Sequence is configured. Open the connect modal to test the hosted flow." : "Add your Sequence project access key first."}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setOpenConnectModal(true)}
            disabled={!ready}
            className="rounded-none gap-2"
          >
            <KeyRound className="h-4 w-4" />
            Open Sequence Connect
          </Button>
          {walletUrl ? (
            <Button variant="outline" className="rounded-none gap-2" asChild>
              <a href={walletUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                Open Hosted Wallet
              </a>
            </Button>
          ) : null}
          {isConnected ? (
            <Button variant="outline" onClick={() => disconnect()} className="rounded-none gap-2">
              <X className="h-4 w-4" />
              Disconnect
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function SequenceModalSandbox({
  modalConfig,
  appName,
}: {
  modalConfig: ModalConfig;
  appName: string;
}) {
  const projectAccessKey = modalConfig.sequenceProjectAccessKey || process.env.NEXT_PUBLIC_SEQUENCE_PROJECT_ACCESS_KEY || "";
  const waasConfigKey = modalConfig.sequenceWaasConfigKey || process.env.NEXT_PUBLIC_SEQUENCE_WAAS_CONFIG_KEY || "";
  const walletUrl = modalConfig.sequenceWalletUrl || process.env.NEXT_PUBLIC_SEQUENCE_WALLET_URL || "";

  const config = useMemo(() => {
    const base = buildSequenceWaasConfig({
      walletConnectProjectId:
        modalConfig.walletConnectProjectId || undefined,
    });

    return createSequenceConfig("waas", {
      ...base,
      projectAccessKey,
      waasConfigKey: waasConfigKey || base.waasConfigKey,
      appName,
      defaultTheme: modalConfig.themeMode,
      email: modalConfig.enableEmailOption,
      chainIds: modalConfig.preferredChains.length
        ? modalConfig.preferredChains
        : base.chainIds,
      defaultChainId:
        modalConfig.preferredChains[0] || base.defaultChainId,
      walletUrl: walletUrl || undefined,
    });
  }, [
    appName,
    modalConfig.enableEmailOption,
    modalConfig.preferredChains,
    modalConfig.themeMode,
    modalConfig.walletConnectProjectId,
    projectAccessKey,
    waasConfigKey,
    walletUrl,
  ]);

  if (!projectAccessKey) {
    return (
      <Card className="rounded-none border-border/40 bg-black/30 backdrop-blur-xl">
        <CardHeader className="border-b border-border/40">
          <CardTitle className="font-display text-xl uppercase tracking-wide">Sequence Modal Runtime</CardTitle>
          <CardDescription>Add your Sequence access keys in the modal config to activate the real connect flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 p-6 text-sm text-muted-foreground">
          <p>Required:</p>
          <p><code>Sequence Project Access Key</code></p>
          <p>Optional:</p>
          <p><code>Sequence WaaS Config Key</code></p>
          <p>Required for ecosystem hosted wallet flows:</p>
          <p><code>Sequence Wallet URL</code></p>
        </CardContent>
      </Card>
    );
  }

  return (
    <SequenceConnect config={config}>
      <SequenceSandboxActions projectAccessKey={projectAccessKey} walletUrl={walletUrl} />
    </SequenceConnect>
  );
}
