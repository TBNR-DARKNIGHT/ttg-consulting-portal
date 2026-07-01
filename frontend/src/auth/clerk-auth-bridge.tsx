import { useAuth, useClerk, useUser } from '@clerk/react';
import { useCallback, useMemo, type ReactNode } from 'react';
import { PortalAuthContext } from './auth-context';
import type { PortalAuthContextValue, PortalUser } from './types';

function clerkUserToPortalUser(clerkUser: ReturnType<typeof useUser>['user']): PortalUser | null {
  if (!clerkUser) return null;
  return {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
    firstName: clerkUser.firstName ?? null,
    lastName: clerkUser.lastName ?? null,
  };
}

export function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const { signOut: clerkSignOut } = useClerk();

  const signIn = useCallback(async () => {
    /* Sign-in is handled by Clerk UI (e.g. /auth/login). */
  }, []);

  const signOut = useCallback(async () => {
    await clerkSignOut();
  }, [clerkSignOut]);

  const value = useMemo<PortalAuthContextValue>(
    () => ({
      isLoaded: Boolean(isLoaded),
      isSignedIn: Boolean(isSignedIn),
      user: clerkUserToPortalUser(user),
      // Real access is loaded from /me/entitlements; tier remains for demo compatibility only.
      tier: 'free',
      getToken,
      signIn,
      signOut,
    }),
    [getToken, isLoaded, isSignedIn, signIn, signOut, user],
  );

  return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
}
