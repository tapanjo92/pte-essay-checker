'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { DashboardApp } from './dashboard-app';

// 🔐 Cipher's L10 Correct Amplify Pattern
export function AppAuthenticator() {
  return (
    <Authenticator
      signUpAttributes={[
        'email',
        'given_name',
        'family_name'
      ]}
    >
      {({ signOut, user }) => (
        <DashboardApp user={user} signOut={signOut} />
      )}
    </Authenticator>
  );
}