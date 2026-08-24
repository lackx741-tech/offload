"use client";
import { useAccount } from "wagmi";
import { useOpenConnectModal } from "@0xsequence/connect";
import { SequenceRootProvider } from "@/components/sequence-root-provider";

function WalletTestInner() {
  const { setOpenConnectModal } = useOpenConnectModal();
  const { address, isConnected, chainId } = useAccount();

  return (
    <div style={{ padding: 32 }}>
      <h2>WalletConnect + Reown V3 Test</h2>
      <button onClick={() => setOpenConnectModal(true)} style={{ padding: 12, fontSize: 18 }}>
        Open Wallet Modal
      </button>
      <div style={{ marginTop: 24 }}>
        {isConnected ? (
          <div>
            <div>Connected: <b>{address}</b></div>
            <div>Chain ID: <b>{chainId}</b></div>
          </div>
        ) : (
          <div>Not connected</div>
        )}
      </div>
    </div>
  );
}

export default function WalletTest() {
  return (
    <SequenceRootProvider>
      <WalletTestInner />
    </SequenceRootProvider>
  );
}
