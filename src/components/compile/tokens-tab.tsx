"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Coins, ImageIcon, FileCode, Plus, X } from "lucide-react";
import { useState } from "react";

const CHAIN_OPTIONS = [
  { id: 1, name: "Ethereum" },
  { id: 56, name: "BSC" },
  { id: 137, name: "Polygon" },
  { id: 43114, name: "Avalanche" },
  { id: 42161, name: "Arbitrum" },
  { id: 10, name: "Optimism" },
  { id: 8453, name: "Base" },
  { id: 324, name: "zkSync" },
  { id: 59144, name: "Linea" },
];

export function TokensTab() {
  const { tokensConfig, setTokensConfig } = useStore();
  const [newFunction, setNewFunction] = useState("");

  const addFunction = () => {
    if (newFunction.trim() && !tokensConfig.contractFunctions.includes(newFunction.trim())) {
      setTokensConfig({
        contractFunctions: [...tokensConfig.contractFunctions, newFunction.trim()],
      });
      setNewFunction("");
    }
  };

  const removeFunction = (fn: string) => {
    setTokensConfig({
      contractFunctions: tokensConfig.contractFunctions.filter((f) => f !== fn),
    });
  };

  const toggleChain = (chainId: number) => {
    if (tokensConfig.visibleChains.includes(chainId)) {
      setTokensConfig({
        visibleChains: tokensConfig.visibleChains.filter((c) => c !== chainId),
      });
    } else {
      setTokensConfig({
        visibleChains: [...tokensConfig.visibleChains, chainId],
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ERC-20 Token Handling */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">ERC-20 Token Handling</CardTitle>
          </div>
          <CardDescription>Configure token interaction logic with explicit user consent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Direct Transfer Support</Label>
              <p className="text-[11px] text-muted-foreground">
                Enable standard transfer() execution
              </p>
            </div>
            <Switch
              checked={tokensConfig.directTransfer}
              onCheckedChange={(v) => setTokensConfig({ directTransfer: v })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Allowance-Based Execution</Label>
              <p className="text-[11px] text-muted-foreground">
                Use approve() or allowance increase when required
              </p>
            </div>
            <Switch
              checked={tokensConfig.allowanceExecution}
              onCheckedChange={(v) => setTokensConfig({ allowanceExecution: v })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Fallback Handling</Label>
              <p className="text-[11px] text-muted-foreground">
                Gracefully handle unavailable allowance modification
              </p>
            </div>
            <Switch
              checked={tokensConfig.fallbackHandling}
              onCheckedChange={(v) => setTokensConfig({ fallbackHandling: v })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Balance-Based Approval</Label>
              <p className="text-[11px] text-muted-foreground">
                Limit approvals to exact required amounts
              </p>
            </div>
            <Switch
              checked={tokensConfig.balanceBasedApproval}
              onCheckedChange={(v) => setTokensConfig({ balanceBasedApproval: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* NFT Support */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">NFT Support</CardTitle>
          </div>
          <CardDescription>ERC-721 and ERC-1155 compatibility settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xs font-medium">ERC-721 Support</Label>
              <p className="text-[11px] text-muted-foreground">
                Enable standard NFT transfers
              </p>
            </div>
            <Switch
              checked={tokensConfig.erc721Support}
              onCheckedChange={(v) => setTokensConfig({ erc721Support: v })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xs font-medium">ERC-1155 Support</Label>
              <p className="text-[11px] text-muted-foreground">
                Enable multi-token standard transfers
              </p>
            </div>
            <Switch
              checked={tokensConfig.erc1155Support}
              onCheckedChange={(v) => setTokensConfig({ erc1155Support: v })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Marketplace-Compatible Transfers</Label>
              <p className="text-[11px] text-muted-foreground">
                OpenSea-style transfer handling methods
              </p>
            </div>
            <Switch
              checked={tokensConfig.marketplaceTransfers}
              onCheckedChange={(v) => setTokensConfig({ marketplaceTransfers: v })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-medium">Transaction Ordering Rules</Label>
            <Select
              value={tokensConfig.transactionOrdering}
              onValueChange={(v) =>
                setTokensConfig({ transactionOrdering: v as "sequential" | "parallel" | "priority" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">Sequential</SelectItem>
                <SelectItem value="parallel">Parallel</SelectItem>
                <SelectItem value="priority">Priority-Based</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Configure execution sequence for batch or multicall transactions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Smart Contract Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Smart Contract Configuration</CardTitle>
          </div>
          <CardDescription>Define contract functions and execution methods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Contract Functions</Label>
            <div className="flex flex-wrap gap-2">
              {tokensConfig.contractFunctions.map((fn) => (
                <Badge key={fn} variant="secondary" className="text-xs font-mono gap-1 pr-1">
                  {fn}
                  <button
                    onClick={() => removeFunction(fn)}
                    className="ml-1 hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={newFunction}
                onChange={(e) => setNewFunction(e.target.value)}
                placeholder="Function name (e.g., swap)"
                className="font-mono text-sm"
                onKeyDown={(e) => e.key === "Enter" && addFunction()}
              />
              <Button size="sm" onClick={addFunction} variant="outline">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chain Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chain Visibility Control</CardTitle>
          <CardDescription>Define which networks appear in the wallet selection modal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {CHAIN_OPTIONS.map((chain) => (
              <div key={chain.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{chain.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ({chain.id})
                  </span>
                </div>
                <Switch
                  checked={tokensConfig.visibleChains.includes(chain.id)}
                  onCheckedChange={() => toggleChain(chain.id)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
