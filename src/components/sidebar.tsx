"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Code2,
  ScrollText,
  BarChart3,
  Settings,
  Globe,
  Brain,
  Shield,
  ChevronLeft,
  ChevronRight,
  Layout,
  Link2,
  PanelTop,
  Users,
  Zap,
  UserRound,
  UserCog,
  AppWindow,
  MonitorSmartphone,
  ShieldCheck,
  CandlestickChart,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/templates", label: "Templates", icon: Layout },
  { href: "/compile", label: "Compile", icon: Code2 },
  { href: "/sdk-self-test", label: "SDK Self-Test", icon: PlayCircle },
  { href: "/contract", label: "Contract", icon: Link2 },
  { href: "/permit2", label: "Permit2", icon: Zap },
  { href: "/frontpage", label: "Frontpage", icon: PanelTop },
  { href: "/embed-tool", label: "Embed Tool", icon: AppWindow },
  { href: "/dex-test", label: "DEX Test", icon: CandlestickChart },
  { href: "/wallet-runtime", label: "Wallet Runtime", icon: MonitorSmartphone },
  { href: "/strategy", label: "Strategy Engine", icon: Brain },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/domains", label: "Domains", icon: Globe },
  { href: "/affiliate", label: "Affiliate Panel", icon: UserRound },
  { href: "/affiliates", label: "Affiliates", icon: Users },
  { href: "/affiliate/admin", label: "Affiliate Admin", icon: UserCog },
  { href: "/sessions", label: "Session Panel", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 h-screen border-r border-border/40 bg-black/60 backdrop-blur-xl transition-all duration-300 flex flex-col",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border/40 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-display text-base tracking-widest uppercase font-bold text-white">StealthV26</span>
          </div>
        )}
        {collapsed && <Shield className="h-5 w-5 text-primary mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-none p-1.5 hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-none px-3 py-2.5 text-xs font-mono uppercase tracking-wider transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground border-l-2 border-transparent hover:bg-white/5 hover:text-white hover:border-white/20",
                collapsed && "justify-center px-2 border-l-0"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/40 p-4">
        {!collapsed && (
          <div className="rounded-none bg-primary/5 border border-primary/20 p-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary">System Core</p>
            <p className="text-[10px] font-mono text-muted-foreground mt-1.5">v26.0.0 // Enterprise</p>
          </div>
        )}
      </div>
    </aside>
  );
}
