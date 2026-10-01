"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONTRACT_REGISTRY, type StrategyMode } from "@/lib/contract-registry";
import {
  buildBindingForFunction,
  getCallableContractFunctions,
  getConfiguredContract,
  humanizeDashboardLabel,
} from "@/lib/dashboard-contract-selection";

const METHOD_LABELS: Record<StrategyMode, string> = {
  direct: "Run a standard transaction",
  approve: "Approve tokens, then continue",
  permit: "Use an ERC-2612 signed permit",
  permit2: "Use Permit2 authorization",
  multicall: "Run several actions together",
  gasless: "Use a sponsored gasless transaction",
  eip712: "Use an EIP-712 typed signature",
  eip7702: "Use delegated account execution",
  trails: "Use a cross-chain transaction",
};

export function ContractTab() {
  const { generalConfig, contractsConfig, strategyConfig, setGeneralConfig, setContractsConfig, setStrategyConfig } = useStore();
  const configuredContract = getConfiguredContract(contractsConfig.primary, CONTRACT_REGISTRY, generalConfig.contractId);
  const functions = configuredContract ? getCallableContractFunctions(configuredContract) : [];
  const savedBinding = configuredContract
    ? contractsConfig.functionBindings.find((item) => item.preset === configuredContract.id)
    : undefined;
  const selectedFunctionKey = generalConfig.transactionFunctionKey || savedBinding?.functionKey || functions[0]?.key || "";
  const selectedMethod = configuredContract?.strategySupport?.includes(strategyConfig.mode)
    ? strategyConfig.mode
    : configuredContract?.strategySupport?.[0];
  const binding = savedBinding?.functionKey === selectedFunctionKey
    ? savedBinding
    : configuredContract && selectedFunctionKey
      ? buildBindingForFunction(configuredContract, selectedFunctionKey)
      : null;

  function applyAction(functionKey: string, values: Record<string, string> = {}) {
    if (!configuredContract) return;
    const nextBinding = buildBindingForFunction(configuredContract, functionKey, values);
    if (!nextBinding) return;
    setGeneralConfig({ contractId: configuredContract.id, transactionFunctionKey: functionKey, transactionFunctionName: nextBinding.preset });
    setContractsConfig({
      primary: { ...contractsConfig.primary, selectedFunctions: [nextBinding.functionName] },
      functionBindings: [nextBinding, ...contractsConfig.functionBindings.filter((item) => item.preset !== configuredContract.id)],
    });
    const methods = configuredContract.strategySupport || [];
    setStrategyConfig({
      mode: methods.length && !methods.includes(strategyConfig.mode) ? methods[0] : strategyConfig.mode,
      executionBackend: configuredContract.id,
    });
  }

  function updateArgument(name: string, value: string) {
    if (!binding) return;
    const currentValues = Object.fromEntries(binding.args.map((arg) => [arg.name, arg.value]));
    applyAction(binding.functionKey, { ...currentValues, [name]: value });
  }

  if (!configuredContract) {
    return <Card><CardHeader><CardTitle>Transaction Setup</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">No deployed contract is configured yet.</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Setup</CardTitle>
        <CardDescription>Choose the transaction in plain language. The dashboard uses your already-configured contract.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-xs font-medium">What should happen?</Label>
          <Select value={selectedFunctionKey} onValueChange={(key) => applyAction(key)}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose a transaction action" /></SelectTrigger>
            <SelectContent>{functions.map((fn) => <SelectItem key={fn.key} value={fn.key}>{fn.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {!!configuredContract.strategySupport?.length && <div>
          <Label className="text-xs font-medium">How should it run?</Label>
          <Select value={selectedMethod} onValueChange={(mode) => setStrategyConfig({ mode: mode as StrategyMode, executionBackend: configuredContract.id })}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>{configuredContract.strategySupport.map((mode) => <SelectItem key={mode} value={mode}>{METHOD_LABELS[mode]}</SelectItem>)}</SelectContent>
          </Select>
        </div>}

        {!!binding?.args.length && <div className="space-y-3">
          <div><Label className="text-sm font-medium">Transaction details</Label><p className="text-xs text-muted-foreground">Every value that will be supplied to the selected function remains visible and editable.</p></div>
          <div className="grid gap-4 md:grid-cols-2">
            {binding.args.map((arg) => <div key={`${binding.functionKey}-${arg.name}`}>
              <Label className="text-xs">{humanizeDashboardLabel(arg.name)}</Label>
              <Input className="mt-1.5 text-sm" value={arg.value} onChange={(event) => updateArgument(arg.name, event.target.value)} />
              <p className="mt-1 text-[10px] text-muted-foreground">Expected value: {arg.type}</p>
            </div>)}
          </div>
        </div>}

        <details className="rounded-lg border bg-muted/20 p-4 text-xs">
          <summary className="cursor-pointer font-medium">Transaction review</summary>
          <div className="mt-3 space-y-1 text-muted-foreground">
            <p>Configured contract: <span className="text-foreground">{contractsConfig.primary.name}</span></p>
            <p className="break-all">Address: <span className="font-mono text-foreground">{contractsConfig.primary.address}</span></p>
            <p>Function: <span className="font-mono text-foreground">{binding?.functionKey || "Not selected"}</span></p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
