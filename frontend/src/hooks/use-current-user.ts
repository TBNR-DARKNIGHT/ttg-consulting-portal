import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/auth/auth-context';
import { getCurrentUser } from '@/lib/api';

export function useCurrentUser(options: { enabled?: boolean } = {}) {
  const { getToken, isSignedIn } = usePortalAuth();
  return useQuery({
    queryKey: ['current-user'],
    queryFn: () => getCurrentUser(getToken),
    enabled: isSignedIn && (options.enabled ?? true),
    staleTime: 60_000,
  });
}
