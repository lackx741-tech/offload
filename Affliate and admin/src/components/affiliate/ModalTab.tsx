import React, { useState } from 'react';
import { ModalSettings, MessageStep, ErrorState } from './types';
import { Check } from 'lucide-react';

interface ModalTabProps {
  settings: ModalSettings;
  onChange: (s: ModalSettings) => void;
  messageSteps: MessageStep[];
  onMessageChange: (steps: MessageStep[]) => void;
  errorStates: ErrorState[];
  onErrorChange: (states: ErrorState[]) => void;
}

const modals = [
  { id: 'wc3', label: 'WalletConnect', version: 'v3', color: '#3B99FC' },
  { id: 'wc2', label: 'WalletConnect', version: 'v2', color: '#3B99FC' },
  { id: 'family', label: 'Family', version: 'Connect Kit', color: '#7C5CFC' },
  { id: 'rainbow', label: 'Rainbow', version: 'Kit', color: '#FF6E27' },
  { id: 'saturn', label: 'Saturn', version: 'Modal', color: '#FFD700' },
  { id: 'mars', label: 'Mars', version: 'Modal', color: '#FF4444' },
  { id: 'venus', label: 'Venus', version: '', color: '#FF2D92' },
];

const walletOptions = ['MetaMask', 'Coinbase', 'WalletConnect', 'Trust', 'Rainbow', 'Ledger', 'Trezor', 'Phantom'];

const ModalTab: React.FC<ModalTabProps> = ({
  settings, onChange, messageSteps, onMessageChange, errorStates, onErrorChange,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const update = (key: keyof ModalSettings, value: any) =>
    onChange({ ...settings, [key]: value });

  const toggleWallet = (wallet: string) => {
    const wallets = settings.supportedWallets.includes(wallet)
      ? settings.supportedWallets.filter((w) => w !== wallet)
      : [...settings.supportedWallets, wallet];
    update('supportedWallets', wallets);
  };

  const updateStep = (id: number, text: string) => {
    onMessageChange(messageSteps.map((s) => (s.id === id ? { ...s, text } : s)));
  };

  const updateError = (id: string, key: keyof ErrorState, value: string) => {
    onErrorChange(errorStates.map((e) => (e.id === id ? { ...e, [key]: value } : e)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
      <div>
        <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: '#f0f0f5', marginBottom: 4 }}>
          Modal Selection & Configuration
        </h3>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(240,240,245,0.35)', letterSpacing: '0.08em' }}>
          Choose your wallet connection modal and configure its appearance
        </p>
      </div>

      {/* Modal Cards */}
      <div>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(240,240,245,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          SELECT MODAL TYPE
        </p>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {modals.map((modal) => {
            const selected = settings.selectedModal === modal.id;
            return (
              <button
                key={modal.id}
                onClick={() => update('selectedModal', modal.id)}
                style={{
                  minWidth: 120,
                  padding: '20px 16px',
                  background: selected ? `rgba(${hexToRgb(modal.color)}, 0.08)` : '#13131a',
                  border: selected ? `1px solid ${modal.color}` : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: selected ? `0 0 20px rgba(${hexToRgb(modal.color)}, 0.3)` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                {selected && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 18, height: 18, borderRadius: '50%',
                    background: modal.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={10} color="#fff" />
                  </div>
                )}
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `rgba(${hexToRgb(modal.color)}, 0.15)`,
                  border: `1px solid rgba(${hexToRgb(modal.color)}, 0.3)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 14, color: modal.color }}>
                    {modal.label[0]}
                  </span>
                </div>
                <div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 12, color: selected ? '#f0f0f5' : 'rgba(240,240,245,0.6)', textAlign: 'center' }}>
                    {modal.label}
                  </div>
                  {modal.version && (
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: modal.color, textAlign: 'center', letterSpacing: '0.05em' }}>
                      {modal.version}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Style Settings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(240,240,245,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Border Radius — {settings.borderRadius}px
          </label>
          <input
            type="range" min={0} max={24} value={settings.borderRadius}
            onChange={(e) => update('borderRadius', Number(e.target.value))}
            style={{ width: '100%', accentColor: '#FF2D92', cursor: 'pointer' }}
          />
        </div>
        <div>
          <label style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(240,240,245,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Overlay Blur — {settings.overlayBlur}px
          </label>
          <input
            type="range" min={0} max={24} value={settings.overlayBlur}
            onChange={(e) => update('overlayBlur', Number(e.target.value))}
            style={{ width: '100%', accentColor: '#FF2D92', cursor: 'pointer' }}
          />
        </div>
        <div>
          <label style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(240,240,245,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Accent Color
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="color" value={settings.accentColor} onChange={(e) => update('accentColor', e.target.value)}
              style={{ width: 44, height: 40, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'none', cursor: 'pointer', padding: 2 }} />
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#f0f0f5', background: '#13131a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', flex: 1 }}>
              {settings.accentColor.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Supported Wallets */}
      <div>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(240,240,245,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          SUPPORTED WALLETS
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {walletOptions.map((wallet) => {
            const selected = settings.supportedWallets.includes(wallet);
            return (
              <button key={wallet} onClick={() => toggleWallet(wallet)} style={{
                padding: '8px 16px', borderRadius: 8,
                border: selected ? '1px solid #FF2D92' : '1px solid rgba(255,255,255,0.1)',
                background: selected ? '#FF2D92' : 'rgba(255,255,255,0.03)',
                color: selected ? '#fff' : 'rgba(240,240,245,0.5)',
                fontFamily: 'Space Grotesk', fontSize: 13, cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selected ? '0 0 10px rgba(255,45,146,0.4)' : 'none',
              }}>
                {wallet}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messaging Flow Builder */}
      <div>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(240,240,245,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          MESSAGING FLOW BUILDER
        </p>
        <div style={{ background: '#13131a', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          {/* Steps Nav */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 16px', overflowX: 'auto' }}>
            {messageSteps.map((step, idx) => (
              <button key={step.id} onClick={() => setCurrentStep(idx)} style={{
                padding: '12px 16px', border: 'none', background: 'transparent',
                borderBottom: currentStep === idx ? '2px solid #FF2D92' : '2px solid transparent',
                color: currentStep === idx ? '#FF2D92' : 'rgba(240,240,245,0.4)',
                fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: '0.08em',
                cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
              }}>
                {step.label}
              </button>
            ))}
          </div>
          {/* Active Step */}
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,45,146,0.15)',
                border: '1px solid rgba(255,45,146,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'JetBrains Mono', fontSize: 12, color: '#FF2D92', fontWeight: 700, flexShrink: 0,
              }}>
                {currentStep + 1}
              </div>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: '#f0f0f5' }}>
                {messageSteps[currentStep]?.label}
              </span>
            </div>
            <input
              type="text"
              value={messageSteps[currentStep]?.text || ''}
              onChange={(e) => updateStep(messageSteps[currentStep].id, e.target.value)}
              style={{
                width: '100%', background: '#0d0d12', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '12px 14px', color: '#f0f0f5',
                fontFamily: 'Space Grotesk', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(255,45,146,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} style={{
                padding: '8px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, color: 'rgba(240,240,245,0.5)', fontFamily: 'Space Grotesk', fontSize: 13,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>BACK</button>
              <button onClick={() => updateStep(messageSteps[currentStep].id, messageSteps[currentStep]?.text || '')} style={{
                padding: '8px 20px', background: 'transparent', border: '1px solid rgba(255,45,146,0.3)',
                borderRadius: 8, color: '#FF2D92', fontFamily: 'Space Grotesk', fontSize: 13,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>RESET</button>
              <button onClick={() => setCurrentStep(Math.min(messageSteps.length - 1, currentStep + 1))} style={{
                padding: '8px 20px', background: '#FF2D92', border: 'none',
                borderRadius: 8, color: '#fff', fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 0 12px rgba(255,45,146,0.4)',
              }}>CONTINUE</button>
            </div>
          </div>
        </div>
      </div>

      {/* Error States */}
      <div>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(240,240,245,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          ERROR STATE CONFIGURATION
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {errorStates.map((err) => (
            <div key={err.id} style={{
              background: '#13131a', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: err.id === 'generic' ? '#FF2D92' : err.id === 'lowbalance' ? '#FFD700' : '#FF4444',
                  boxShadow: `0 0 6px ${err.id === 'generic' ? '#FF2D92' : err.id === 'lowbalance' ? '#FFD700' : '#FF4444'}`,
                }} />
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(240,240,245,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {err.label}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 10 }}>
                {(['title', 'description', 'button'] as const).map((field) => (
                  <input key={field} type="text" placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    value={err[field]} onChange={(e) => updateError(err.id, field, e.target.value)}
                    style={{
                      background: '#0d0d12', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8, padding: '10px 12px', color: '#f0f0f5',
                      fontFamily: 'Space Grotesk', fontSize: 13, outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(255,45,146,0.5)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Events Panel */}
      <div>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(240,240,245,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          REQUEST / RESPONSE EVENTS
        </p>
        <div style={{ background: '#13131a', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['EVENT', 'DIRECTION', 'PENDING', 'SUCCESS', 'REJECT'].map((h) => (
                  <th key={h} style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(240,240,245,0.35)', letterSpacing: '0.1em', padding: '10px 16px', textAlign: 'left' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { event: 'Connect', direction: 'Client → Chain' },
                { event: 'Chain Change', direction: 'Client → Client' },
                { event: 'Withdraw', direction: 'Chain → Client' },
              ].map((row, i) => (
                <tr key={row.event} style={{ borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <td style={{ fontFamily: 'Space Grotesk', fontSize: 13, color: '#f0f0f5', padding: '12px 16px' }}>{row.event}</td>
                  <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(240,240,245,0.4)', padding: '12px 16px' }}>{row.direction}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#FFD700' }}>→ pending</span></td>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#00FF85' }}>✓ success</span></td>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#FF4444' }}>✗ reject</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 45, 146';
}

export default ModalTab;
