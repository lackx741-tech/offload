"use client";

import { useEffect, useState } from "react";
import { ActionEmbed } from "@/components/frontpage/action-embed";
import { FRONT_PAGE_CONFIG_KEY, getDefaultFrontpageConfig, type FrontpageConfig } from "@/lib/frontpage-config";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}

export default function FrontpageRuntimePage() {
  const [config, setConfig] = useState<FrontpageConfig>(getDefaultFrontpageConfig());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadConfig() {
      try {
        const res = await fetch("/api/config", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { frontpage?: FrontpageConfig };
          if (active && data.frontpage) {
            setConfig(data.frontpage);
            return;
          }
        }

        const raw = window.localStorage.getItem(FRONT_PAGE_CONFIG_KEY);
        if (!raw || !active) return;
        setConfig(JSON.parse(raw) as FrontpageConfig);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }

    void loadConfig();

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  return <ActionEmbed config={config} />;
}
