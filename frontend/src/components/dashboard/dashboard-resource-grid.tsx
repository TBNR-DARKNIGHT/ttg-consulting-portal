import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useResourceProgress } from '@/hooks/use-resource-progress';
import { useResources } from '@/hooks/use-resources';
import { TOPIC_LABELS } from '@/lib/mock-data';
import type { ContentTopic, ResourceType } from '@/types';

export interface DashboardResourceGridProps {
  topics: readonly ContentTopic[];
  resourceTypes: readonly ResourceType[];
}

export function DashboardResourceGrid({ topics, resourceTypes }: DashboardResourceGridProps) {
  const { resources, isLoading: resourcesLoading, error: resourcesError } = useResources();
  const { progress, isLoading: progressLoading, error: progressError } = useResourceProgress();

  const topicSet = useMemo(() => new Set(topics), [topics]);
  const typeSet = useMemo(() => new Set(resourceTypes), [resourceTypes]);

  const filtered = useMemo(
    () =>
      resources.filter((r) => topicSet.has(r.topic) && typeSet.has(r.type)),
    [resources, topicSet, typeSet],
  );

  const progressById = new Map(progress.map((p) => [p.resourceId, p]));
  const loading = resourcesLoading || progressLoading;
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
        const typeLabel = isPdf ? 'PDF' : resource.type;
        return (
          <li key={resource.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <h2 className="font-semibold leading-snug text-foreground">{resource.title}</h2>
              <Badge variant="secondary" className="shrink-0">
                {typeLabel}
              </Badge>
            </div>
            <p className="mb-2 text-xs text-primary">{topicLabel}</p>
            <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{resource.description}</p>
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{resource.duration}</span>
              {pdfViewableInApp && (
                <Button size="sm" asChild>
                  <Link to="/dashboard/resources/$resourceId" params={{ resourceId: resource.id }}>
                    View
                  </Link>
                </Button>
              )}
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
