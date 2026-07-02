import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/auth/auth-context';
import { shouldUseMockApiData } from '@/auth/env';
import { apiFetch } from '@/lib/api';
import { mockResources } from '@/lib/mock-data';
import type { Resource } from '@/types';

export function useResources() {
  const { getToken } = usePortalAuth();
  const source = shouldUseMockApiData() ? 'mock' : 'live';

  const { data: resources = [], isLoading, error } = useQuery({
    queryKey: ['resources', source],
    queryFn: () => {
      if (shouldUseMockApiData()) {
        return Promise.resolve(mockResources);
      }
      return apiFetch<Resource[]>('/resources', getToken);
    },
    refetchOnMount: 'always',
  });

  return { resources, isLoading, error };
}
