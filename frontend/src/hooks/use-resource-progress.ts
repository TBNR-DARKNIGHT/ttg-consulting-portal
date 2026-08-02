import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePortalAuth } from '@/auth/auth-context';
import { shouldUseMockApiData } from '@/auth/env';
import {
  getResourceProgress,
  markResourceComplete,
  markResourceIncomplete,
  resetCourseProgress as resetCourseProgressApi,
  updateResourceProgress,
  type ResourceProgressUpdateInput,
} from '@/lib/api';
import { mockProgress } from '@/lib/mock-data';
import type { ResourceProgress } from '@/types';

function progressQueryKey(source: 'mock' | 'live', userKey: string) {
  return ['resource-progress', source, userKey] as const;
}

function mergeProgress(rows: ResourceProgress[] | undefined, next: ResourceProgress) {
  const byId = new Map((rows ?? []).map((row) => [row.resourceId, row]));
  byId.set(next.resourceId, next);
  return [...byId.values()];
}

function removeCourseProgress(
  rows: ResourceProgress[] | undefined,
  resourceIds: readonly string[],
) {
  const courseResourceIds = new Set(resourceIds);
  return (rows ?? []).filter((row) => !courseResourceIds.has(row.resourceId));
}

function mockProgressRow(
  resourceId: string,
  input: ResourceProgressUpdateInput,
  userId: string,
): ResourceProgress {
  const completed = Boolean(input.completed);
  const progressPercent = completed ? 100 : (input.progressPercent ?? 0);
  return {
    resourceId,
    userId,
    status: completed ? 'completed' : progressPercent > 0 ? 'in_progress' : 'not_started',
    completed,
    progressPercent,
    completedAt: completed ? new Date().toISOString() : undefined,
    lastAccessedAt: new Date().toISOString(),
    lastPositionSeconds: input.lastPositionSeconds,
    durationSeconds: input.durationSeconds,
    pagesViewed: input.pagesViewed,
    pageCount: input.pageCount,
    completionSource: completed ? (input.completionSource ?? 'manual') : undefined,
  };
}

export function useResourceProgress() {
  const { getToken, isLoaded, isSignedIn, user } = usePortalAuth();
  const source = shouldUseMockApiData() ? 'mock' : 'live';
  const userKey = isSignedIn ? (user?.id ?? 'signed-in') : 'guest';

  const {
    data: progress = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: progressQueryKey(source, userKey),
    enabled: isLoaded && isSignedIn,
    queryFn: () => {
      if (!isSignedIn) return Promise.resolve([]);
      if (shouldUseMockApiData()) return Promise.resolve(mockProgress);
      return getResourceProgress(getToken);
    },
    staleTime: 30_000,
  });

  const progressByResourceId = useMemo(
    () => new Map(progress.map((row) => [row.resourceId, row])),
    [progress],
  );

  return {
    progress: isSignedIn ? progress : [],
    progressByResourceId,
    isAvailable: isLoaded && isSignedIn,
    isLoading: isSignedIn ? isLoading : false,
    error: isSignedIn ? error : null,
  };
}

export function useResourceProgressActions(resourceId: string) {
  const { getToken, isSignedIn, user } = usePortalAuth();
  const queryClient = useQueryClient();
  const source = shouldUseMockApiData() ? 'mock' : 'live';
  const queryKey = progressQueryKey(source, isSignedIn ? (user?.id ?? 'signed-in') : 'guest');
  const userId = user?.id ?? 'mock-user';

  const writeProgress = (row: ResourceProgress) => {
    queryClient.setQueryData<ResourceProgress[]>(queryKey, (rows) => mergeProgress(rows, row));
  };

  const updateMutation = useMutation({
    mutationFn: async (input: ResourceProgressUpdateInput) => {
      if (!isSignedIn) throw new Error('Sign in to save progress');
      if (shouldUseMockApiData()) return mockProgressRow(resourceId, input, userId);
      return updateResourceProgress(resourceId, input, getToken);
    },
    onSuccess: writeProgress,
  });

  const completeMutation = useMutation({
    mutationFn: async (completionSource: ResourceProgress['completionSource'] = 'manual') => {
      if (!isSignedIn) throw new Error('Sign in to save progress');
      if (shouldUseMockApiData()) {
        return mockProgressRow(
          resourceId,
          { completed: true, progressPercent: 100, completionSource },
          userId,
        );
      }
      return markResourceComplete(resourceId, completionSource, getToken);
    },
    onSuccess: writeProgress,
  });

  const incompleteMutation = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) throw new Error('Sign in to save progress');
      if (shouldUseMockApiData()) return mockProgressRow(resourceId, { progressPercent: 0 }, userId);
      return markResourceIncomplete(resourceId, getToken);
    },
    onSuccess: writeProgress,
  });

  return {
    updateProgress: updateMutation,
    completeResource: completeMutation,
    incompleteResource: incompleteMutation,
  };
}

export function useCourseProgressActions(courseId: string, resourceIds: readonly string[]) {
  const { getToken, isSignedIn, user } = usePortalAuth();
  const queryClient = useQueryClient();
  const source = shouldUseMockApiData() ? 'mock' : 'live';
  const queryKey = progressQueryKey(source, isSignedIn ? (user?.id ?? 'signed-in') : 'guest');

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) throw new Error('Sign in to reset progress');
      if (shouldUseMockApiData()) return null;
      return resetCourseProgressApi(courseId, getToken);
    },
    onSuccess: () => {
      queryClient.setQueryData<ResourceProgress[]>(queryKey, (rows) =>
        removeCourseProgress(rows, resourceIds),
      );
    },
  });

  return {
    resetCourseProgress: resetMutation,
  };
}
