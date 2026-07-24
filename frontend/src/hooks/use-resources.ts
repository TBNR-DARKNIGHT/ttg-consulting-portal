import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/auth/auth-context';
import { shouldUseMockApiData } from '@/auth/env';
import { apiFetch } from '@/lib/api';
import { mockResources } from '@/lib/mock-data';
import type { Resource } from '@/types';

export function useResources() {
  const { getToken } = usePortalAuth();
  const source = shouldUseMockApiData() ? 'mock' : 'live';

  const {
    data: resources = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['resources', source],
    queryFn: () => {
      if (shouldUseMockApiData()) {
        return Promise.resolve(mockResources);
      }
      // Resource metadata can be changed from the admin dialog. Do not allow the
      // browser's HTTP cache to return the pre-edit catalog after a refetch.
      return apiFetch<Resource[]>('/resources', getToken, { cache: 'no-store' });
    },
    // Admin mutations explicitly invalidate this query. Keeping normal dashboard
    // mounts warm avoids downloading the same catalog again on every navigation.
    staleTime: 5 * 60 * 1000,
  });

  return { resources, isLoading, error };
}
