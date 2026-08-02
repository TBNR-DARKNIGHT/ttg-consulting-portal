import { Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { usePortalAuth } from '@/auth/auth-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useCourseProgressActions, useResourceProgress } from '@/hooks/use-resource-progress';
import { useResources } from '@/hooks/use-resources';
import { getCourseIdForTopic, type CourseDefinition } from '@/lib/courses';

export function CoursePageHeader({
  course,
  contentLabel,
}: {
  course: CourseDefinition;
  contentLabel: string;
}) {
  const { isSignedIn } = usePortalAuth();
  const { resources } = useResources();
  const { progress } = useResourceProgress();
  const [resetOpen, setResetOpen] = useState(false);

  const summary = useMemo(() => {
    const topicSet = new Set(course.topics);
    const courseResources = resources.filter(
      (resource) =>
        (resource.courseId ?? getCourseIdForTopic(resource.topic)) === course.id ||
        (!resource.courseId && topicSet.has(resource.topic)),
    );
    const courseResourceIds = new Set(courseResources.map((resource) => resource.id));
    const completed = progress.filter(
      (row) => row.completed && courseResourceIds.has(row.resourceId),
    ).length;
    const total = courseResources.length;
    return {
      completed,
      total,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100),
      resourceIds: [...courseResourceIds],
    };
  }, [course.id, course.topics, progress, resources]);

  const { resetCourseProgress } = useCourseProgressActions(course.id, summary.resourceIds);

  const confirmResetCourseProgress = () => {
    resetCourseProgress.mutate(undefined, {
      onSuccess: () => {
        toast.success('Course progress reset');
        setResetOpen(false);
      },
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : 'Unable to reset course progress'),
    });
  };

  return (
    <header className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {course.shortLabel}
          </p>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {course.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{contentLabel}</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/dashboard">Dashboard</Link>
        </Button>
      </div>
      {isSignedIn && summary.total > 0 && (
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Course progress</span>
            <span className="font-medium text-foreground">
              {summary.completed} / {summary.total} complete
            </span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <Progress
              value={summary.percent}
              className="h-2 min-w-0 bg-brand-sage/25 **:data-[slot=progress-indicator]:bg-brand-sage"
            />
            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="shrink-0">
                  Reset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Course Progress?</DialogTitle>
                  <DialogDescription>
                    This will remove all saved progress for {course.title}, including completed
                    resources, watched video positions, and PDF progress. This action cannot be
                    undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={resetCourseProgress.isPending}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={resetCourseProgress.isPending}
                    onClick={confirmResetCourseProgress}
                  >
                    Reset progress
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </header>
  );
}
