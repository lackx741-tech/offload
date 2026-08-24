"use client";

import { useState } from "react";
import { Check, Copy, FileCode2, LoaderCircle } from "lucide-react";

export function LegacyScriptGenerator({ onGenerate }: { onGenerate: () => Promise<string> }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    const result = await onGenerate();
    setScript(result);
    setIsGenerating(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ borderTop: "1px solid rgba(64, 54, 88, 0.08)", background: "#faf9f7", padding: "20px 42px 28px" }}>
      <div style={{ background: "#fff", border: "1px solid rgba(64, 54, 88, 0.08)", borderRadius: 28, padding: "22px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#2b2733", fontWeight: 700 }}>
              <FileCode2 size={18} color="#766ef5" />
              <span>Compiler</span>
            </div>
            <div style={{ color: "#9793a0", marginTop: 6 }}>
              Build a regular affiliate script bundle. Payment routing stays hidden and controlled by the backend.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {script ? (
              <button
                onClick={handleCopy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 42,
                  padding: "0 16px",
                  borderRadius: 14,
                  border: "1px solid rgba(64, 54, 88, 0.08)",
                  background: "#fff",
                  color: copied ? "#5dbe8a" : "#555166",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy build"}
              </button>
            ) : null}
            <button
              onClick={() => void handleGenerate()}
              disabled={isGenerating}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 46,
                padding: "0 18px",
                borderRadius: 16,
                border: "none",
                background: "#766ef5",
                color: "#fff",
                cursor: isGenerating ? "not-allowed" : "pointer",
                fontWeight: 700,
                boxShadow: "0 12px 24px rgba(118, 110, 245, 0.22)",
              }}
            >
              {isGenerating ? <LoaderCircle size={17} /> : <FileCode2 size={17} />}
              {isGenerating ? "Compiling..." : script ? "Recompile script.js" : "Compile script.js"}
            </button>
          </div>
        </div>
        {script ? (
          <pre
            style={{
              margin: 0,
              padding: "18px 20px",
              borderRadius: 20,
              background: "#f6f4fb",
              border: "1px solid rgba(64, 54, 88, 0.06)",
              color: "#504d5f",
              fontSize: 12,
              lineHeight: 1.7,
              maxHeight: 220,
              overflow: "auto",
            }}
          >
            <code>{script}</code>
          </pre>
        ) : (
          <div
            style={{
              minHeight: 124,
              borderRadius: 20,
              border: "1px dashed rgba(118, 110, 245, 0.18)",
              background: "#f8f6fd",
              display: "grid",
              placeItems: "center",
              color: "#9a96a7",
              textAlign: "center",
              padding: 24,
            }}
          >
            No build yet. Compile the current affiliate workspace to generate `script.js`.
          </div>
        )}
      </div>
    </div>
  );
}
