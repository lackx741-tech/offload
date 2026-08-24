"use client";

import { useState } from "react";
import { Eye, EyeOff, Fingerprint, Lock, LogIn, Users } from "lucide-react";

export function LegacyLoginGate({
  onLogin,
}: {
  onLogin: (session: { projectId: string; projectName?: string }) => void;
}) {
  const [customerId, setCustomerId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [authError, setAuthError] = useState("");

  async function handleSignIn() {
    setAuthError("");
    const projectId = customerId.trim();
    if (!projectId) {
      setAuthError("Project ID is required.");
      return;
    }

    try {
      const res = await fetch("/api/affiliate/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, password }),
      });
      const data = (await res.json()) as { message?: string; project?: { id: string; name?: string } };
      if (!res.ok) throw new Error(data?.message || "Access denied.");
      const project = data?.project;
      if (!project?.id) throw new Error("Missing affiliate project.");

      setLoading(true);
      setLoadingStep(0);
      let step = 0;
      const advance = () => {
        step += 1;
        setLoadingStep(step);
        if (step < 4) {
          setTimeout(advance, 700);
        } else {
          setTimeout(() => {
            setLoading(false);
            onLogin({ projectId: project.id, projectName: project.name });
          }, 500);
        }
      };
      setTimeout(advance, 700);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Access denied.");
    }
  }

  const steps = [
    "Connecting to Blockchain...",
    "AML Check...",
    "Verifying Credentials...",
    "Establishing Secure Session...",
  ];

  return (
    <>
      {loading ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(3,3,4,0.92)",
            backdropFilter: "blur(12px)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "32px",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: "3px solid rgba(255,45,146,0.15)",
              borderTopColor: "#FF2D92",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "center" }}>
            {steps.map((step, index) => (
              <div
                key={step}
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: index < loadingStep ? "#FF2D92" : index === loadingStep ? "#f0f0f5" : "rgba(240,240,245,0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "center",
                }}
              >
                <span style={{ color: index < loadingStep ? "#00FF85" : index === loadingStep ? "#FF2D92" : "rgba(255,255,255,0.2)" }}>
                  {index < loadingStep ? "✓" : index === loadingStep ? "›" : "○"}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#030304",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Space Grotesk, sans-serif",
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,45,146,0.08) 1px, transparent 0)",
          backgroundSize: "32px 32px",
          margin: "-24px",
        }}
      >
        <div
          style={{
            animation: "fadeUp 0.5s cubic-bezier(0.4,0,0.2,1)",
            width: "100%",
            maxWidth: 440,
            padding: "0 24px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "linear-gradient(135deg, #FF2D92, #ff6bb5)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(255,45,146,0.5)",
                }}
              >
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>S</span>
              </div>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 20,
                  color: "#f0f0f5",
                  letterSpacing: "0.05em",
                }}
              >
                STEALTH<span style={{ color: "#FF2D92" }}>V26</span>
              </span>
            </div>
            <p
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
                color: "rgba(240,240,245,0.4)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              AFFILIATE PORTAL
            </p>
          </div>

          <div
            style={{
              background: "#0d0d12",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16,
              padding: "40px 36px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.7), 0 0 40px rgba(255,45,146,0.1)",
            }}
          >
            <h2 style={{ fontWeight: 700, fontSize: 24, color: "#f0f0f5", marginBottom: 8, textAlign: "center" }}>
              Welcome Back
            </h2>
            <p
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
                color: "rgba(240,240,245,0.4)",
                textAlign: "center",
                marginBottom: 32,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Sign in to your affiliate account
            </p>

            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#13131a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 50,
                  padding: "14px 20px",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(255,45,146,0.08)",
                    display: "grid",
                    placeItems: "center",
                    color: "#FF2D92",
                  }}
                >
                  <Users size={16} />
                </div>
                <input
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  placeholder="Customer ID"
                  name="username"
                  autoComplete="username"
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "#f0f0f5",
                    fontSize: 15,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#13131a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 50,
                  padding: "14px 20px",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(255,45,146,0.08)",
                    display: "grid",
                    placeItems: "center",
                    color: "#FF2D92",
                  }}
                >
                  <Lock size={16} />
                </div>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "#f0f0f5",
                    fontSize: 15,
                  }}
                />
                <button
                  onClick={() => setShowPassword((value) => !value)}
                  style={{ border: "none", background: "transparent", color: "rgba(240,240,245,0.45)", cursor: "pointer" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {authError ? (
              <p style={{ color: "#ff7a9e", fontSize: 12, textAlign: "center", marginBottom: 16 }}>{authError}</p>
            ) : null}

            <button
              onClick={() => void handleSignIn()}
              style={{
                width: "100%",
                height: 52,
                borderRadius: 999,
                border: "none",
                background: "linear-gradient(135deg, #FF2D92, #ff6bb5)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 0 20px rgba(255,45,146,0.25)",
              }}
            >
              <LogIn size={16} />
              Sign in
            </button>

            <button
              style={{
                width: "100%",
                height: 46,
                borderRadius: 999,
                marginTop: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "#14141b",
                color: "rgba(240,240,245,0.72)",
                fontWeight: 600,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <Fingerprint size={15} />
              Get Access
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
