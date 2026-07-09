import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePortalAuth } from '@/auth/auth-context';
import { getAuthMode, usesDemoAuthProvider } from '@/auth/env';
import { getEntitlements, redeemAccessCode } from '@/lib/api';
import type { CourseId } from '@/lib/courses';

const FREE_COURSES: CourseId[] = ['course-1'];
const PAID_COURSES: CourseId[] = ['course-1', 'course-2'];

export function useEntitlements() {
  const { getToken, isSignedIn, tier, user } = usePortalAuth();
  const mode = getAuthMode();
  const demo = usesDemoAuthProvider(mode);

  const query = useQuery({
    queryKey: ['entitlements', mode, user?.id, demo ? tier : 'live'],
    enabled: isSignedIn,
    queryFn: async () => {
      if (demo) {
        return { courses: tier === 'paid' || tier === 'admin' ? PAID_COURSES : FREE_COURSES };
      }
      return getEntitlements(getToken);
    },
    staleTime: 60_000,
  });

  const courses = new Set(query.data?.courses ?? FREE_COURSES);
  const hasCourseAccess = (courseId: CourseId) => courses.has(courseId);

  return {
    ...query,
    courses: [...courses],
    hasCourseAccess,
  };
}

export function useRedeemAccessCode() {
  const { getToken } = usePortalAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => redeemAccessCode(code, getToken),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['entitlements'] }),
        queryClient.invalidateQueries({ queryKey: ['resources'] }),
      ]);
    },
  });
}
