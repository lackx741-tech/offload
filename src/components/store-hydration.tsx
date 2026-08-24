"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export function StoreHydration({ children }: { children: React.ReactNode }) {
  const hydrate = useStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}
