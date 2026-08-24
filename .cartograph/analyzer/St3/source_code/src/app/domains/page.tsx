"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Globe,
  Plus,
  MoreHorizontal,
  Trash2,
  Pause,
  Play,
  Download,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import type { DomainConfig } from "@/lib/types";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  paused: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  expired: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function DomainsPage() {
  const { domains, addDomain, removeDomain, updateDomain } = useStore();
  const [newDomain, setNewDomain] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    const domain: DomainConfig = {
      id: `domain-${Date.now()}`,
      domain: newDomain.trim(),
      status: "active",
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      sessions: 0,
      totalValueUSD: 0,
    };
    addDomain(domain);
    setNewDomain("");
    setDialogOpen(false);
  };

  const toggleStatus = (id: string, current: string) => {
    updateDomain(id, { status: current === "active" ? "paused" : "active" });
  };

  const activeDomains = domains.filter((d) => d.status === "active");
  const totalSessions = domains.reduce((acc, d) => acc + d.sessions, 0);
  const totalValue = domains.reduce((acc, d) => acc + d.totalValueUSD, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Domain Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add, rotate, or remove domains and export deployment packages
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Domain</DialogTitle>
              <DialogDescription>
                Register a new domain for your WaaS deployment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm">Domain Name</Label>
                <Input
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="app.yourdomain.com"
                  className="font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDomain}>Add Domain</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Domains</span>
            </div>
            <p className="text-2xl font-bold">{domains.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Active</p>
            <p className="text-2xl font-bold text-emerald-500">{activeDomains.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Sessions</p>
            <p className="text-2xl font-bold">{totalSessions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Value</p>
            <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Domain Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Registered Domains</CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-3.5 w-3.5" />
              Export All Packages
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Domain</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Sessions</TableHead>
                <TableHead className="text-xs text-right">Total Value</TableHead>
                <TableHead className="text-xs">Created</TableHead>
                <TableHead className="text-xs">Last Activity</TableHead>
                <TableHead className="text-xs w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.map((domain) => (
                <TableRow key={domain.id} className="text-xs">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono font-medium">{domain.domain}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
                        statusColors[domain.status]
                      }`}
                    >
                      {domain.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {domain.sessions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${domain.totalValueUSD.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(domain.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(domain.lastActivity).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => toggleStatus(domain.id, domain.status)}
                        >
                          {domain.status === "active" ? (
                            <>
                              <Pause className="h-3.5 w-3.5 mr-2" /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 mr-2" /> Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RotateCcw className="h-3.5 w-3.5 mr-2" /> Rotate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-3.5 w-3.5 mr-2" /> Export Package
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="h-3.5 w-3.5 mr-2" /> Visit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => removeDomain(domain.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
