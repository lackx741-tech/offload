"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ArrowUpDown,
  RotateCcw,
  GitBranch,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Shield,
  Zap,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ContractFunctionBinding } from "@/lib/types";
import type { OperationalConfig } from "@/lib/operational-config-store";

const typeIcons: Record<string, React.ElementType> = {
  priority: ArrowUpDown,
  retry: RotateCcw,
  conditional: GitBranch,
};

const typeColors: Record<string, string> = {
  priority: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  retry: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  conditional: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function StrategyPage() {
  const { strategyRules, toggleStrategyRule } = useStore();
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [functionBindings, setFunctionBindings] = useState<ContractFunctionBinding[]>([]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedRules);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRules(next);
  };

  const priorityRules = strategyRules.filter((r) => r.type === "priority");
  const retryRules = strategyRules.filter((r) => r.type === "retry");
  const conditionalRules = strategyRules.filter((r) => r.type === "conditional");

  const enabledCount = strategyRules.filter((r) => r.enabled).length;

  useEffect(() => {
    let active = true;
    async function loadOperationalConfig() {
      try {
        const res = await fetch("/api/operational-config", { cache: "no-store" });
        const data = (await res.json()) as { config?: OperationalConfig };
        if (!active || !res.ok || !data.config) return;
        setFunctionBindings(data.config.contracts.functionBindings || []);
      } catch {
        // keep static view when config is unavailable
      }
    }
    void loadOperationalConfig();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Strategy Engine</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Priority rules, retry logic, conditional flows, and simulated contract functions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            {enabledCount}/{strategyRules.length} rules active
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <ArrowUpDown className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Priority Rules</p>
              <p className="text-xl font-bold">{priorityRules.length}</p>
              <p className="text-[10px] text-muted-foreground">
                {priorityRules.filter((r) => r.enabled).length} active
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <RotateCcw className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Retry Rules</p>
              <p className="text-xl font-bold">{retryRules.length}</p>
              <p className="text-[10px] text-muted-foreground">
                {retryRules.filter((r) => r.enabled).length} active
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <GitBranch className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Conditional Rules</p>
              <p className="text-xl font-bold">{conditionalRules.length}</p>
              <p className="text-[10px] text-muted-foreground">
                {conditionalRules.filter((r) => r.enabled).length} active
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Execution Flow Diagram */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Execution Flow</CardTitle>
          </div>
          <CardDescription>Transaction processing pipeline with configurable strategy layers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 flex-wrap py-4">
            {[
              { label: "scanWallet()", color: "bg-blue-500/20 text-blue-400" },
              { label: "rankAssetsByUSD()", color: "bg-indigo-500/20 text-indigo-400" },
              { label: "filterDust()", color: "bg-violet-500/20 text-violet-400" },
              { label: "prioritizeStablecoins()", color: "bg-purple-500/20 text-purple-400" },
              { label: "approve / permit2", color: "bg-amber-500/20 text-amber-400" },
              { label: "transferFrom / multicall", color: "bg-emerald-500/20 text-emerald-400" },
              { label: "sweep()", color: "bg-cyan-500/20 text-cyan-400" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${step.color}`}
                >
                  {step.label}
                </span>
                {i < 6 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Simulated Contract Functions */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Simulated Contract Functions</CardTitle>
          </div>
          <CardDescription>
            Pre-configured execution strategies for common Web3 interaction patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: "Claim", preset: "claim", desc: "Token claim flow" },
              { name: "Reward", preset: "reward", desc: "Reward distribution" },
              { name: "Security", preset: "security", desc: "Verification flow" },
              { name: "Swap", preset: "swap", desc: "DEX execution" },
              { name: "Connect", preset: "connect", desc: "Connect & execute" },
              { name: "Multicall", preset: "multicall", desc: "Batch operations" },
            ].map((fn) => {
              const binding = functionBindings.find((item) => item.preset === fn.preset);
              return (
                <div
                  key={fn.name}
                  className="rounded-lg border bg-accent/30 p-3 text-center hover:bg-accent/60 transition-colors cursor-pointer"
                >
                  <p className="text-sm font-medium">{fn.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {binding ? `${binding.functionName}() -> ${binding.contractName}` : fn.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Priority Rules */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm font-medium">Priority Rules</CardTitle>
          </div>
          <CardDescription>Asset prioritization and execution ordering logic</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {priorityRules.map((rule) => (
              <RuleRow
                key={rule.id}
                rule={rule}
                expanded={expandedRules.has(rule.id)}
                onToggleExpand={() => toggleExpand(rule.id)}
                onToggleEnabled={() => toggleStrategyRule(rule.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Retry Rules */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-sm font-medium">Retry Rules</CardTitle>
          </div>
          <CardDescription>Fallback execution pathways and retry strategies</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {retryRules.map((rule) => (
              <RuleRow
                key={rule.id}
                rule={rule}
                expanded={expandedRules.has(rule.id)}
                onToggleExpand={() => toggleExpand(rule.id)}
                onToggleEnabled={() => toggleStrategyRule(rule.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conditional Rules */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-purple-500" />
            <CardTitle className="text-sm font-medium">Conditional Rules</CardTitle>
          </div>
          <CardDescription>Threshold-based processing and conditional execution flows</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {conditionalRules.map((rule) => (
              <RuleRow
                key={rule.id}
                rule={rule}
                expanded={expandedRules.has(rule.id)}
                onToggleExpand={() => toggleExpand(rule.id)}
                onToggleEnabled={() => toggleStrategyRule(rule.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface RuleRowProps {
  rule: { id: string; name: string; type: string; enabled: boolean; config: Record<string, unknown>; description: string };
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleEnabled: () => void;
}

function RuleRow({ rule, expanded, onToggleExpand, onToggleEnabled }: RuleRowProps) {
  const Icon = typeIcons[rule.type] || Shield;

  return (
    <div className="px-4">
      <div className="flex items-center gap-3 py-3">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
        <button onClick={onToggleExpand} className="shrink-0">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{rule.name}</span>
            <span
              className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
                typeColors[rule.type]
              }`}
            >
              {rule.type}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
        </div>
        <Switch checked={rule.enabled} onCheckedChange={onToggleEnabled} />
      </div>

      {expanded && (
        <div className="pb-3 pl-[52px]">
          <div className="rounded-lg bg-accent/50 p-3">
            <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wider">
              Configuration
            </p>
            <pre className="text-xs font-mono text-muted-foreground">
              {JSON.stringify(rule.config, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
