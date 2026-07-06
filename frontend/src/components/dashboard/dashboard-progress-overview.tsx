import { useMemo } from 'react';
import { LockKeyhole } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useResourceProgress } from '@/hooks/use-resource-progress';
import { useResources } from '@/hooks/use-resources';
import { useEntitlements } from '@/hooks/use-entitlements';
import { COURSES } from '@/lib/courses';
import { TTA_SHOP_URL } from '@/lib/tta-shop';
import type { ContentTopic, Resource, ResourceProgress } from '@/types';

function courseCompletion(
  courseId: string,
  topics: readonly ContentTopic[],
  resources: Resource[],
  progress: ResourceProgress[],
) {
  const topicSet = new Set(topics);
  const inCourse = resources.filter(
    (r) => r.courseId === courseId || (!r.courseId && topicSet.has(r.topic)),
  );
  const total = inCourse.length;
  const idSet = new Set(inCourse.map((r) => r.id));
  const completed = progress.filter((p) => p.completed && idSet.has(p.resourceId)).length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, pct };
}

export function DashboardProgressOverview() {
  const { resources, isLoading: resourcesLoading, error: resourcesError } = useResources();
  const { progress, isLoading: progressLoading, error: progressError } = useResourceProgress();
  const { hasCourseAccess, isLoading: entitlementsLoading } = useEntitlements();

  const loading = resourcesLoading || progressLoading || entitlementsLoading;
  const error = resourcesError ?? progressError;

  const byCourse = useMemo(
    () =>
      COURSES.map((course) => ({
        course,
        ...courseCompletion(course.id, course.topics, resources, progress),
      })),
    [resources, progress],
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading your progress…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error instanceof Error ? error.message : 'Something went wrong'}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {byCourse.map(({ course, total, completed, pct }) => (
        <div key={course.id}>
          {hasCourseAccess(course.id) ? (
          <Link
            to="/dashboard/course/$courseId"
            params={{ courseId: course.id }}
            className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full border-border shadow-sm transition-colors hover:border-brand-indigo/40 hover:bg-muted/20">
              <CardHeader className="pb-2">
                <CardDescription>{course.shortLabel}</CardDescription>
                <CardTitle className="font-serif text-lg">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Completed</span>
                  <span className="font-medium text-foreground">
                    {completed} / {total}
                  </span>
                </div>
                <Progress
                  value={pct}
                  className="h-2 bg-brand-sage/25 **:data-[slot=progress-indicator]:bg-brand-sage"
                />
              </CardContent>
            </Card>
          </Link>
          ) : (
            <a
              href={TTA_SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Purchase access to ${course.title}`}
            >
              <Card className="h-full border-brand-indigo/25 bg-brand-indigo/[0.03] shadow-sm transition-colors hover:border-brand-indigo/50 hover:bg-brand-indigo/[0.06]">
                <CardHeader className="pb-2">
                  <CardDescription>{course.shortLabel}</CardDescription>
                  <CardTitle className="font-serif text-lg">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>Unlock every module, video, and downloadable resource.</span>
                  </div>
                  <span className="inline-flex text-sm font-semibold text-brand-indigo">
                    Purchase access →
                  </span>
                </CardContent>
              </Card>
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
