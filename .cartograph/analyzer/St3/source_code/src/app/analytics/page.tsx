"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Wallet,
  Globe,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useMemo } from "react";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6", "#ec4899"];

function getDeterministicSuccessRate(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1000;
  }
  return 60 + (hash % 35);
}

export default function AnalyticsPage() {
  const { stats, sessions, logs, domains } = useStore();

  const chainPerformance = useMemo(() => {
    return stats.chainDistribution.map((c) => ({
      ...c,
      successRate: getDeterministicSuccessRate(c.chain),
      avgValue: Math.round(c.value / Math.max(c.count, 1)),
    }));
  }, [stats.chainDistribution]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach((s) => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [sessions]);

  const domainPerformance = useMemo(() => {
    return domains.map((d) => ({
      domain: d.domain.length > 20 ? d.domain.slice(0, 20) + "..." : d.domain,
      sessions: d.sessions,
      value: d.totalValueUSD,
      status: d.status,
    }));
  }, [domains]);

  const methodDistribution = useMemo(() => {
    const methods = [
      { name: "approve", value: 35 },
      { name: "permit2", value: 28 },
      { name: "transferFrom", value: 18 },
      { name: "multicall", value: 12 },
      { name: "safeTransfer", value: 7 },
    ];
    return methods;
  }, []);

  const eventTypeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      counts[l.type] = (counts[l.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type: type.replace("_", " "),
      count,
    }));
  }, [logs]);

  const conversionFunnel = [
    { stage: "Page Visit", count: 12400, rate: 100 },
    { stage: "Wallet Connected", count: 4832, rate: 38.9 },
    { stage: "Signature Approved", count: 3780, rate: 78.2 },
    { stage: "Transaction Sent", count: 2950, rate: 78.0 },
    { stage: "Completed", count: 2340, rate: 79.3 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Asset-level breakdown, execution metrics, and performance tracking
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Success Rate</span>
            </div>
            <p className="text-3xl font-bold">{stats.successRate}%</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-emerald-500">+2.1% from last week</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Avg Value / Session</span>
            </div>
            <p className="text-3xl font-bold">
              ${Math.round(stats.totalValueProcessed / stats.totalSessions).toLocaleString()}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-emerald-500">+$42 from last week</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Active Domains</span>
            </div>
            <p className="text-3xl font-bold">
              {domains.filter((d) => d.status === "active").length}
            </p>
            <span className="text-xs text-muted-foreground">of {domains.length} total</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Top Chain</span>
            </div>
            <p className="text-3xl font-bold">{stats.topChain}</p>
            <span className="text-xs text-muted-foreground">by session count</span>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Conversion Funnel</CardTitle>
          <CardDescription>User flow from page visit to completion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {conversionFunnel.map((stage, i) => (
              <div key={stage.stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                    <span className="font-medium">{stage.stage}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {stage.count.toLocaleString()}
                    </span>
                    <Badge
                      variant={stage.rate > 70 ? "default" : "secondary"}
                      className="text-[10px] w-14 justify-center"
                    >
                      {stage.rate}%
                    </Badge>
                  </div>
                </div>
                <Progress value={stage.rate} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chain Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chain Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chainPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    type="category"
                    dataKey="chain"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#6366f1" name="Sessions" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="successRate" fill="#10b981" name="Success %" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Execution Method Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Execution Method Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={methodDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    strokeWidth={2}
                    stroke="hsl(var(--card))"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {methodDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Type Breakdown + Status Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Event Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventTypeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="type"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {eventTypeBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Session Status Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={statusBreakdown} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <PolarRadiusAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <Radar
                    name="Sessions"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain Performance Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Domain Performance</CardTitle>
          <CardDescription>Session counts and value metrics per domain</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Domain</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Sessions</TableHead>
                <TableHead className="text-xs text-right">Total Value (USD)</TableHead>
                <TableHead className="text-xs text-right">Avg / Session</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domainPerformance.map((d, i) => (
                <TableRow key={i} className="text-xs">
                  <TableCell className="font-mono font-medium">{d.domain}</TableCell>
                  <TableCell>
                    <Badge
                      variant={d.status === "active" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{d.sessions.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${d.value.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    ${d.sessions > 0 ? Math.round(d.value / d.sessions).toLocaleString() : 0}
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
