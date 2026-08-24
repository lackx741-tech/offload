"use client";

import { useMemo, type ReactNode } from "react";
import { SequenceConnect } from "@0xsequence/connect";
import { createConfig as createSequenceConfig } from "../../node_modules/@0xsequence/connect/dist/esm/config/createConfig.js";
import { buildSequenceWaasConfig } from "@/lib/sequence-config";

export function SequenceRootProvider({ children }: { children: ReactNode }) {
  const config = useMemo(
    () =>
      createSequenceConfig(
        "waas",
        buildSequenceWaasConfig({
          walletConnectProjectId:
            process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || undefined,
        }),
      ),
    [],
  );

  return <SequenceConnect config={config}>{children}</SequenceConnect>;
}
