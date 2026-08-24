"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Download, Filter, RefreshCw } from "lucide-react";
import { useState, useMemo } from "react";
import type { LogEntry } from "@/lib/types";

const typeColors: Record<LogEntry["type"], string> = {
  connection: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  signature: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  approval: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  transfer: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  chain_switch: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  disconnect: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export default function LogsPage() {
  const { logs } = useStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [chainFilter, setChainFilter] = useState<string>("all");

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        !search ||
        log.message.toLowerCase().includes(search.toLowerCase()) ||
        log.wallet.toLowerCase().includes(search.toLowerCase()) ||
        log.domain.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || log.type === typeFilter;
      const matchChain = chainFilter === "all" || log.chain === chainFilter;
      return matchSearch && matchType && matchChain;
    });
  }, [logs, search, typeFilter, chainFilter]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((log) => {
      counts[log.type] = (counts[log.type] || 0) + 1;
    });
    return counts;
  }, [logs]);

  const chains = useMemo(() => [...new Set(logs.map((l) => l.chain))], [logs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Session metadata, network activity, and interaction flow tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Type Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(typeCounts).map(([type, count]) => (
          <Card
            key={type}
            className={`cursor-pointer transition-all ${
              typeFilter === type ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
          >
            <CardContent className="p-3">
              <p className="text-lg font-bold">{count}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{type.replace("_", " ")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs by message, wallet, or domain..."
                className="pl-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="connection">Connection</SelectItem>
                  <SelectItem value="signature">Signature</SelectItem>
                  <SelectItem value="approval">Approval</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="chain_switch">Chain Switch</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="disconnect">Disconnect</SelectItem>
                </SelectContent>
              </Select>
              <Select value={chainFilter} onValueChange={setChainFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Chain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chains</SelectItem>
                  {chains.map((chain) => (
                    <SelectItem key={chain} value={chain}>
                      {chain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary" className="text-xs">
              {filteredLogs.length} results
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Log Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Event Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-[100px]">Type</TableHead>
                  <TableHead className="text-xs">Message</TableHead>
                  <TableHead className="text-xs">Wallet</TableHead>
                  <TableHead className="text-xs">Chain</TableHead>
                  <TableHead className="text-xs">Domain</TableHead>
                  <TableHead className="text-xs w-[160px]">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="text-xs">
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
                          typeColors[log.type]
                        }`}
                      >
                        {log.type.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium max-w-[250px] truncate">
                      {log.message}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {log.wallet}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {log.chain}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[140px] truncate">
                      {log.domain}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
