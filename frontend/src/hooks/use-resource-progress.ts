import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/auth/auth-context';
import { shouldUseMockApiData } from '@/auth/env';
import { apiFetch } from '@/lib/api';
import { mockProgress } from '@/lib/mock-data';
import type { ResourceProgress } from '@/types';

export function useResourceProgress() {
  const { getToken } = usePortalAuth();
  const source = shouldUseMockApiData() ? 'mock' : 'live';

  const {
    data: progress = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['resource-progress', source],
    queryFn: () => {
      if (shouldUseMockApiData()) {
        return Promise.resolve(mockProgress);
      }
      return apiFetch<ResourceProgress[]>('/resources/progress', getToken);
    },
  });

  return { progress, isLoading, error };
}
