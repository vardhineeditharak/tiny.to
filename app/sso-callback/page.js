'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallbackPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
      <p>Completing login verification...</p>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
