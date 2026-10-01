"use client";

import { useMemo, useState } from "react";
import type { Address, TypedData, TypedDataDefinition } from "viem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEcosystemLabel } from "@/lib/ecosystems";
import { getWalletClient, connectInjected } from "@/lib/web3";
import type { FrontpageAction, FrontpageConfig } from "@/lib/frontpage-config";
import { toCompiledContractAction } from "@/lib/contract-actions";
import { prepareContractTransaction } from "@/lib/execute-contract-action";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}

function stringifyValue(value: unknown) {
  return JSON.stringify(
    value,
    (_, current) => (typeof current === "bigint" ? current.toString() : current),
    2,
  );
}

function parseJson(value: string) {
  return JSON.parse(value) as unknown;
}

function normalizeParamValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeParamValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, current]) => [key, normalizeParamValue(current)]),
    );
  }
  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return BigInt(value);
  }
  return value;
}

function parseParamsJson(value: string) {
  const parsed = value.trim() ? parseJson(value) : [];
  if (!Array.isArray(parsed)) {
    throw new Error("Params JSON must be an array.");
  }
  return parsed.map(normalizeParamValue);
}

function getActionMethodName(action: Extract<FrontpageAction, { kind: "contractWrite" }>) {
  const maybeMethod = action.methodAbi as { name?: unknown };
  return typeof maybeMethod.name === "string" ? maybeMethod.name : "unknown";
}

type ActionEmbedProps = {
  config: FrontpageConfig;
};

export function ActionEmbed({ config }: ActionEmbedProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const shortAddress = useMemo(() => {
    if (!walletAddress) return null;
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  }, [walletAddress]);

  const ecosystemMeta = useMemo(() => {
    if (config.ecosystem === "solana") {
      const cluster = config.ecosystemConfig?.solana?.cluster || "mainnet-beta";
      const programId = config.ecosystemConfig?.solana?.programId || "Not configured";
      return `Cluster ${cluster} • Program ${programId}`;
    }

    if (config.ecosystem === "tron") {
      const network = config.ecosystemConfig?.tron?.network || "mainnet";
      const contract = config.ecosystemConfig?.tron?.contractAddress || "Not configured";
      return `${network} • ${contract}`;
    }

    return `Chain ${config.chainId}`;
  }, [config]);

  async function connect() {
    setError(null);
    try {
      if (config.ecosystem !== "evm") {
        throw new Error(`${getEcosystemLabel(config.ecosystem)} wallet runtime is scaffolded but not connected yet.`);
      }
      const { address } = await connectInjected();
      setWalletAddress(address);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function runAction(action: FrontpageAction) {
    setBusyId(action.id);
    setError(null);
    try {
      if (!walletAddress) {
        throw new Error("Connect your wallet first.");
      }

      if (config.ecosystem !== "evm") {
        throw new Error(`${getEcosystemLabel(config.ecosystem)} execution adapter is scaffolded but not implemented yet.`);
      }

      const wallet = getWalletClient();

      if (action.kind === "typedDataSign") {
        const domain = parseJson(action.domainJson) as TypedDataDefinition["domain"];
        const types = parseJson(action.typesJson) as TypedData;
        const message = parseJson(action.messageJson) as Record<string, unknown>;
        const signature = await wallet.signTypedData({
          account: walletAddress as Address,
          domain,
          types,
          primaryType: action.primaryType,
          message,
        });
        setResults((current) => ({
          ...current,
          [action.id]: stringifyValue({ signature }),
        }));
        return;
      }

      const compiledAction = toCompiledContractAction(action);
      const prepared = prepareContractTransaction(compiledAction, walletAddress, parseParamsJson(action.paramsJson));
      const hash = await wallet.sendTransaction({
        account: walletAddress as Address,
        to: prepared.transaction.to,
        data: prepared.transaction.data,
        value: prepared.transaction.value ? BigInt(prepared.transaction.value) : undefined,
      });

      setResults((current) => ({
        ...current,
        [action.id]: stringifyValue({ hash }),
      }));
    } catch (err) {
      setResults((current) => ({
        ...current,
        [action.id]: `Error: ${getErrorMessage(err)}`,
      }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-none border border-border/40 bg-black/40 backdrop-blur-2xl p-8 shadow-2xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--primary), transparent 40%), radial-gradient(circle at 80% 0%, oklch(0.7 0.15 210), transparent 30%)",
            filter: "blur(24px)",
          }}
        />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <Badge variant="outline" className="rounded-none border-primary/20 bg-primary/10 font-mono uppercase tracking-widest text-primary">
              {config.hero.badge}
            </Badge>
            <Badge variant="outline" className="rounded-none font-mono uppercase tracking-widest text-[10px]">
              {getEcosystemLabel(config.ecosystem)}
            </Badge>
            <h1 className="font-display text-4xl lg:text-6xl font-bold tracking-tight text-white uppercase leading-[0.9]">
              {config.hero.title}
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-muted-foreground font-mono">
              {config.hero.copy}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3">
            {walletAddress ? (
              <Button
                className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-display uppercase tracking-widest text-xs"
                onClick={() => setWalletAddress(null)}
              >
                {shortAddress}
              </Button>
            ) : (
              <Button
                className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-display uppercase tracking-widest text-xs"
                onClick={() => void connect()}
              >
                Connect Wallet
              </Button>
            )}
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              {ecosystemMeta}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <Card className="rounded-none border-destructive/30 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {config.actions.map((action) => (
          <Card key={action.id} className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
            <CardHeader className="border-b border-border/40">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Badge variant="outline" className="rounded-none font-mono uppercase tracking-widest text-[10px]">
                    {action.kind}
                  </Badge>
                  <CardTitle className="font-display uppercase tracking-wide">
                    {action.title}
                  </CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {action.kind === "contractWrite" ? (
                <div className="space-y-2 text-xs font-mono text-muted-foreground">
                  <p>
                    {config.ecosystem === "tron" ? "Contract" : config.ecosystem === "solana" ? "Program" : "Contract"}:{" "}
                    {config.ecosystem === "tron"
                      ? config.ecosystemConfig?.tron?.contractAddress || action.contractAddress
                      : config.ecosystem === "solana"
                        ? config.ecosystemConfig?.solana?.programId || action.contractAddress
                        : action.contractAddress}
                  </p>
                  <p>Method: {getActionMethodName(action)}</p>
                </div>
              ) : (
                <div className="space-y-2 text-xs font-mono text-muted-foreground">
                  <p>Primary Type: {action.primaryType}</p>
                  <p>Explicit user signature required before proceeding.</p>
                </div>
              )}

              <Button
                className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-display uppercase tracking-widest text-xs"
                disabled={busyId === action.id || !walletAddress}
                onClick={() => void runAction(action)}
              >
                {busyId === action.id ? "Running..." : action.ctaLabel}
              </Button>

              {results[action.id] ? (
                <pre className="overflow-auto rounded-none border border-border/40 bg-black/60 p-4 text-xs font-mono leading-6 text-muted-foreground">
                  {results[action.id]}
                </pre>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
