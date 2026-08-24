import React, { useState } from 'react';
import { Eye, EyeOff, Fingerprint, Lock, LogIn, Users } from 'lucide-react';

interface LoginGateProps {
  onLogin: (session: { projectId: string; projectName?: string }) => void;
}

const LoadingOverlay: React.FC<{ step: number }> = ({ step }) => {
  const steps = [
    'Connecting to Blockchain...',
    'AML Check...',
    'Verifying Credentials...',
    'Establishing Secure Session...',
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3,3,4,0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '32px',
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          border: '3px solid rgba(255,45,146,0.15)',
          borderTopColor: '#FF2D92',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }}>
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: i < step ? '#FF2D92' : i === step ? '#f0f0f5' : 'rgba(240,240,245,0.3)',
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: 'center',
            }}
          >
            <span style={{ color: i < step ? '#00FF85' : i === step ? '#FF2D92' : 'rgba(255,255,255,0.2)' }}>
              {i < step ? '✓' : i === step ? '›' : '○'}
            </span>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
};

const LoginGate: React.FC<LoginGateProps> = ({ onLogin }) => {
  const [customerId, setCustomerId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [authError, setAuthError] = useState('');

  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

  const handleSignIn = async () => {
    setAuthError('');
    const projectId = customerId.trim();
    if (!projectId) {
      setAuthError('Project ID is required.');
      return;
    }

    try {
      const res = await fetch(`${apiBase}/api/affiliate/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Access denied.');
      }

      const project = data?.project as { id: string; name?: string } | undefined;
      if (!project?.id) {
        throw new Error('Missing affiliate project.');
      }

    setLoading(true);
    setLoadingStep(0);
    let step = 0;
    const advance = () => {
      step++;
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
    } catch (error: unknown) {
      setAuthError(error instanceof Error ? error.message : 'Access denied.');
    }
  };

  return (
    <>
      {loading && <LoadingOverlay step={loadingStep} />}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        style={{
          minHeight: '100vh',
          background: '#030304',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Space Grotesk, sans-serif',
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,45,146,0.08) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      >
        <div
          style={{
            animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1)',
            width: '100%',
            maxWidth: 440,
            padding: '0 24px',
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #FF2D92, #ff6bb5)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(255,45,146,0.5)',
                }}
              >
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>S</span>
              </div>
              <span
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 800,
                  fontSize: 20,
                  color: '#f0f0f5',
                  letterSpacing: '0.05em',
                }}
              >
                STEALTH<span style={{ color: '#FF2D92' }}>V26</span>
              </span>
            </div>
            <p
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                color: 'rgba(240,240,245,0.4)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              AFFILIATE PORTAL
            </p>
          </div>

          {/* Card */}
          <div
            style={{
              background: '#0d0d12',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
              padding: '40px 36px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 40px rgba(255,45,146,0.1)',
            }}
          >
            <h2
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: 24,
                color: '#f0f0f5',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Welcome Back
            </h2>
            <p
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                color: 'rgba(240,240,245,0.4)',
                textAlign: 'center',
                marginBottom: 32,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Sign in to your affiliate account
            </p>

            {/* Customer ID Input */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#13131a',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 50,
                  padding: '14px 20px',
                  transition: 'border-color 0.25s',
                }}
                onFocus={() => {}}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Fingerprint size={16} color="rgba(240,240,245,0.5)" />
                </div>
                <input
                  type="text"
                  placeholder="Project ID"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#f0f0f5',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 15,
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#13131a',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 50,
                  padding: '14px 20px',
                  transition: 'border-color 0.25s',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Lock size={16} color="rgba(240,240,245,0.5)" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#f0f0f5',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 15,
                  }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    width: 36,
                    height: 36,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.2s',
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={16} color="rgba(240,240,245,0.6)" />
                  ) : (
                    <Eye size={16} color="rgba(240,240,245,0.6)" />
                  )}
                </button>
              </div>
            </div>

            {/* Auth Error */}
            {authError && (
              <div style={{
                marginBottom: 16,
                padding: '10px 16px',
                background: 'rgba(255,45,146,0.08)',
                border: '1px solid rgba(255,45,146,0.3)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ color: '#FF2D92', fontSize: 16 }}>✗</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#FF2D92', letterSpacing: '0.05em' }}>{authError}</span>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={handleSignIn}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  background: '#f0f0f5',
                  color: '#030304',
                  border: 'none',
                  borderRadius: 50,
                  padding: '16px 28px',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                  letterSpacing: '0.02em',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <LogIn size={18} />
                Sign In
              </button>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  background: '#f0f0f5',
                  color: '#030304',
                  border: 'none',
                  borderRadius: 50,
                  padding: '16px 28px',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                  letterSpacing: '0.02em',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <Users size={18} />
                Get Access
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginGate;
