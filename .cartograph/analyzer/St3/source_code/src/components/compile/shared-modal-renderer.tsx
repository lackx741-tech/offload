"use client";

import type { ModalPresentation } from "@/lib/modal-presentation";

type PreviewStyle = "trails" | "rainbowkit" | "reown" | "custom";
type Radius = "small" | "medium" | "large" | "full";
type ThemeMode = "light" | "dark";
type ConnectLayout = "cards" | "list" | "grid";
type OverlayBlur = "none" | "light" | "medium" | "heavy";
type FontStyle = "modern" | "rounded" | "mono";

const RADIUS_MAP = {
  small: "16px",
  medium: "22px",
  large: "30px",
  full: "999px",
} as const;

function getThemeClasses(themeMode: ThemeMode) {
  if (themeMode === "light") {
    return {
      shell: "bg-[#f4f4f6] text-[#16161d] border-black/10",
      panel: "bg-white text-[#16161d] border-black/10",
      muted: "text-[#6a6a77]",
      border: "rgba(20,20,27,0.10)",
    };
  }
  return {
    shell: "bg-[#0b0b10] text-white border-white/10",
    panel: "bg-[#14141b] text-white border-white/10",
    muted: "text-[#9b9ba7]",
    border: "rgba(255,255,255,0.10)",
  };
}

function getFontFamily(fontStyle: FontStyle) {
  if (fontStyle === "mono") return "ui-monospace, SFMono-Regular, Menlo, monospace";
  if (fontStyle === "rounded") return '"SF Pro Rounded", "Nunito", ui-sans-serif, system-ui, sans-serif';
  return 'Inter, "SF Pro Display", ui-sans-serif, system-ui, sans-serif';
}

function getOverlayBlurValue(overlayBlur: OverlayBlur) {
  if (overlayBlur === "none") return "0px";
  if (overlayBlur === "light") return "6px";
  if (overlayBlur === "heavy") return "20px";
  return "12px";
}

export function SharedModalRenderer({
  style,
  accentColor,
  accentColorForeground,
  borderRadius,
  themeMode,
  connectLayout,
  collapseWallets,
  featuredWallets,
  enableEmailOption,
  enableSocials,
  overlayBlur,
  fontStyle,
  preferredChains,
  presentation,
  title,
  subtitle,
  ctaLabel,
}: {
  style: PreviewStyle;
  accentColor: string;
  accentColorForeground: string;
  borderRadius: Radius;
  themeMode: ThemeMode;
  connectLayout: ConnectLayout;
  collapseWallets: boolean;
  featuredWallets: string[];
  enableEmailOption: boolean;
  enableSocials: boolean;
  overlayBlur: OverlayBlur;
  fontStyle: FontStyle;
  preferredChains: number[];
  presentation?: ModalPresentation;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
}) {
  const theme = getThemeClasses(themeMode);
  const radius = RADIUS_MAP[borderRadius];
  const fontFamily = getFontFamily(fontStyle);
  const overlay = getOverlayBlurValue(overlayBlur);
  const resolvedTitle =
    title ||
    presentation?.title ||
    (style === "trails"
      ? "Route Your Transaction"
      : style === "rainbowkit"
        ? "Connect a Wallet"
        : style === "reown"
          ? "Select a Wallet"
          : "Launch Modal");
  const resolvedSubtitle =
    subtitle ||
    presentation?.subtitle ||
    (style === "trails"
      ? "Choose the cleanest path across wallet, chain, and token."
      : style === "rainbowkit"
        ? "Popular wallets first, with a polished app feel."
        : style === "reown"
          ? "Flexible wallet connect flow with app-level theming."
          : "Use your own system shell and wallet orchestration.");
  const items = (
    presentation?.items?.length
      ? presentation.items
      : featuredWallets.length
      ? featuredWallets
      : style === "trails"
        ? ["route", "base", "wallet"]
        : style === "rainbowkit"
          ? ["metamask", "rainbow", "coinbase"]
          : style === "reown"
            ? ["injected", "walletconnect", "smart account"]
            : ["primary", "fallback", "custom"]
  ).slice(0, collapseWallets ? 2 : 3);

  return (
    <div className={`rounded-[36px] border p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)] ${theme.shell}`} style={{ backdropFilter: `blur(${overlay})`, fontFamily }}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em]" style={{ color: accentColor }}>
            {style} style
          </p>
          <p className={`mt-1 text-sm ${theme.muted}`}>Mode, accent, and radius are live.</p>
        </div>
        <div className="h-10 w-10 rounded-full border" style={{ borderColor: accentColor, backgroundColor: `${accentColor}22` }} />
      </div>

      <div className="border p-4" style={{ borderRadius: radius }}>
        <div className="mb-4">
          <p className="text-lg font-semibold">{resolvedTitle}</p>
          <p className={`mt-1 text-sm ${theme.muted}`}>{resolvedSubtitle}</p>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item}
              className={`flex items-center justify-between border px-4 py-3 ${theme.panel}`}
              style={{
                borderRadius: radius,
                borderColor: index === 0 ? `${accentColor}66` : theme.border,
                boxShadow: index === 0 ? `0 0 0 1px ${accentColor}33 inset` : undefined,
              }}
            >
              <span className="text-sm font-medium capitalize">{item}</span>
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                {style === "trails" ? (index === 0 ? "Best" : index + 1) : "Connect"}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-5 h-12 w-full text-sm font-semibold"
          style={{
            borderRadius: borderRadius === "full" ? "999px" : radius,
            backgroundColor: accentColor,
            color: accentColorForeground,
          }}
        >
          {ctaLabel || presentation?.ctaLabel || (style === "trails" ? "Continue Route" : "Open Modal")}
        </button>
        <div className={`mt-4 flex ${connectLayout === "grid" ? "flex-wrap" : "flex-nowrap"} gap-2`}>
          {preferredChains.slice(0, 3).map((chainId) => (
            <span key={chainId} className="rounded-full border px-3 py-1 text-[11px]" style={{ borderColor: theme.border, color: theme.muted }}>
              Chain {chainId}
            </span>
          ))}
        </div>
        {(enableEmailOption || enableSocials) ? (
          <div className="mt-3 text-xs" style={{ color: theme.muted }}>
            {enableEmailOption ? "Email option enabled" : null}
            {enableEmailOption && enableSocials ? " • " : null}
            {enableSocials ? "Socials enabled" : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
