import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { useEffect, useState } from "react";

export default function App() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [result, setResult] = useState("");

  // ─── YOUR CUSTOM SCRIPT — runs after wallet connects ───────
  useEffect(() => {
    if (isConnected && address) {
      console.log("✅ Connected:", address, "chain:", chain?.id);
      setResult(`✅ Connected\nAddress: ${address}\nChain: ${chain?.name} (${chain?.id})`);
      // TODO: Add your own post-connect logic here
    } else {
      setResult("Waiting for connection...");
    }
  }, [isConnected, address, chain]);

  async function handleSign() {
    try {
      setResult("✍️ Check your wallet...");
      const sig = await signMessageAsync({ message: "Hello from RainbowKit!" });
      setResult(`✅ Signed!\n${sig}`);
    } catch (err) {
      setResult(`❌ ${err.message}`);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          🌈 <span style={styles.rainbow}>RainbowKit</span> Modal
        </h1>
        <p style={styles.sub}>
          The real RainbowKit ConnectButton. Your own script runs after connect.
        </p>

        {/* The actual RainbowKit ConnectButton */}
        <div style={styles.section}>
          <div style={styles.label}>Default ConnectButton</div>
          <ConnectButton />
        </div>

        <hr style={styles.divider} />

        <div style={styles.section}>
          <div style={styles.label}>Compact Variants</div>
          <div style={styles.row}>
            <ConnectButton label="Sign in" />
            <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
          </div>
        </div>

        <hr style={styles.divider} />

        <div style={styles.section}>
          <div style={styles.label}>Your Custom Actions</div>
          <div style={styles.row}>
            <button style={styles.btn} onClick={handleSign} disabled={!isConnected}>
              ✍️ Sign Message
            </button>
            <button style={{ ...styles.btn, ...styles.btnRed }} onClick={() => disconnect()} disabled={!isConnected}>
              Disconnect
            </button>
          </div>
        </div>

        <pre style={styles.status}>{result}</pre>
      </div>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    color: "#e4e4e7",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  card: {
    background: "rgba(20,20,30,0.85)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "24px",
    padding: "40px",
    maxWidth: "520px",
    width: "100%",
    textAlign: "center",
  },
  title: { fontSize: "1.5rem", marginBottom: "6px" },
  rainbow: {
    background: "linear-gradient(90deg, #f97316, #ec4899, #8b5cf6, #3b82f6, #22c55e)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  sub: { color: "#71717a", marginBottom: "28px", fontSize: "0.9rem" },
  section: { margin: "16px 0" },
  label: {
    fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em",
    color: "#71717a", marginBottom: "12px",
  },
  row: { display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" },
  divider: { border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "20px 0" },
  btn: {
    background: "#6366f1", color: "#fff", border: "none",
    padding: "10px 20px", borderRadius: "12px", fontSize: "0.88rem",
    cursor: "pointer", transition: "opacity 0.15s",
  },
  btnRed: { background: "#ef4444" },
  status: {
    marginTop: "20px", background: "rgba(10,10,15,0.6)",
    border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px",
    padding: "14px", fontFamily: "monospace", fontSize: "0.8rem",
    color: "#22c55e", minHeight: "50px", textAlign: "left",
    whiteSpace: "pre-wrap", wordBreak: "break-all",
  },
};
