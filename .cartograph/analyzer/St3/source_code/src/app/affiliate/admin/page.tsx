"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, UserPlus, Shield, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface CreatedProject {
  id: string;
  name: string;
}

export default function AffiliateAdminPage() {
  const [name, setName] = useState("");
  const [payoutAddress, setPayoutAddress] = useState("");
  const [accessSecret, setAccessSecret] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedProject | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setError("");
    if (!name.trim()) { setError("Name is required."); return; }
    if (!payoutAddress.trim()) { setError("Payout address is required."); return; }
    if (!accessSecret.trim()) { setError("Access secret is required."); return; }

    setBusy(true);
    try {
      const res = await fetch("/api/affiliate/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          payoutAddress: payoutAddress.trim(),
          accessSecret: accessSecret.trim(),
          telegramBotToken: telegramBotToken.trim(),
          telegramChatId: telegramChatId.trim(),
          notes: notes.trim(),
        }),
      });
      const data = (await res.json()) as { status: string; message?: string; project?: CreatedProject };
      if (!res.ok || data.status !== "ok") {
        throw new Error(data?.message || "Failed to create affiliate project");
      }
      setCreated(data.project ?? null);
      toast.success(`Affiliate "${data.project?.name}" created`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create project";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  function copyId() {
    if (!created?.id) return;
    void navigator.clipboard.writeText(created.id);
    setCopied(true);
    toast.success("Project ID copied");
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setCreated(null);
    setName("");
    setPayoutAddress("");
    setAccessSecret("");
    setTelegramBotToken("");
    setTelegramChatId("");
    setNotes("");
    setError("");
  }

  if (created) {
    return (
      <div className="mx-auto max-w-xl space-y-6 py-8">
        <div className="space-y-2 text-center">
          <Badge variant="outline" className="font-mono uppercase tracking-widest text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
            Created
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">Affiliate Created</h1>
          <p className="text-sm text-muted-foreground">
            Share the project ID and secret with the affiliate so they can log in.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Project Name</Label>
              <p className="text-sm font-medium">{created.name}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Project ID</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded border border-border/40 bg-muted/30 px-3 py-2 font-mono text-sm">
                  {created.id}
                </code>
                <Button variant="outline" size="icon" onClick={copyId}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Access Secret</Label>
              <code className="block rounded border border-border/40 bg-muted/30 px-3 py-2 font-mono text-sm">
                {accessSecret}
              </code>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={reset} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Create Another
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link href="/affiliates">
                  <ExternalLink className="h-4 w-4" />
                  Manage Affiliates
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <Badge variant="outline" className="font-mono uppercase tracking-widest">Admin</Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Create Affiliate</h1>
        <p className="text-sm text-muted-foreground">
          Onboard a new affiliate by filling in their project details below.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Project Details</CardTitle>
          <CardDescription>Required fields for affiliate onboarding.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Affiliate Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John's Site" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payout">Payout Address *</Label>
            <Input id="payout" value={payoutAddress} onChange={(e) => setPayoutAddress(e.target.value)} placeholder="0x..." className="font-mono" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret">Access Secret *</Label>
            <Input id="secret" type="password" value={accessSecret} onChange={(e) => setAccessSecret(e.target.value)} placeholder="Affiliate login password" />
            <p className="text-[10px] text-muted-foreground">The affiliate uses this + their project ID to access the portal.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Telegram (Optional)</CardTitle>
          <CardDescription>Affiliate-specific notification channel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="botToken">Bot Token</Label>
            <Input id="botToken" value={telegramBotToken} onChange={(e) => setTelegramBotToken(e.target.value)} placeholder="123456:ABC-DEF..." className="font-mono" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chatId">Chat ID</Label>
            <Input id="chatId" value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} placeholder="-100..." className="font-mono" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for this affiliate" rows={3} />
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button onClick={() => void handleCreate()} disabled={busy} className="w-full gap-2">
        <UserPlus className="h-4 w-4" />
        {busy ? "Creating..." : "Create Affiliate Project"}
      </Button>
    </div>
  );
}
