import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useResourceProgress } from '@/hooks/use-resource-progress';
import { useResources } from '@/hooks/use-resources';
import { COURSES } from '@/lib/courses';
import type { ContentTopic, Resource, ResourceProgress } from '@/types';

function courseCompletion(
  topics: readonly ContentTopic[],
  resources: Resource[],
  progress: ResourceProgress[],
) {
  const topicSet = new Set(topics);
  const inCourse = resources.filter((r) => topicSet.has(r.topic));
  const total = inCourse.length;
  const idSet = new Set(inCourse.map((r) => r.id));
  const completed = progress.filter((p) => p.completed && idSet.has(p.resourceId)).length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, pct };
}

export function DashboardProgressOverview() {
  const { resources, isLoading: resourcesLoading, error: resourcesError } = useResources();
  const { progress, isLoading: progressLoading, error: progressError } = useResourceProgress();

  const loading = resourcesLoading || progressLoading;
  const error = resourcesError ?? progressError;

  const byCourse = useMemo(
    () =>
      COURSES.map((course) => ({
        course,
        ...courseCompletion(course.topics, resources, progress),
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
        <Card key={course.id} className="border-border shadow-sm">
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
      ))}
    </div>
  );
}
