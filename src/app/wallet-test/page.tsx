"use client";
import { useAccount, useConnect } from "wagmi";

export default function WalletTest() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect } = useConnect();

  return (
    <div style={{ padding: 32 }}>
      <h2>Wallet Connect Test</h2>
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => connect({ connector: connectors[0] })} style={{ padding: 12, fontSize: 18 }}>
          Connect Wallet
        </button>
      </div>
      <div>
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
