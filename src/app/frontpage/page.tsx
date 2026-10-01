"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LayoutTemplate,
  Sparkles,
  Wand2,
  MonitorPlay,
  Copy,
  Save,
  Database,
  RefreshCw,
  FileCode2,
  ExternalLink,
  ShieldCheck,
  Play,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionEmbed } from "@/components/frontpage/action-embed";
import { useStore } from "@/lib/store";
import { deriveCompileConfigFromFrontpage } from "@/lib/frontpage-compile-sync";
import type { CompileConfig } from "@/lib/compile-config-store";
import { ECOSYSTEM_OPTIONS } from "@/lib/ecosystems";
import type { Ecosystem } from "@/lib/types";
import {
  FRONT_PAGE_CONFIG_KEY,
  type FrontpageAction,
  type FrontpageConfig,
} from "@/lib/frontpage-config";
import type { OperationalConfig } from "@/lib/operational-config-store";

type AbiFunction = {
  type: "function";
  name: string;
  stateMutability?: "pure" | "view" | "nonpayable" | "payable";
  inputs?: Array<{ name?: string; type: string }>;
  outputs?: Array<{ name?: string; type: string }>;
};

type ContractListItem = {
  id: string;
  name: string;
  relativePath: string;
};

type SavedImport = ContractListItem & {
  source: "saved";
  abi: unknown[];
  addressHint?: string;
  savedAt: string;
};

const SAVED_IMPORTS_KEY = "stealth-v26-contract-imports";

const HERO_PRESETS = {
  mint: {
    badge: "Mint Page",
    title: "Mint directly from your site",
    copy: "Use one clear CTA, one wallet connection flow, and one contract action instead of exposing the full ABI.",
    cta: "Mint now",
  },
  buy: {
    badge: "Buy Page",
    title: "Turn your contract into a purchase flow",
    copy: "Keep the UI focused on one user goal and route the interaction through a clean action card.",
    cta: "Buy now",
  },
  claim: {
    badge: "Claim Page",
    title: "Create a clear claim experience",
    copy: "Present one explicit onchain action and keep the copy aligned with what the wallet will actually ask for.",
    cta: "Claim now",
  },
  stake: {
    badge: "Stake Page",
    title: "Launch a staking action panel",
    copy: "Use a compact, dark operator-style layout that matches the rest of StealthV26.",
    cta: "Stake now",
  },
  generic: {
    badge: "Generic Action",
    title: "Map any contract write to a public CTA",
    copy: "Build one focused frontpage action and ship it into any page or route with a single embed component.",
    cta: "Execute action",
  },
  eip712: {
    badge: "EIP-712 Sign",
    title: "Collect an explicit typed signature",
    copy: "Use a transparent typed-data action for consent, login, or structured approvals where the user sees exactly what they are signing.",
    cta: "Sign typed data",
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFunction(x: unknown): x is AbiFunction {
  return isRecord(x) && x.type === "function" && typeof x.name === "string";
}

function getFunctionKey(fn: AbiFunction) {
  return `${fn.name}(${(fn.inputs || []).map((input) => input.type).join(",")})`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}

function buildTypedDataAction(id: string): Extract<FrontpageAction, { kind: "typedDataSign" }> {
  return {
    kind: "typedDataSign",
    id,
    title: "Sign explicit typed data",
    description: "Use this for transparent login or consent flows where the user clearly understands what they are signing.",
    ctaLabel: "Sign consent",
    domainJson: JSON.stringify(
      {
        name: "StealthV26",
        version: "1",
        chainId: 1,
        verifyingContract: "0x0000000000000000000000000000000000000000",
      },
      null,
      2,
    ),
    typesJson: JSON.stringify(
      {
        Consent: [
          { name: "user", type: "address" },
          { name: "session", type: "string" },
        ],
      },
      null,
      2,
    ),
    primaryType: "Consent",
    messageJson: JSON.stringify(
      {
        user: "0x0000000000000000000000000000000000000000",
        session: "frontpage-access",
      },
      null,
      2,
    ),
  };
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

export default function FrontpagePage() {
  const {
    generalConfig,
    setGeneralConfig,
    setWalletConfig,
    setModalConfig,
    setTokensConfig,
    setAdvancedConfig,
    setPayoutConfig,
  } = useStore();
  const [ecosystem, setEcosystem] = useState<Ecosystem>(generalConfig.ecosystem);
  const [solanaCluster, setSolanaCluster] = useState(generalConfig.solanaCluster);
  const [solanaProgramId, setSolanaProgramId] = useState(generalConfig.solanaProgramId);
  const [solanaRpcUrl, setSolanaRpcUrl] = useState(generalConfig.solanaRpcUrl);
  const [tronNetwork, setTronNetwork] = useState(generalConfig.tronNetwork);
  const [tronContractAddress, setTronContractAddress] = useState(generalConfig.tronContractAddress);
  const [tronRpcUrl, setTronRpcUrl] = useState(generalConfig.tronRpcUrl);
  const [contractAddress, setContractAddress] = useState("");
  const [chainId, setChainId] = useState("1");
  const [abiText, setAbiText] = useState("");
  const [functions, setFunctions] = useState<AbiFunction[]>([]);
  const [selectedFunctionKey, setSelectedFunctionKey] = useState("");
  const [heroBadge, setHeroBadge] = useState<string>(HERO_PRESETS.mint.badge);
  const [heroTitle, setHeroTitle] = useState<string>(HERO_PRESETS.mint.title);
  const [heroCopy, setHeroCopy] = useState<string>(HERO_PRESETS.mint.copy);
  const [ctaLabel, setCtaLabel] = useState<string>(HERO_PRESETS.mint.cta);
  const [paramsJson, setParamsJson] = useState("[]");
  const [valueWei, setValueWei] = useState("");
  const defaultTypedAction = useMemo(() => buildTypedDataAction("typed-sign-primary"), []);
  const [typedActionEnabled, setTypedActionEnabled] = useState(false);
  const [typedActionTitle, setTypedActionTitle] = useState(defaultTypedAction.title);
  const [typedActionDescription, setTypedActionDescription] = useState(defaultTypedAction.description);
  const [typedActionCta, setTypedActionCta] = useState(defaultTypedAction.ctaLabel);
  const [typedPrimaryType, setTypedPrimaryType] = useState(defaultTypedAction.primaryType);
  const [typedDomainJson, setTypedDomainJson] = useState(defaultTypedAction.domainJson);
  const [typedTypesJson, setTypedTypesJson] = useState(defaultTypedAction.typesJson);
  const [typedMessageJson, setTypedMessageJson] = useState(defaultTypedAction.messageJson);
  const [configText, setConfigText] = useState("");
  const [compileFromFrontpageBusy, setCompileFromFrontpageBusy] = useState(false);
  const [compiledScriptTag, setCompiledScriptTag] = useState('<script src="./script.js" defer></script>');
  const [compiledSize, setCompiledSize] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [artifactList, setArtifactList] = useState<ContractListItem[]>([]);
  const [savedImports, setSavedImports] = useState<SavedImport[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState("");
  const [artifactBusy, setArtifactBusy] = useState(false);
  const [operationalConfig, setOperationalConfig] = useState<OperationalConfig | null>(null);

  const selectedFunction = useMemo(
    () => functions.find((fn) => getFunctionKey(fn) === selectedFunctionKey),
    [functions, selectedFunctionKey],
  );

  const generatedConfig = useMemo<FrontpageConfig>(() => {
    const currentChainId = Number(chainId || "1");
    const actions: FrontpageAction[] = [];

    if (selectedFunction) {
      actions.push({
        kind: "contractWrite",
        id: "primary-contract-action",
        title: ctaLabel,
        description: heroCopy,
        ctaLabel,
        chainId: Number.isNaN(currentChainId) ? 1 : currentChainId,
        contractAddress,
        methodAbi: selectedFunction,
        paramsJson,
        valueWei: valueWei || undefined,
      });
    }

    if (typedActionEnabled) {
      actions.push({
        kind: "typedDataSign",
        id: "typed-sign-primary",
        title: typedActionTitle,
        description: typedActionDescription,
        ctaLabel: typedActionCta,
        domainJson: typedDomainJson,
        typesJson: typedTypesJson,
        primaryType: typedPrimaryType,
        messageJson: typedMessageJson,
      });
    }

    return {
      version: 1,
      ecosystem,
      operational: operationalConfig ?? undefined,
      ecosystemConfig: {
        solana: {
          cluster: solanaCluster,
          programId: solanaProgramId,
          rpcUrl: solanaRpcUrl || undefined,
        },
        tron: {
          network: tronNetwork,
          contractAddress: tronContractAddress,
          rpcUrl: tronRpcUrl || undefined,
        },
      },
      hero: {
        badge: heroBadge,
        title: heroTitle,
        copy: heroCopy,
      },
      chainId: Number.isNaN(currentChainId) ? 1 : currentChainId,
      contractAddress,
      actions,
    };
  }, [
    chainId,
    contractAddress,
    ctaLabel,
    ecosystem,
    solanaCluster,
    solanaProgramId,
    solanaRpcUrl,
    tronContractAddress,
    tronNetwork,
    tronRpcUrl,
    operationalConfig,
    heroBadge,
    heroCopy,
    heroTitle,
    paramsJson,
    selectedFunction,
    typedActionCta,
    typedActionDescription,
    typedActionEnabled,
    typedActionTitle,
    typedDomainJson,
    typedMessageJson,
    typedPrimaryType,
    typedTypesJson,
    valueWei,
  ]);

  const previewConfig = useMemo<FrontpageConfig>(() => {
    try {
      return JSON.parse(configText) as FrontpageConfig;
    } catch {
      return generatedConfig;
    }
  }, [configText, generatedConfig]);

  useEffect(() => {
    let active = true;

    async function loadSavedCompileConfig() {
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
      } catch {
        // Keep defaults when no saved config is available.
      }
    }

    void loadSavedCompileConfig();

    return () => {
      active = false;
    };
  }, [
    setAdvancedConfig,
    setGeneralConfig,
    setModalConfig,
    setPayoutConfig,
    setTokensConfig,
    setWalletConfig,
  ]);

  useEffect(() => {
    setConfigText(JSON.stringify(generatedConfig, null, 2));
  }, [generatedConfig]);

  useEffect(() => {
    let active = true;
    async function loadOperationalConfig() {
      try {
        const res = await fetch("/api/operational-config", { cache: "no-store" });
        const data = (await res.json()) as { config?: OperationalConfig };
        if (!active || !res.ok || !data.config) return;
        setOperationalConfig(data.config);
      } catch {
        // Leave operational config unset if unavailable.
      }
    }
    void loadOperationalConfig();
    return () => {
      active = false;
    };
  }, []);

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
    if (!selectedArtifactId || !contractAddress) return;
    setSavedImports((current) =>
      current.map((item) =>
        item.id === selectedArtifactId ? { ...item, addressHint: contractAddress } : item,
      ),
    );
  }, [contractAddress, selectedArtifactId]);

  function applyPreset(preset: keyof typeof HERO_PRESETS) {
    const item = HERO_PRESETS[preset];
    setHeroBadge(item.badge);
    setHeroTitle(item.title);
    setHeroCopy(item.copy);
    setCtaLabel(item.cta);
    if (preset === "eip712") {
      setTypedActionEnabled(true);
      setTypedActionTitle(item.title);
      setTypedActionDescription(item.copy);
      setTypedActionCta(item.cta);
    }
  }

  function parseAbi() {
    setError(null);
    try {
      const parsed = JSON.parse(abiText);
      if (!Array.isArray(parsed)) {
        throw new Error("ABI must be a JSON array.");
      }
      const writableFunctions = parsed
        .filter(isFunction)
        .filter((fn) => !["view", "pure"].includes(fn.stateMutability || "nonpayable"));
      setFunctions(writableFunctions);
      setSelectedFunctionKey(writableFunctions[0] ? getFunctionKey(writableFunctions[0]) : "");
      setStatus(`Loaded ${writableFunctions.length} writable functions.`);
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("");
    }
  }

  async function loadArtifacts() {
    setArtifactBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contracts", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load artifacts");
      setArtifactList(Array.isArray(data?.items) ? data.items : []);
      setStatus(`Loaded ${Array.isArray(data?.items) ? data.items.length : 0} contract artifacts.`);
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("");
    } finally {
      setArtifactBusy(false);
    }
  }

  async function loadSelectedArtifact() {
    if (!selectedArtifactId) return;
    setArtifactBusy(true);
    setError(null);
    try {
      const saved = savedImports.find((item) => item.id === selectedArtifactId);
      if (saved) {
        setAbiText(JSON.stringify(saved.abi, null, 2));

        if (typeof saved.addressHint === "string") {
          setContractAddress(saved.addressHint);
        }

        const writableFunctions = saved.abi
          .filter(isFunction)
          .filter((fn: AbiFunction) => !["view", "pure"].includes(fn.stateMutability || "nonpayable"));

        setFunctions(writableFunctions);
        setSelectedFunctionKey(writableFunctions[0] ? getFunctionKey(writableFunctions[0]) : "");
        setStatus(`Loaded saved ABI from ${saved.name} with ${writableFunctions.length} writable functions.`);
        return;
      }

      const res = await fetch(`/api/contracts/${selectedArtifactId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load artifact");
      const abi = data?.abi;
      if (!Array.isArray(abi)) {
        throw new Error("Artifact ABI is not an array.");
      }

      setAbiText(JSON.stringify(abi, null, 2));

      if (typeof data?.addressHint === "string") {
        setContractAddress(data.addressHint);
      }

      const writableFunctions = abi
        .filter(isFunction)
        .filter((fn: AbiFunction) => !["view", "pure"].includes(fn.stateMutability || "nonpayable"));

      setFunctions(writableFunctions);
      setSelectedFunctionKey(writableFunctions[0] ? getFunctionKey(writableFunctions[0]) : "");
      const savedImport = buildSavedImport({
        name: data?.name || "artifact",
        relativePath: data?.relativePath || `artifact/${selectedArtifactId}.json`,
        abi,
        addressHint:
          contractAddress || (typeof data?.addressHint === "string" ? data.addressHint : undefined),
      });
      setSavedImports((current) => [savedImport, ...current]);
      setSelectedArtifactId(savedImport.id);
      setStatus(`Loaded ABI from ${data?.name || "artifact"} with ${writableFunctions.length} writable functions.`);
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("");
    } finally {
      setArtifactBusy(false);
    }
  }

  async function importArtifactFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    setArtifactBusy(true);
    setError(null);
    try {
      const files = Array.from(fileList);
      const imported: SavedImport[] = [];

      for (const file of files) {
        const raw = await file.text();
        const parsed = JSON.parse(raw) as unknown;
        const abi = pickArtifactAbi(parsed);

        if (!abi) {
          throw new Error(`No ABI found in ${file.name}`);
        }

        const artifactName =
          (isRecord(parsed) && typeof parsed.contractName === "string" && parsed.contractName) ||
          (isRecord(parsed) && typeof parsed.name === "string" && parsed.name) ||
          file.name.replace(/\.json$/i, "");

        imported.push(
          buildSavedImport({
            name: artifactName,
            relativePath: `imports/${file.name}`,
            abi,
            addressHint: pickArtifactAddressHint(parsed),
          }),
        );
      }

      setSavedImports((current) => [...imported, ...current]);
      setSelectedArtifactId(imported[0]?.id || "");
      if (imported[0]) {
        setAbiText(JSON.stringify(imported[0].abi, null, 2));
        if (typeof imported[0].addressHint === "string") {
          setContractAddress(imported[0].addressHint);
        }
        const writableFunctions = imported[0].abi
          .filter(isFunction)
          .filter((fn: AbiFunction) => !["view", "pure"].includes(fn.stateMutability || "nonpayable"));
        setFunctions(writableFunctions);
        setSelectedFunctionKey(writableFunctions[0] ? getFunctionKey(writableFunctions[0]) : "");
      }
      setStatus(`Imported ${imported.length} contract JSON file${imported.length === 1 ? "" : "s"} into shared saved imports.`);
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("");
    } finally {
      setArtifactBusy(false);
    }
  }

  useEffect(() => {
    void loadArtifacts();
  }, []);

  function saveConfig() {
    void (async () => {
      try {
        const parsed = JSON.parse(configText) as FrontpageConfig;
        const res = await fetch("/api/config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ frontpage: parsed }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to save config.");
        }

        window.localStorage.setItem(FRONT_PAGE_CONFIG_KEY, JSON.stringify(parsed));
        setStatus("Saved frontpage config to the server. Open /frontpage/runtime to use it.");
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    })();
  }

  function enableTypedAction() {
    setTypedActionEnabled(true);
    setStatus("Enabled EIP-712 typed-sign action in the frontpage config.");
    setError(null);
  }

  function applyConfigToCompiler() {
    const derived = deriveCompileConfigFromFrontpage(previewConfig);
    setGeneralConfig(derived.general);
    setTokensConfig(derived.tokens);
    setAdvancedConfig(derived.advanced);
    setStatus("Loaded current frontpage config into the integrated script builder.");
    setError(null);
  }

  async function compileAndPublishFromFrontpage() {
    setCompileFromFrontpageBusy(true);
    setError(null);
    try {
      const compileRes = await fetch("/api/frontpage/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontpage: previewConfig }),
      });
      const compileData = (await compileRes.json()) as {
        message?: string;
        script?: string;
        scriptTag?: string;
        filename?: string;
        size?: number;
      };
      if (!compileRes.ok) {
        throw new Error(compileData?.message || "Compilation failed.");
      }
      if (!compileData.script) throw new Error("The compiler returned no script content.");
      const url = URL.createObjectURL(new Blob([compileData.script], { type: "application/javascript" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = compileData.filename || "script.js";
      anchor.click();
      URL.revokeObjectURL(url);
      setCompiledScriptTag(compileData.scriptTag || '<script src="./script.js" defer></script>');
      setCompiledSize(compileData.size || compileData.script.length);
      setStatus("Standalone script.js compiled and downloaded.");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
    } finally {
      setCompileFromFrontpageBusy(false);
    }
  }

  const embedSnippet = useMemo(
    () => `"use client";

import { ActionEmbed } from "@/components/frontpage/action-embed";

const config = ${configText || "{}"};

export default function YourPage() {
  return <ActionEmbed config={config} />;
}`,
    [configText],
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="relative overflow-hidden rounded-none border border-border/40 bg-black/40 backdrop-blur-2xl p-8 shadow-2xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--primary), transparent 40%), radial-gradient(circle at 80% 0%, oklch(0.7 0.15 210), transparent 30%)",
            filter: "blur(24px)",
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-none bg-primary/10 px-3 py-1.5 text-xs text-primary ring-1 ring-primary/20 font-mono tracking-wider uppercase">
              <LayoutTemplate className="h-3.5 w-3.5" />
              <span>Frontpage_Builder</span>
            </div>
            <h1 className="font-display text-4xl lg:text-6xl font-bold tracking-tight text-white uppercase leading-[0.9]">
              Public Action
              <br />
              <span className="text-primary">Panel</span>
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-muted-foreground font-mono">
              Configure a safe wallet-connected frontpage action, preview it in the
              StealthV26 shell, then embed it into any route with one component.
            </p>
            <div className="max-w-sm space-y-2">
              <Label htmlFor="ecosystem-select" className="text-xs font-mono uppercase tracking-widest text-primary">
                Ecosystem
              </Label>
              <select
                id="ecosystem-select"
                className="flex h-9 w-full rounded-none border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={ecosystem}
                onChange={(event) => {
                  const value = event.target.value as Ecosystem;
                  setEcosystem(value);
                  setGeneralConfig({ ecosystem: value });
                }}
              >
                {ECOSYSTEM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {ECOSYSTEM_OPTIONS.find((option) => option.value === ecosystem)?.description}
              </p>
            </div>

            {ecosystem === "solana" ? (
              <div className="max-w-xl grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="solana-cluster" className="text-xs font-mono uppercase tracking-widest text-primary">
                    Cluster
                  </Label>
                  <select
                    id="solana-cluster"
                    className="flex h-9 w-full rounded-none border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                    value={solanaCluster}
                    onChange={(event) => {
                      const value = event.target.value as typeof solanaCluster;
                      setSolanaCluster(value);
                      setGeneralConfig({ solanaCluster: value });
                    }}
                  >
                    <option value="mainnet-beta">mainnet-beta</option>
                    <option value="devnet">devnet</option>
                    <option value="testnet">testnet</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="solana-program-id" className="text-xs font-mono uppercase tracking-widest text-primary">
                    Program ID
                  </Label>
                  <Input
                    id="solana-program-id"
                    value={solanaProgramId}
                    onChange={(event) => {
                      setSolanaProgramId(event.target.value);
                      setGeneralConfig({ solanaProgramId: event.target.value });
                    }}
                    placeholder="Program public key"
                    className="rounded-none font-mono"
                  />
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="solana-rpc-url" className="text-xs font-mono uppercase tracking-widest text-primary">
                    Solana RPC URL
                  </Label>
                  <Input
                    id="solana-rpc-url"
                    value={solanaRpcUrl}
                    onChange={(event) => {
                      setSolanaRpcUrl(event.target.value);
                      setGeneralConfig({ solanaRpcUrl: event.target.value });
                    }}
                    placeholder="Optional custom RPC"
                    className="rounded-none font-mono"
                  />
                </div>
              </div>
            ) : null}

            {ecosystem === "tron" ? (
              <div className="max-w-xl grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="tron-network" className="text-xs font-mono uppercase tracking-widest text-primary">
                    Network
                  </Label>
                  <select
                    id="tron-network"
                    className="flex h-9 w-full rounded-none border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                    value={tronNetwork}
                    onChange={(event) => {
                      const value = event.target.value as typeof tronNetwork;
                      setTronNetwork(value);
                      setGeneralConfig({ tronNetwork: value });
                    }}
                  >
                    <option value="mainnet">mainnet</option>
                    <option value="nile">nile</option>
                    <option value="shasta">shasta</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="tron-contract-address" className="text-xs font-mono uppercase tracking-widest text-primary">
                    Tron Contract
                  </Label>
                  <Input
                    id="tron-contract-address"
                    value={tronContractAddress}
                    onChange={(event) => {
                      setTronContractAddress(event.target.value);
                      setGeneralConfig({ tronContractAddress: event.target.value });
                    }}
                    placeholder="T..."
                    className="rounded-none font-mono"
                  />
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="tron-rpc-url" className="text-xs font-mono uppercase tracking-widest text-primary">
                    Tron RPC URL
                  </Label>
                  <Input
                    id="tron-rpc-url"
                    value={tronRpcUrl}
                    onChange={(event) => {
                      setTronRpcUrl(event.target.value);
                      setGeneralConfig({ tronRpcUrl: event.target.value });
                    }}
                    placeholder="Optional custom RPC"
                    className="rounded-none font-mono"
                  />
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-none font-mono uppercase tracking-widest text-xs" onClick={() => applyPreset("mint")}>
              Mint
            </Button>
            <Button variant="outline" className="rounded-none font-mono uppercase tracking-widest text-xs" onClick={() => applyPreset("buy")}>
              Buy
            </Button>
            <Button variant="outline" className="rounded-none font-mono uppercase tracking-widest text-xs" onClick={() => applyPreset("claim")}>
              Claim
            </Button>
            <Button variant="outline" className="rounded-none font-mono uppercase tracking-widest text-xs" onClick={() => applyPreset("stake")}>
              Stake
            </Button>
            <Button variant="outline" className="rounded-none font-mono uppercase tracking-widest text-xs" onClick={() => applyPreset("generic")}>
              Generic
            </Button>
            <Button
              variant="outline"
              className="rounded-none font-mono uppercase tracking-widest text-xs"
              onClick={() => {
                applyPreset("eip712");
                enableTypedAction();
              }}
            >
              EIP-712
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <Card className="rounded-none border-destructive/30 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {status ? (
        <Card className="rounded-none border-primary/20 bg-primary/5">
          <CardContent className="p-4 text-sm font-mono text-primary">{status}</CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="builder" className="space-y-6">
        <TabsList variant="line" className="rounded-none">
          <TabsTrigger value="builder" className="rounded-none uppercase font-mono tracking-widest text-xs">
            <Wand2 className="h-3.5 w-3.5" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="preview" className="rounded-none uppercase font-mono tracking-widest text-xs">
            <MonitorPlay className="h-3.5 w-3.5" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="embed" className="rounded-none uppercase font-mono tracking-widest text-xs">
            <Copy className="h-3.5 w-3.5" />
            Embed
          </TabsTrigger>
          <TabsTrigger value="script" className="rounded-none uppercase font-mono tracking-widest text-xs">
            <FileCode2 className="h-3.5 w-3.5" />
            Script
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
            <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
              <CardHeader className="border-b border-border/40">
                <CardTitle className="font-display uppercase tracking-wide">Contract Action Setup</CardTitle>
                <CardDescription>
                  Paste ABI JSON, choose one writable function, and turn it into a public CTA.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="rounded-none border border-border/40 bg-black/30 p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono uppercase tracking-widest text-primary">Artifact Loader</p>
                      <p className="text-sm text-muted-foreground">
                        Use your existing project contract JSON artifacts instead of pasting ABI manually.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-none border border-border px-3 py-2 text-xs font-mono uppercase tracking-widest text-foreground hover:bg-accent">
                        <Database className="h-3.5 w-3.5" />
                        Import JSON
                        <input
                          type="file"
                          accept=".json,application/json"
                          multiple
                          className="hidden"
                          onChange={(event) => {
                            void importArtifactFiles(event.target.files);
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                      <Button
                        variant="outline"
                        className="rounded-none font-mono uppercase tracking-widest text-xs"
                        onClick={() => void loadArtifacts()}
                        disabled={artifactBusy}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                    <select
                      className="flex h-9 w-full rounded-none border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                      value={selectedArtifactId}
                      onChange={(e) => setSelectedArtifactId(e.target.value)}
                    >
                      <option value="">Select artifact</option>
                      {savedImports.length ? (
                        <optgroup label="Saved imports">
                          {savedImports.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} · {item.relativePath}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                      {artifactList.length ? (
                        <optgroup label="Project artifacts">
                          {artifactList.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} · {item.relativePath}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                    </select>
                    <Button
                      className="rounded-none font-mono uppercase tracking-widest text-xs"
                      onClick={() => void loadSelectedArtifact()}
                      disabled={!selectedArtifactId || artifactBusy}
                    >
                      <Database className="h-3.5 w-3.5" />
                      Load artifact
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ecosystem === "evm" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="contract-address">Contract address</Label>
                        <Input id="contract-address" value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} placeholder="0x..." className="rounded-none font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chain-id">Chain ID</Label>
                        <Input id="chain-id" value={chainId} onChange={(e) => setChainId(e.target.value)} placeholder="1" className="rounded-none font-mono" />
                      </div>
                    </>
                  ) : ecosystem === "solana" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="solana-program-id-inline">Program ID</Label>
                        <Input
                          id="solana-program-id-inline"
                          value={solanaProgramId}
                          onChange={(e) => {
                            setSolanaProgramId(e.target.value);
                            setGeneralConfig({ solanaProgramId: e.target.value });
                          }}
                          placeholder="Program public key"
                          className="rounded-none font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="solana-cluster-inline">Cluster</Label>
                        <Input
                          id="solana-cluster-inline"
                          value={solanaCluster}
                          onChange={(e) => {
                            const value = e.target.value as typeof solanaCluster;
                            setSolanaCluster(value);
                            setGeneralConfig({ solanaCluster: value });
                          }}
                          placeholder="mainnet-beta"
                          className="rounded-none font-mono"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="tron-contract-inline">Tron Contract</Label>
                        <Input
                          id="tron-contract-inline"
                          value={tronContractAddress}
                          onChange={(e) => {
                            setTronContractAddress(e.target.value);
                            setGeneralConfig({ tronContractAddress: e.target.value });
                          }}
                          placeholder="T..."
                          className="rounded-none font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tron-network-inline">Tron Network</Label>
                        <Input
                          id="tron-network-inline"
                          value={tronNetwork}
                          onChange={(e) => {
                            const value = e.target.value as typeof tronNetwork;
                            setTronNetwork(value);
                            setGeneralConfig({ tronNetwork: value });
                          }}
                          placeholder="mainnet"
                          className="rounded-none font-mono"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abi-json">ABI JSON</Label>
                  <Textarea id="abi-json" value={abiText} onChange={(e) => setAbiText(e.target.value)} rows={10} className="rounded-none font-mono text-xs" placeholder='[{"type":"function","name":"mint",...}]' />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button className="rounded-none font-mono uppercase tracking-widest text-xs" onClick={parseAbi}>
                    Load ABI
                  </Button>
                  <Button variant="outline" className="rounded-none font-mono uppercase tracking-widest text-xs" onClick={enableTypedAction}>
                    <Sparkles className="h-3.5 w-3.5" />
                    Enable EIP-712 action
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hero-badge">Hero badge</Label>
                    <Input id="hero-badge" value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)} className="rounded-none" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cta-label">CTA label</Label>
                    <Input id="cta-label" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className="rounded-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-title">Hero title</Label>
                  <Input id="hero-title" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className="rounded-none" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-copy">Hero copy</Label>
                  <Textarea id="hero-copy" value={heroCopy} onChange={(e) => setHeroCopy(e.target.value)} rows={4} className="rounded-none" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="function-select">Writable function</Label>
                  <select
                    id="function-select"
                    className="flex h-9 w-full rounded-none border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                    value={selectedFunctionKey}
                    onChange={(e) => setSelectedFunctionKey(e.target.value)}
                  >
                    <option value="">Select function</option>
                    {functions.map((fn) => {
                      const key = getFunctionKey(fn);
                      return (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="params-json">Params JSON array</Label>
                  <Textarea id="params-json" value={paramsJson} onChange={(e) => setParamsJson(e.target.value)} rows={4} className="rounded-none font-mono text-xs" placeholder='["1"]' />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value-wei">Native value in wei</Label>
                  <Input id="value-wei" value={valueWei} onChange={(e) => setValueWei(e.target.value)} className="rounded-none font-mono" placeholder="Optional" />
                </div>

                <div className="rounded-none border border-border/40 bg-black/30 p-4 space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-mono uppercase tracking-widest text-primary">EIP-712 Action</p>
                      <p className="text-sm text-muted-foreground">
                        Build a typed-sign frontpage action without hand-editing the config JSON.
                      </p>
                    </div>
                    <Button
                      variant={typedActionEnabled ? "default" : "outline"}
                      className="rounded-none font-mono uppercase tracking-widest text-xs"
                      onClick={() => setTypedActionEnabled((current) => !current)}
                    >
                      {typedActionEnabled ? "Disable EIP-712" : "Enable EIP-712"}
                    </Button>
                  </div>

                  {typedActionEnabled ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="typed-title">Typed action title</Label>
                          <Input
                            id="typed-title"
                            value={typedActionTitle}
                            onChange={(e) => setTypedActionTitle(e.target.value)}
                            className="rounded-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="typed-cta">Typed action CTA</Label>
                          <Input
                            id="typed-cta"
                            value={typedActionCta}
                            onChange={(e) => setTypedActionCta(e.target.value)}
                            className="rounded-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="typed-description">Typed action description</Label>
                        <Textarea
                          id="typed-description"
                          value={typedActionDescription}
                          onChange={(e) => setTypedActionDescription(e.target.value)}
                          rows={3}
                          className="rounded-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="typed-primary-type">Primary Type</Label>
                        <Input
                          id="typed-primary-type"
                          value={typedPrimaryType}
                          onChange={(e) => setTypedPrimaryType(e.target.value)}
                          className="rounded-none font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="typed-domain">Domain JSON</Label>
                        <Textarea
                          id="typed-domain"
                          value={typedDomainJson}
                          onChange={(e) => setTypedDomainJson(e.target.value)}
                          rows={6}
                          className="rounded-none font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="typed-types">Types JSON</Label>
                        <Textarea
                          id="typed-types"
                          value={typedTypesJson}
                          onChange={(e) => setTypedTypesJson(e.target.value)}
                          rows={8}
                          className="rounded-none font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="typed-message">Message JSON</Label>
                        <Textarea
                          id="typed-message"
                          value={typedMessageJson}
                          onChange={(e) => setTypedMessageJson(e.target.value)}
                          rows={8}
                          className="rounded-none font-mono text-xs"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
              <CardHeader className="border-b border-border/40">
                <CardTitle className="font-display uppercase tracking-wide">Frontpage Config</CardTitle>
                <CardDescription>
                  Save this config for the runtime page or embed it directly into any route.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <Textarea value={configText} onChange={(e) => setConfigText(e.target.value)} rows={24} className="rounded-none font-mono text-xs" />
                <div className="flex flex-wrap gap-3">
                  <Button className="rounded-none font-mono uppercase tracking-widest text-xs" onClick={saveConfig}>
                    <Save className="h-3.5 w-3.5" />
                    Save runtime config
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-none font-mono uppercase tracking-widest text-xs"
                    onClick={() => setConfigText(JSON.stringify(generatedConfig, null, 2))}
                  >
                    Regenerate
                  </Button>
                </div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Runtime route: /frontpage/runtime
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <ActionEmbed config={previewConfig} />
        </TabsContent>

        <TabsContent value="embed">
          <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="font-display uppercase tracking-wide">Embed On Any Page</CardTitle>
              <CardDescription>
                Import the reusable embed component and paste this config into any route inside St3.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <pre className="overflow-auto rounded-none border border-border/40 bg-black/60 p-4 text-xs font-mono leading-6 text-muted-foreground">
                {embedSnippet}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="script" className="space-y-6">
          <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
            <CardHeader className="border-b border-border/40">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <CardTitle className="font-display uppercase tracking-wide">Standalone Frontend Compiler</CardTitle>
                  <CardDescription>
                    Compile this exact page into one self-rendering <code className="text-primary">script.js</code>.
                    It creates the interface inline and does not require the dashboard at runtime.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="rounded-none font-mono uppercase tracking-widest text-xs"
                    disabled={compileFromFrontpageBusy}
                    onClick={() => void compileAndPublishFromFrontpage()}
                  >
                    <Play className="h-3.5 w-3.5" />
                    {compileFromFrontpageBusy ? "Compiling..." : "Compile script.js"}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-none font-mono uppercase tracking-widest text-xs"
                    onClick={applyConfigToCompiler}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Use Current Page Config
                  </Button>
                  <Button asChild variant="outline" className="rounded-none font-mono uppercase tracking-widest text-xs">
                    <a href="/compile">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Full Compile
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 rounded-none border border-border/40 bg-black/40 p-5 font-mono text-xs">
                <div className="uppercase tracking-widest text-muted-foreground">Embed on any page</div>
                <code className="block overflow-x-auto text-primary">{compiledScriptTag}</code>
                <p className="text-muted-foreground">
                  {compiledSize === null ? "Compile to download script.js." : `Latest build: ${(compiledSize / 1024).toFixed(2)} KB`}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
