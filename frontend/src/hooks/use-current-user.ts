import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/auth/auth-context';
import { getCurrentUser } from '@/lib/api';

export function useCurrentUser() {
  const { getToken, isSignedIn } = usePortalAuth();
  return useQuery({
    queryKey: ['current-user'],
    queryFn: () => getCurrentUser(getToken),
    enabled: isSignedIn,
    staleTime: 60_000,
  });
}

