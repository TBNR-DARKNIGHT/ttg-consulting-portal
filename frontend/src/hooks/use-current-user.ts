import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/auth/auth-context';
import { getAuthMode, usesDemoAuthProvider } from '@/auth/env';
import { getCurrentUser, type CurrentUserResponse } from '@/lib/api';

function demoCurrentUser(tier: 'free' | 'paid' | 'admin'): CurrentUserResponse {
  return {
    id:
      tier === 'admin'
        ? '00000000-0000-4000-8000-000000000003'
        : tier === 'paid'
          ? '00000000-0000-4000-8000-000000000002'
          : '00000000-0000-4000-8000-000000000001',
    clerkUserId: `demo-${tier}-user`,
    email:
      tier === 'admin'
        ? 'admin@example.com'
        : tier === 'paid'
          ? 'paid.parent@example.com'
          : 'free.parent@example.com',
    role: tier === 'admin' ? 'ADMIN' : 'CLIENT',
  };
}

export function useCurrentUser(options: { enabled?: boolean } = {}) {
  const { getToken, isSignedIn, tier } = usePortalAuth();
  const mode = getAuthMode();
  const demo = usesDemoAuthProvider(mode);
  return useQuery({
    queryKey: ['current-user', demo ? tier : 'live'],
    queryFn: () => {
      if (demo) {
        return Promise.resolve(demoCurrentUser(tier));
      }
      return getCurrentUser(getToken);
    },
    enabled: isSignedIn && (options.enabled ?? true),
    staleTime: 60_000,
  });
}
