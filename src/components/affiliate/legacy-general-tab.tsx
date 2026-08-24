"use client";

import type { GeneralSettings } from "@/components/affiliate/legacy-types";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 12, color: "#8f8a97", display: "block", marginBottom: 8, fontWeight: 700 }}>
      {children}
    </label>
  );
}

function StyledSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{
        width: "100%",
        background: "#fbfaf8",
        border: "1px solid rgba(64, 54, 88, 0.08)",
        borderRadius: 14,
        padding: "13px 14px",
        color: "#332f3d",
        fontSize: 14,
        outline: "none",
      }}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function LegacyGeneralTab({
  settings,
  onChange,
}: {
  settings: GeneralSettings;
  onChange: (settings: GeneralSettings) => void;
}) {
  const update = (key: keyof GeneralSettings, value: string | number) => onChange({ ...settings, [key]: value });

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ background: "#fff", border: "1px solid rgba(64, 54, 88, 0.08)", borderRadius: 28, padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 22, color: "#2a2732", marginBottom: 6 }}>Domains</div>
        <div style={{ fontSize: 13, color: "#9a96a7", marginBottom: 20 }}>
          Configure appearance and behavior defaults for your affiliate workspace
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div>
            <FieldLabel>Font Family</FieldLabel>
            <StyledSelect value={settings.font} options={["Space Grotesk", "JetBrains Mono", "Inter", "Roboto", "Poppins"]} onChange={(value) => update("font", value)} />
          </div>
          <div>
            <FieldLabel>Theme</FieldLabel>
            <StyledSelect value={settings.theme} options={["auto", "light", "dark"]} onChange={(value) => update("theme", value)} />
          </div>
          <div>
            <FieldLabel>Open Event</FieldLabel>
            <StyledSelect value={settings.openEvent} options={["After click on button", "On page load", "On timer"]} onChange={(value) => update("openEvent", value)} />
          </div>
          <div>
            <FieldLabel>Open Trigger</FieldLabel>
            <StyledSelect value={settings.openTrigger} options={["Automatic", "Manual", "Button Click"]} onChange={(value) => update("openTrigger", value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
