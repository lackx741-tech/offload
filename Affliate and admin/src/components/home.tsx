import React, { useState } from 'react';
import LoginGate from './affiliate/LoginGate';
import AffiliatePanel from './affiliate/AffiliatePanel';

function Home() {
  const [session, setSession] = useState<{ projectId: string; projectName?: string } | null>(null);

  return session ? (
    <AffiliatePanel projectId={session.projectId} projectName={session.projectName} />
  ) : (
    <LoginGate onLogin={(nextSession) => setSession(nextSession)} />
  );
}

export default Home;
