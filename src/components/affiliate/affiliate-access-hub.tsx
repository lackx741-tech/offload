"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, UserRound, Users, KeyRound } from "lucide-react";
import { toast } from "sonner";

const SESSION_KEY = "st3-affiliate-session";

export function AffiliateAccessHub() {
  const router = useRouter();
  const [adminPassword, setAdminPassword] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [adminBusy, setAdminBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminAddress, setAdminAddress] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAdminSession() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json()) as { authenticated?: boolean; address?: string; label?: string };
        if (!active) return;
        setAdminAddress(data?.authenticated ? data?.label || data?.address || null : null);
      } catch {
        if (!active) return;
        setAdminAddress(null);
      }
    }

    void loadAdminSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleAdminLogin() {
    setAdminError("");
    if (!adminPassword) {
      setAdminError("Admin password is required.");
      return;
    }
    setAdminBusy(true);
    try {
      const verifyRes = await fetch("/api/admin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      const verifyData = (await verifyRes.json()) as {
        message?: string;
        session?: { label?: string; address?: string };
      };
      if (!verifyRes.ok) {
        throw new Error(verifyData?.message || "Admin login failed");
      }

      setAdminAddress(verifyData?.session?.label || verifyData?.session?.address || "Global Admin");
      toast.success("Global admin session active");
      router.push("/affiliate");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Admin login failed";
      setAdminError(message);
      toast.error(message);
    } finally {
      setAdminBusy(false);
    }
  }

  async function handleAffiliateLogin() {
    setAuthError("");
    if (!username.trim()) {
      setAuthError("Username is required.");
      return;
    }
    if (!password) {
      setAuthError("Password is required.");
      return;
    }

    setAuthBusy(true);
    try {
      const res = await fetch("/api/affiliate/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = (await res.json()) as {
        message?: string;
        project?: { id: string; name?: string };
      };
      if (!res.ok || !data.project?.id) {
        throw new Error(data?.message || "Access denied");
      }

      window.localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ projectId: data.project.id, projectName: data.project.name }),
      );
      toast.success("Affiliate access granted");
      router.push("/affiliate");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Access denied");
    } finally {
      setAuthBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
        <CardHeader className="border-b border-border/40">
          <Badge variant="outline" className="w-fit rounded-none border-primary/20 bg-primary/10 font-mono uppercase tracking-widest text-primary">
            Global Admin
          </Badge>
          <CardTitle className="font-display text-2xl uppercase tracking-wide">Main App Login</CardTitle>
          <CardDescription>
            Use your global admin password here. This is your full-access general admin path.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="dashboard-admin-password">Admin Password</Label>
            <Input
              id="dashboard-admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              placeholder="Enter global admin password"
              className="rounded-none"
            />
          </div>
          {adminError ? <p className="text-sm text-destructive">{adminError}</p> : null}
          <div className="rounded-none border border-border/40 bg-black/30 p-4 text-sm text-muted-foreground">
            {adminAddress ? `Authenticated as ${adminAddress}` : "Login here, then jump straight into the merged /affiliate portal."}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void handleAdminLogin()} disabled={adminBusy} className="gap-2 rounded-none">
              <KeyRound className="h-4 w-4" />
              {adminBusy ? "Signing in..." : adminAddress ? "Reconnect Admin" : "Login As Global Admin"}
            </Button>
            <Button asChild variant="outline" className="gap-2 rounded-none">
              <Link href="/affiliates">
                <Users className="h-4 w-4" />
                Open Admin
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
        <CardHeader className="border-b border-border/40">
          <Badge variant="outline" className="w-fit rounded-none border-primary/20 bg-primary/10 font-mono uppercase tracking-widest text-primary">
            Affiliate Access
          </Badge>
          <CardTitle className="font-display text-2xl uppercase tracking-wide">Affiliate Login</CardTitle>
          <CardDescription>
            Use the affiliate project credentials here and go directly into the affiliate panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="dashboard-affiliate-username">Username</Label>
            <Input
              id="dashboard-affiliate-username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="aff_..."
              className="rounded-none font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dashboard-affiliate-password">Password</Label>
            <Input
              id="dashboard-affiliate-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter affiliate password"
              className="rounded-none"
            />
          </div>
          {authError ? <p className="text-sm text-destructive">{authError}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void handleAffiliateLogin()} disabled={authBusy} variant="outline" className="gap-2 rounded-none">
              <UserRound className="h-4 w-4" />
              {authBusy ? "Signing in..." : "Open Affiliate Panel"}
            </Button>
            <Button asChild variant="outline" className="gap-2 rounded-none">
              <Link href="/affiliate">
                <LogIn className="h-4 w-4" />
                Open Portal
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
