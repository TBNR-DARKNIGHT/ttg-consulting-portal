import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { PortalAuthContext } from './auth-context';
import type { PortalAuthContextValue, PortalTier, PortalUser } from './types';

const MOCK_USERS: Record<PortalTier, PortalUser> = {
  free: {
    id: 'user-mock-free',
    email: 'free.parent@example.com',
    firstName: 'Free',
    lastName: 'Parent',
  },
  paid: {
    id: 'user-mock-paid',
    email: 'paid.parent@example.com',
    firstName: 'Paid',
    lastName: 'Parent',
  },
  admin: {
    id: 'user-mock-admin',
    email: 'admin@example.com',
    firstName: 'Demo',
    lastName: 'Admin',
  },
};

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [tier, setTier] = useState<PortalTier>('free');
  const devBearerToken = import.meta.env.VITE_DEV_BEARER_TOKEN ?? null;

  const signIn = useCallback(async (nextTier: PortalTier = 'free') => {
    setTier(nextTier);
    setIsSignedIn(true);
  }, []);

  const signOut = useCallback(async () => {
    setIsSignedIn(false);
    setTier('free');
  }, []);

  const value = useMemo<PortalAuthContextValue>(
    () => ({
      isLoaded: true,
      isSignedIn,
      user: isSignedIn ? MOCK_USERS[tier] : null,
      tier: isSignedIn ? tier : 'free',
      getToken: async () => (isSignedIn && tier !== 'free' ? devBearerToken : null),
      signIn,
      signOut,
    }),
    [devBearerToken, isSignedIn, signIn, signOut, tier],
  );

  return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
}
