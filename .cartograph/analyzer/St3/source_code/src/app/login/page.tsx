"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, KeyRound, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json()) as { authenticated?: boolean };
        if (!active) return;
        if (data?.authenticated) {
          router.replace("/affiliates");
          return;
        }
      } catch {
        // stay on page
      } finally {
        if (active) setChecking(false);
      }
    }
    void loadSession();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogin() {
    setError("");
    if (!username.trim()) {
      setError("Admin username is required.");
      return;
    }
    if (!password) {
      setError("Admin passphrase is required.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data?.message || "Login failed");

      toast.success("Admin session active");
      router.push("/affiliates");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl items-center justify-center px-4">
      <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
          <CardHeader className="border-b border-border/40">
            <Badge variant="outline" className="w-fit rounded-none border-primary/20 bg-primary/10 font-mono uppercase tracking-widest text-primary">
              Admin Access
            </Badge>
            <CardTitle className="font-display text-4xl uppercase tracking-wide">
              Global Login
            </CardTitle>
            <CardDescription className="max-w-xl text-sm font-mono">
              Sign in with your private admin username and long passphrase to access contracts, compile, domains, settings, and deployment controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-none border border-border/40 bg-black/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-primary">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs font-mono uppercase tracking-widest">Secure Session</span>
                </div>
                <p className="text-sm text-muted-foreground">Server-signed admin cookie using your configured username and passphrase.</p>
              </div>
              <div className="rounded-none border border-border/40 bg-black/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-primary">
                  <KeyRound className="h-4 w-4" />
                  <span className="text-xs font-mono uppercase tracking-widest">No Wallet Required</span>
                </div>
                <p className="text-sm text-muted-foreground">This path is for your personal admin access, separate from wallet auth.</p>
              </div>
              <div className="rounded-none border border-border/40 bg-black/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-primary">
                  <ArrowRight className="h-4 w-4" />
                  <span className="text-xs font-mono uppercase tracking-widest">Destination</span>
                </div>
                <p className="text-sm text-muted-foreground">Successful login goes straight into the admin affiliate dashboard.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/40 bg-black/40 backdrop-blur-xl">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="font-display text-2xl uppercase tracking-wide">
              Sign In
            </CardTitle>
            <CardDescription>
              Use `ADMIN_LOGIN_USERNAME` and `ADMIN_LOGIN_PASSPHRASE`.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="admin-username">Admin Username</Label>
              <Input
                id="admin-username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="admin"
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Admin Passphrase</Label>
              <Input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !busy && !checking) {
                    void handleLogin();
                  }
                }}
                placeholder="Enter your 32-word passphrase"
                className="rounded-none"
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button onClick={() => void handleLogin()} disabled={busy || checking} className="w-full gap-2 rounded-none">
              <KeyRound className="h-4 w-4" />
              {checking ? "Checking session..." : busy ? "Signing in..." : "Login"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
