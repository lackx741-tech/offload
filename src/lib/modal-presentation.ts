import type { ModalConfig } from "@/lib/types";

export type ModalPresentation = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  items: string[];
};

export function deriveModalPresentation(modal: ModalConfig): ModalPresentation {
  const title =
    modal.previewStyle === "trails"
      ? "Route Your Transaction"
      : modal.modalFrameworkStyle === "rainbowkit"
        ? "Connect a Wallet"
        : modal.previewStyle === "reown"
          ? "Select a Wallet"
          : "Launch Modal";

  const subtitle =
    modal.previewStyle === "trails"
      ? "Choose the cleanest path across wallet, chain, and token."
      : modal.modalFrameworkStyle === "rainbowkit"
        ? "Popular wallets first, with a polished app feel."
        : modal.previewStyle === "reown"
          ? "Flexible wallet connect flow with app-level theming."
          : "Use your own system shell and wallet orchestration.";

  const items = (
    modal.featuredWallets.length
      ? modal.featuredWallets
      : modal.previewStyle === "trails"
        ? ["route", "base", "wallet"]
        : modal.modalFrameworkStyle === "rainbowkit"
          ? ["metamask", "rainbow", "coinbase"]
          : modal.previewStyle === "reown"
            ? ["injected", "walletconnect", "smart account"]
            : ["primary", "fallback", "custom"]
  ).slice(0, modal.collapseWallets ? 2 : 3);

  const ctaLabel = modal.previewStyle === "trails" ? "Continue Route" : "Open Modal";

  return {
    title,
    subtitle,
    ctaLabel,
    items,
  };
}
