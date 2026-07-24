import { useQuery } from '@tanstack/react-query';
import { getPortalCoursePreviews, hasApiBaseUrl, type PortalPreview } from '@/lib/api';

const OFFLINE_PORTAL_PREVIEWS: PortalPreview[] = [
  { id: 'offline-prev-1', title: '[PREV] TTA H DSA 1', muxPlaybackId: '', duration: '' },
  { id: 'offline-prev-2', title: '[PREV] TTA H DSA 2', muxPlaybackId: '', duration: '' },
  { id: 'offline-prev-3', title: '[PREV] TTA H DSA 3', muxPlaybackId: '', duration: '' },
];

export function usePortalCoursePreviews() {
  const useLiveApi = hasApiBaseUrl();

  const {
    data: previews = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portal', 'course-previews', useLiveApi ? 'live' : 'offline'],
    queryFn: () => {
      if (!useLiveApi) {
        return Promise.resolve(OFFLINE_PORTAL_PREVIEWS);
      }
      return getPortalCoursePreviews();
    },
    staleTime: 5 * 60 * 1000,
  });

  return { previews, isLoading, error, refetch, isOfflineDemo: !useLiveApi };
}
