import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePortalAuth } from '@/auth/auth-context';
import { useResourceProgress } from '@/hooks/use-resource-progress';
import { useResources } from '@/hooks/use-resources';
import { getPublicStorageUrl } from '@/lib/api';
import { TOPIC_LABELS } from '@/lib/mock-data';

export const Route = createFileRoute('/dashboard/resources')({
  component: DashboardResourcesPage,
});

function DashboardResourcesPage() {
  const { resources, isLoading: resourcesLoading, error: resourcesError } = useResources();
  const { progress, isLoading: progressLoading, error: progressError } = useResourceProgress();
  const { getToken } = usePortalAuth();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const progressById = new Map(progress.map((p) => [p.resourceId, p]));
  const loading = resourcesLoading || progressLoading;
  const error = resourcesError ?? progressError;

  return (
    <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Resources
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse consulting materials and track your progress.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/">Home</Link>
          </Button>
        </header>

        {loading && <p className="text-sm text-muted-foreground">Loading resources…</p>}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </p>
        )}

        {!loading && !error && (
          <ul className="grid gap-4 sm:grid-cols-2">
            {resources.map((resource) => {
              const p = progressById.get(resource.id);
              const topicLabel = TOPIC_LABELS[resource.topic];
              const isPdf = resource.type === 'pdf';
              const isPublic = resource.access !== 'paid';
              const isPaidPdf = isPdf && !isPublic;
              const canOpenPublic = Boolean(isPdf && isPublic && resource.bucket && resource.filePath);
              const typeLabel = isPdf ? 'PDF' : resource.type;
              return (
                <li
                  key={resource.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-semibold leading-snug text-foreground">{resource.title}</h2>
                    <Badge variant="secondary" className="shrink-0">
                      {typeLabel}
                    </Badge>
                  </div>
                  <p className="mb-2 text-xs text-primary">{topicLabel}</p>
                  <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{resource.duration}</span>
                    {canOpenPublic && (
                      <Button
                        size="sm"
                        disabled={openingId === resource.id}
                        onClick={() => {
                          if (!resource.bucket || !resource.filePath) return;
                          setOpeningId(resource.id);
                          void getPublicStorageUrl(
                            { bucket: resource.bucket, path: resource.filePath },
                            getToken,
                          )
                            .then((data) => {
                              window.open(data.url, '_blank', 'noopener,noreferrer');
                            })
                            .catch((e: unknown) => {
                              const message = e instanceof Error ? e.message : 'Failed to open PDF';
                              window.alert(message);
                            })
                            .finally(() => {
                              setOpeningId((prev) => (prev === resource.id ? null : prev));
                            });
                        }}
                      >
                        {openingId === resource.id ? 'Opening…' : 'View'}
                      </Button>
                    )}
                    {isPaidPdf && (
                      <Button
                        size="sm"
                        asChild
                      >
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
        )}
      </div>
    </main>
  );
}
