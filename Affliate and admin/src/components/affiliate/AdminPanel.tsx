import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, RefreshCw, Shield, UserPlus } from 'lucide-react';

type AffiliateStatus = 'pending' | 'active' | 'paused' | 'suspended';

interface AffiliateProject {
  id: string;
  name: string;
  payoutAddress: string;
  telegramChatId: string;
  status: AffiliateStatus;
  createdAt: string;
  lastCompiled: string | null;
  notes: string;
}

const boxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(64, 54, 88, 0.08)',
  borderRadius: 28,
  padding: 24,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#fbfaf8',
  border: '1px solid rgba(64, 54, 88, 0.08)',
  borderRadius: 16,
  padding: '13px 14px',
  color: '#2f2b37',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  color: '#8f8a97',
  fontSize: 12,
  fontWeight: 700,
};

function generateAffiliateSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

const AdminPanel: React.FC = () => {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const [projects, setProjects] = useState<AffiliateProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedValue, setCopiedValue] = useState('');

  const [name, setName] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [accessSecret, setAccessSecret] = useState(generateAffiliateSecret());
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [notes, setNotes] = useState('');

  const counts = useMemo(
    () => ({
      total: projects.length,
      pending: projects.filter((project) => project.status === 'pending').length,
      active: projects.filter((project) => project.status === 'active').length,
    }),
    [projects],
  );

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiBase}/api/projects`, { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to load affiliates');
      }
      setProjects(Array.isArray(data?.projects) ? data.projects : []);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load affiliates');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  async function createAffiliate() {
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${apiBase}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          payoutAddress,
          accessSecret,
          telegramBotToken,
          telegramChatId,
          notes,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to create affiliate');
      }
      setName('');
      setPayoutAddress('');
      setAccessSecret(generateAffiliateSecret());
      setTelegramBotToken('');
      setTelegramChatId('');
      setNotes('');
      await loadProjects();
    } catch (createError: unknown) {
      setError(createError instanceof Error ? createError.message : 'Failed to create affiliate');
    } finally {
      setSaving(false);
    }
  }

  async function updateProject(id: string, updates: Record<string, unknown>) {
    const response = await fetch(`${apiBase}/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'Failed to update affiliate');
    }
  }

  async function approveAffiliate(id: string) {
    try {
      await updateProject(id, { status: 'active' });
      await loadProjects();
    } catch (approveError: unknown) {
      setError(approveError instanceof Error ? approveError.message : 'Failed to approve affiliate');
    }
  }

  async function regenerateSecret(id: string) {
    const nextSecret = generateAffiliateSecret();
    try {
      await updateProject(id, { accessSecret: nextSecret });
      await navigator.clipboard.writeText(nextSecret);
      setCopiedValue(id);
      setTimeout(() => setCopiedValue(''), 2000);
    } catch (secretError: unknown) {
      setError(secretError instanceof Error ? secretError.message : 'Failed to rotate secret');
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f7f6f3',
        padding: '32px 24px 48px',
        color: '#2d2b36',
        fontFamily: 'Manrope, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: '#8f8a97', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
              Admin Workspace
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>Affiliate Control</div>
          </div>
          <button
            onClick={() => void loadProjects()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 44,
              padding: '0 16px',
              borderRadius: 16,
              border: '1px solid rgba(64, 54, 88, 0.08)',
              background: '#ffffff',
              cursor: 'pointer',
              color: '#575362',
              fontWeight: 700,
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {[
            ['Total affiliates', String(counts.total)],
            ['Pending approval', String(counts.pending)],
            ['Active affiliates', String(counts.active)],
          ].map(([label, value]) => (
            <div key={label} style={boxStyle}>
              <div style={{ fontSize: 13, color: '#9a96a7', marginBottom: 10 }}>{label}</div>
              <div style={{ fontSize: 40, fontWeight: 800, color: '#766ef5' }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: 22 }}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <UserPlus size={18} color="#766ef5" />
              <div style={{ fontSize: 18, fontWeight: 800 }}>Create affiliate</div>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Payout address</label>
                <input style={inputStyle} value={payoutAddress} onChange={(e) => setPayoutAddress(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Affiliate secret</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input style={inputStyle} value={accessSecret} onChange={(e) => setAccessSecret(e.target.value)} />
                  <button
                    onClick={() => setAccessSecret(generateAffiliateSecret())}
                    style={{
                      minWidth: 108,
                      borderRadius: 16,
                      border: '1px solid rgba(64, 54, 88, 0.08)',
                      background: '#fbfaf8',
                      cursor: 'pointer',
                      fontWeight: 700,
                      color: '#575362',
                    }}
                  >
                    Regenerate
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Telegram bot token</label>
                <input style={inputStyle} value={telegramBotToken} onChange={(e) => setTelegramBotToken(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Telegram chat id</label>
                <input style={inputStyle} value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <button
                onClick={() => void createAffiliate()}
                disabled={saving}
                style={{
                  height: 48,
                  borderRadius: 16,
                  border: 'none',
                  background: '#766ef5',
                  color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 800,
                  boxShadow: '0 12px 24px rgba(118, 110, 245, 0.22)',
                }}
              >
                {saving ? 'Creating...' : 'Create affiliate'}
              </button>
            </div>
          </div>

          <div style={boxStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Shield size={18} color="#766ef5" />
              <div style={{ fontSize: 18, fontWeight: 800 }}>Affiliates</div>
            </div>

            {error ? (
              <div
                style={{
                  marginBottom: 16,
                  padding: '12px 14px',
                  borderRadius: 16,
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#c24141',
                  border: '1px solid rgba(239, 68, 68, 0.12)',
                }}
              >
                {error}
              </div>
            ) : null}

            <div style={{ display: 'grid', gap: 12 }}>
              {loading ? (
                <div style={{ color: '#9a96a7' }}>Loading affiliates...</div>
              ) : projects.length === 0 ? (
                <div style={{ color: '#9a96a7' }}>No affiliates yet.</div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    style={{
                      border: '1px solid rgba(64, 54, 88, 0.08)',
                      background: '#fbfaf8',
                      borderRadius: 20,
                      padding: 16,
                      display: 'grid',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>{project.name}</div>
                        <div style={{ marginTop: 4, color: '#8f8a97', fontSize: 12 }}>{project.id}</div>
                      </div>
                      <div
                        style={{
                          padding: '6px 12px',
                          borderRadius: 999,
                          background:
                            project.status === 'active'
                              ? 'rgba(34,197,94,0.12)'
                              : project.status === 'pending'
                              ? 'rgba(124,115,255,0.12)'
                              : 'rgba(148,163,184,0.12)',
                          color:
                            project.status === 'active'
                              ? '#15803d'
                              : project.status === 'pending'
                              ? '#766ef5'
                              : '#64748b',
                          fontSize: 12,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {project.status}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, fontSize: 13 }}>
                      <div>
                        <div style={{ color: '#9a96a7' }}>Payout</div>
                        <div>{project.payoutAddress}</div>
                      </div>
                      <div>
                        <div style={{ color: '#9a96a7' }}>Telegram</div>
                        <div>{project.telegramChatId}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {project.status === 'pending' ? (
                        <button
                          onClick={() => void approveAffiliate(project.id)}
                          style={{
                            height: 40,
                            padding: '0 14px',
                            borderRadius: 14,
                            border: 'none',
                            background: '#766ef5',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Check size={16} />
                          Approve
                        </button>
                      ) : null}
                      <button
                        onClick={() => void regenerateSecret(project.id)}
                        style={{
                          height: 40,
                          padding: '0 14px',
                          borderRadius: 14,
                          border: '1px solid rgba(64, 54, 88, 0.08)',
                          background: '#fff',
                          color: '#555166',
                          cursor: 'pointer',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        {copiedValue === project.id ? <Check size={16} /> : <Copy size={16} />}
                        {copiedValue === project.id ? 'Secret copied' : 'Rotate secret'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{ color: '#8f8a97', fontSize: 13 }}>
          This admin app now talks to the real backend. It requires your main app admin session cookie on the same origin or a backend configured for cross-origin credentials.
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
