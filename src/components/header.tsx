"use client";

import type { Address } from "viem";
import { Moon, Sun, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { connectInjected, getWalletClient } from "@/lib/web3";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [address, setAddress] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [busy, setBusy] = useState(false);

  const short = useMemo(() => {
    if (!address) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        setAuthenticated(Boolean(data?.authenticated));
        if (data?.address) setAddress(data.address);
      } catch {
        if (cancelled) return;
        setAuthenticated(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function connectAndLogin() {
    setBusy(true);
    try {
      const { address: addr } = await connectInjected();
      setAddress(addr);

      const nonceRes = await fetch("/api/auth/nonce", { cache: "no-store" });
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok) throw new Error(nonceData?.message || "Failed to get nonce");

      const message: string = nonceData?.message;
      if (!message) throw new Error("No message returned from nonce endpoint");

      const wallet = getWalletClient();
      const signature = await wallet.signMessage({
        account: addr as Address,
        message,
      });

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr, signature }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData?.message || "Login failed");

      setAuthenticated(true);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setAuthenticated(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-black/60 backdrop-blur-xl px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">Systems Active</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-widest rounded-none border-primary/20 text-primary bg-primary/5">
          Global Route
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        {authenticated ? (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={logout}
            className="font-mono text-[10px] uppercase tracking-widest rounded-none border-border/50 bg-black/20 hover:bg-white/5 hover:text-white transition-colors"
          >
            {short || "Logout"}
          </Button>
        ) : (
          <Button size="sm" disabled={busy} onClick={connectAndLogin} className="rounded-none font-mono text-[10px] uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            {busy ? "Connecting..." : "Connect"}
          </Button>
        )}
        <div className="h-4 w-px bg-border/40 mx-1" />
        <Button variant="ghost" size="icon" className="relative rounded-none hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-none hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
