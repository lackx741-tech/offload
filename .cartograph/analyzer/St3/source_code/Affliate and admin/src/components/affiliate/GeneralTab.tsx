import React from 'react';
import { GeneralSettings } from './types';
import { ChevronDown, Palette, Type, MousePointer, Sliders } from 'lucide-react';

interface GeneralTabProps {
  settings: GeneralSettings;
  onChange: (s: GeneralSettings) => void;
}

const SectionCard: React.FC<{ title: string; subtitle?: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, subtitle, icon, children }) => (
  <div style={{ background: '#ffffff', border: '1px solid rgba(64, 54, 88, 0.08)', borderRadius: 28, overflow: 'hidden' }}>
    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(64, 54, 88, 0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(124, 115, 255, 0.12)', border: '1px solid rgba(124, 115, 255, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#2a2732' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#9a96a7', marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
    <div style={{ padding: '20px' }}>{children}</div>
  </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label style={{ fontSize: 12, color: '#8f8a97', display: 'block', marginBottom: 8, fontWeight: 700 }}>
    {children}
  </label>
);

const StyledSelect: React.FC<{ value: string; options: string[]; onChange: (v: string) => void }> = ({ value, options, onChange }) => (
  <div style={{ position: 'relative' }}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%', background: '#fbfaf8', border: '1px solid rgba(64, 54, 88, 0.08)', borderRadius: 14, padding: '13px 40px 13px 14px', color: '#332f3d', fontSize: 14, appearance: 'none', cursor: 'pointer', outline: 'none', transition: 'border-color 0.2s' }}
      onFocus={(e) => (e.target.style.borderColor = 'rgba(124, 115, 255, 0.45)')}
      onBlur={(e) => (e.target.style.borderColor = 'rgba(64, 54, 88, 0.08)')}
    >
      {options.map((o) => <option key={o} value={o} style={{ background: '#13131a' }}>{o}</option>)}
    </select>
    <ChevronDown size={13} color="#8f8a97" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
  </div>
);

const RangeInput: React.FC<{ value: number; min: number; max: number; onChange: (v: number) => void; label: string; unit?: string }> = ({ value, min, max, onChange, label, unit = 'px' }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ fontSize: 11, color: '#766ef5', background: 'rgba(124, 115, 255, 0.1)', border: '1px solid rgba(124, 115, 255, 0.14)', borderRadius: 8, padding: '4px 8px', fontWeight: 700 }}>
        {value}{unit}
      </div>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: '#FF2D92', cursor: 'pointer' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
      <span style={{ fontSize: 10, color: '#b3aebb' }}>{min}{unit}</span>
      <span style={{ fontSize: 10, color: '#b3aebb' }}>{max}{unit}</span>
    </div>
  </div>
);

const GeneralTab: React.FC<GeneralTabProps> = ({ settings, onChange }) => {
  const update = (key: keyof GeneralSettings, value: any) => onChange({ ...settings, [key]: value });

  const ThemeBtn: React.FC<{ value: 'auto' | 'light' | 'dark'; label: string }> = ({ value, label }) => (
    <button
      onClick={() => update('theme', value)}
      style={{
        flex: 1, padding: '10px 8px',
        background: settings.theme === value ? 'rgba(255,45,146,0.15)' : '#13131a',
        border: settings.theme === value ? '1px solid rgba(255,45,146,0.4)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8, color: settings.theme === value ? '#FF2D92' : 'rgba(240,240,245,0.45)',
        fontFamily: 'Space Grotesk', fontWeight: settings.theme === value ? 600 : 400,
        fontSize: 13, cursor: 'pointer', transition: 'all 0.25s',
        boxShadow: settings.theme === value ? '0 0 12px rgba(255,45,146,0.2)' : 'none',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'gTabSlideUp 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
      <div style={{ marginBottom: 4 }}>
        <h3 style={{ fontWeight: 700, fontSize: 22, color: '#2a2732', margin: '0 0 4px' }}>Domains</h3>
        <p style={{ fontSize: 13, color: '#9a96a7', margin: 0 }}>
          Configure appearance and behavior defaults for your affiliate workspace
        </p>
      </div>

      <SectionCard title="Typography & Theme" subtitle="Font selection and visual theme" icon={<Type size={14} color="#766ef5" />}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div>
            <FieldLabel>Font Family</FieldLabel>
            <StyledSelect value={settings.font} options={['Space Grotesk', 'JetBrains Mono', 'Inter', 'Roboto', 'Poppins', 'Nunito']} onChange={(v) => update('font', v)} />
          </div>
          <div>
            <FieldLabel>Modal Theme</FieldLabel>
            <div style={{ display: 'flex', gap: 6 }}>
              <ThemeBtn value="auto" label="Auto" />
              <ThemeBtn value="light" label="Light" />
              <ThemeBtn value="dark" label="Dark" />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Sizing & Spacing" subtitle="Border radius and font size controls" icon={<Sliders size={14} color="#766ef5" />}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <RangeInput label="Border Radius" value={settings.borderRadius} min={0} max={24} onChange={(v) => update('borderRadius', v)} />
          <RangeInput label="Font Size" value={settings.fontSize} min={12} max={20} onChange={(v) => update('fontSize', v)} />
        </div>
      </SectionCard>

      <SectionCard title="Accent Color" subtitle="Primary brand color for interactive elements" icon={<Palette size={14} color="#766ef5" />}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input type="color" value={settings.accentColor} onChange={(e) => update('accentColor', e.target.value)} style={{ width: 56, height: 50, borderRadius: 10, border: '2px solid rgba(255,255,255,0.1)', background: 'none', cursor: 'pointer', padding: 3 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, color: '#383544', background: '#fbfaf8', border: '1px solid rgba(64, 54, 88, 0.08)', borderRadius: 14, padding: '13px 16px', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 700 }}>
              {settings.accentColor.toUpperCase()}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['#FF2D92', '#00FF85', '#3B99FC', '#FFD700', '#FF6E27', '#7C5CFC'].map((color) => (
                <button key={color} onClick={() => update('accentColor', color)} style={{ width: 22, height: 22, borderRadius: '50%', background: color, border: '2px solid transparent', cursor: 'pointer', outline: settings.accentColor === color ? `2px solid rgba(255,255,255,0.35)` : 'none', outlineOffset: 2, transition: 'all 0.2s', boxShadow: settings.accentColor === color ? `0 0 10px ${color}` : 'none' }} />
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Events & Triggers" subtitle="When and how the widget opens" icon={<MousePointer size={14} color="#766ef5" />}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
          <div>
            <FieldLabel>Open Event</FieldLabel>
            <StyledSelect value={settings.openEvent} options={['On Page Load', 'On Button Click', 'On Scroll', 'On Timer', 'On Exit Intent']} onChange={(v) => update('openEvent', v)} />
          </div>
        </div>
        <div>
          <FieldLabel>Open Trigger</FieldLabel>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['Automatic', 'Manual', 'Button Click', 'Custom Event'].map((trigger) => {
              const isSelected = settings.openTrigger === trigger;
              return (
                <label key={trigger} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 14px', background: isSelected ? 'rgba(255,45,146,0.1)' : '#13131a', border: `1px solid ${isSelected ? 'rgba(255,45,146,0.35)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 8, transition: 'all 0.2s' }}>
                  <div onClick={() => update('openTrigger', trigger)} style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${isSelected ? '#FF2D92' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isSelected ? '0 0 8px rgba(255,45,146,0.4)' : 'none', flexShrink: 0 }}>
                    {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF2D92' }} />}
                  </div>
                  <span style={{ fontFamily: 'Space Grotesk', fontSize: 13, color: isSelected ? '#FF2D92' : 'rgba(240,240,245,0.55)', fontWeight: isSelected ? 500 : 400 }}>{trigger}</span>
                </label>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <style>{`@keyframes gTabSlideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default GeneralTab;
