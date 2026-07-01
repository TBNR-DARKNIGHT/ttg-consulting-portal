import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { LockKeyhole } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useResourceProgress } from '@/hooks/use-resource-progress';
import { useResources } from '@/hooks/use-resources';
import { TOPIC_LABELS } from '@/lib/mock-data';
import { getCourseIdForTopic } from '@/lib/courses';
import { useEntitlements } from '@/hooks/use-entitlements';
import type { ContentTopic, ResourceType } from '@/types';

export interface DashboardResourceGridProps {
  topics: readonly ContentTopic[];
  resourceTypes: readonly ResourceType[];
}

export function DashboardResourceGrid({ topics, resourceTypes }: DashboardResourceGridProps) {
  const { resources, isLoading: resourcesLoading, error: resourcesError } = useResources();
  const { progress, isLoading: progressLoading, error: progressError } = useResourceProgress();
  const { hasCourseAccess, isLoading: entitlementsLoading } = useEntitlements();

  const topicSet = useMemo(() => new Set(topics), [topics]);
  const typeSet = useMemo(() => new Set(resourceTypes), [resourceTypes]);

  const filtered = useMemo(
    () =>
      resources.filter((r) => topicSet.has(r.topic) && typeSet.has(r.type)),
    [resources, topicSet, typeSet],
  );

  const progressById = new Map(progress.map((p) => [p.resourceId, p]));
  const loading = resourcesLoading || progressLoading || entitlementsLoading;
  const error = resourcesError ?? progressError;

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading resources…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error instanceof Error ? error.message : 'Something went wrong'}
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {filtered.map((resource) => {
        const p = progressById.get(resource.id);
        const topicLabel = TOPIC_LABELS[resource.topic];
        const isPdf = resource.type === 'pdf';
        const pdfViewableInApp = Boolean(isPdf && resource.bucket && resource.filePath);
        const videoWatchable = Boolean(
          resource.type === 'video' && resource.muxPlaybackId,
        );
        const typeLabel = isPdf ? 'PDF' : resource.type;
        const courseId = resource.courseId ?? getCourseIdForTopic(resource.topic);
        const locked = !hasCourseAccess(courseId);
        return (
          <li key={resource.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <h2 className="font-semibold leading-snug text-foreground">{resource.title}</h2>
              <Badge variant="secondary" className="shrink-0">
                {locked ? (
                  <span className="inline-flex items-center gap-1">
                    <LockKeyhole className="size-3" aria-hidden />
                    Locked
                  </span>
                ) : (
                  typeLabel
                )}
              </Badge>
            </div>
            <p className="mb-2 text-xs text-primary">{topicLabel}</p>
            <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{resource.description}</p>
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{resource.duration}</span>
              <div className="flex shrink-0 gap-2">
                {locked && (
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/dashboard/settings" hash="course-access">
                      Unlock
                    </Link>
                  </Button>
                )}
                {!locked && pdfViewableInApp && (
                  <Button size="sm" asChild>
                    <Link to="/dashboard/resources/$resourceId" params={{ resourceId: resource.id }}>
                      View
                    </Link>
                  </Button>
                )}
                {!locked && videoWatchable && (
                  <Button size="sm" asChild>
                    <Link to="/dashboard/resources/$resourceId" params={{ resourceId: resource.id }}>
                      Watch
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              {p?.completed ? (
                <span className="font-medium text-primary">Completed</span>
              ) : p?.lastAccessedAt ? (
                <span>In progress</span>
              ) : (
                <span>Not started</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
