"use client";

import { useState } from "react";
import { LegacyAffiliatePanel } from "@/components/affiliate/legacy-affiliate-panel";
import { LegacyLoginGate } from "@/components/affiliate/legacy-login-gate";

type AffiliateSession = {
  projectId: string;
  projectName?: string;
};

const SESSION_KEY = "st3-affiliate-session";

export function AffiliatePortal() {
  const [session, setSession] = useState<AffiliateSession | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const nextSession = JSON.parse(raw) as AffiliateSession;
      return nextSession?.projectId ? nextSession : null;
    } catch {
      return null;
    }
  });

  if (!session) {
    return (
      <LegacyLoginGate
        onLogin={(nextSession) => {
          window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
          setSession(nextSession);
        }}
      />
    );
  }

  return <LegacyAffiliatePanel projectId={session.projectId} projectName={session.projectName} />;
}
