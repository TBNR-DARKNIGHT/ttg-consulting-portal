import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { usePortalAuth } from '@/auth/auth-context';
import { ResourceLoadingState } from '@/components/dashboard/resource-loading-state';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getMuxPlaybackToken, getPaidStorageUrl, getPublicStorageUrl } from '@/lib/api';
import { publicBucketStorageUrl } from '@/lib/public-assets';
import { useResourceProgress, useResourceProgressActions } from '@/hooks/use-resource-progress';
import { useResources } from '@/hooks/use-resources';
import { getCourseIdForTopic } from '@/lib/courses';
import { useEntitlements } from '@/hooks/use-entitlements';
import { ArrowLeft, CheckCircle2, Circle, Download } from 'lucide-react';

const PdfDocumentViewer = lazy(() =>
  import('@/components/pdf/pdf-document-viewer').then((module) => ({
    default: module.PdfDocumentViewer,
  })),
);
const MuxPublicPlayer = lazy(() =>
  import('@/components/mux/mux-public-player').then((module) => ({
    default: module.MuxPublicPlayer,
  })),
);
const MuxSignedPlayer = lazy(() =>
  import('@/components/mux/mux-signed-player').then((module) => ({
    default: module.MuxSignedPlayer,
  })),
);

export const Route = createFileRoute('/dashboard/resources/$resourceId')({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    from?: 'overview' | 'resources' | 'videos';
    courseId?: string;
    module?: string;
  } => ({
    ...(search.from === 'overview' || search.from === 'resources' || search.from === 'videos'
      ? { from: search.from }
      : {}),
    ...(typeof search.courseId === 'string' ? { courseId: search.courseId } : {}),
    ...(typeof search.module === 'string' ? { module: search.module } : {}),
  }),
  component: ResourceDetailPage,
});

function ResourceDetailPage() {
  const { resourceId } = Route.useParams();
  const origin = Route.useSearch();
  const { resources } = useResources();
  const { getToken, isSignedIn } = usePortalAuth();
  const { hasCourseAccess, isLoading: entitlementsLoading } = useEntitlements();
  const { progressByResourceId } = useResourceProgress();
  const { updateProgress, completeResource, incompleteResource } =
    useResourceProgressActions(resourceId);
  const queryClient = useQueryClient();
  const lastVideoSaveRef = useRef(0);
  const videoCompletionSaveRef = useRef<string | null>(null);
  const lastPdfSaveRef = useRef(0);
  const lastPdfSaveSignatureRef = useRef<string | null>(null);

  const resource = useMemo(
    () => resources.find((r) => r.id === resourceId) ?? null,
    [resources, resourceId],
  );

  const resourceCourseId = resource
    ? (resource.courseId ?? getCourseIdForTopic(resource.topic))
    : null;
  const canAccess = resource
    ? resource.access !== 'paid' || (resourceCourseId !== null && hasCourseAccess(resourceCourseId))
    : false;

  const backToCourseList = useMemo(() => {
    if (!resource && !origin.courseId) {
      return {
        to: '/dashboard/course/$courseId/resources' as const,
        params: { courseId: 'course-1' as const },
        search: {},
      };
    }
    const courseId =
      origin.courseId ??
      (resource ? (resource.courseId ?? getCourseIdForTopic(resource.topic)) : 'course-1');
    const moduleId = origin.module ?? resource?.moduleId;
    const search = moduleId ? { module: moduleId } : {};
    if (origin.from === 'overview') {
      return { to: '/dashboard/course/$courseId' as const, params: { courseId }, search };
    }
    if (origin.from === 'videos' || (!origin.from && resource?.type === 'video')) {
      return { to: '/dashboard/course/$courseId/videos' as const, params: { courseId }, search };
    }
    return { to: '/dashboard/course/$courseId/resources' as const, params: { courseId }, search };
  }, [origin, resource]);

  const needsMuxToken = Boolean(
    resource &&
    canAccess &&
    resource.type === 'video' &&
    resource.muxPlaybackId &&
    resource.muxPlaybackSigned,
  );

  const muxTokenQuery = useQuery({
    enabled: needsMuxToken,
    queryKey: ['mux-playback-token', resourceId, canAccess],
    queryFn: async () => {
      if (!resource?.muxPlaybackId) {
        throw new Error('Missing Mux playback id');
      }
      return getMuxPlaybackToken({ resourceId: resource.id, expiresIn: 3600 }, getToken);
    },
    staleTime: 50 * 60 * 1000,
  });

  const directPublicUrl =
    resource?.type === 'pdf' && resource.access !== 'paid' && resource.bucket && resource.filePath
      ? publicBucketStorageUrl(resource.bucket, resource.filePath)
      : '';

  const publicUrlQuery = useQuery({
    enabled: Boolean(
      resource &&
      canAccess &&
      resource.type === 'pdf' &&
      resource.access !== 'paid' &&
      resource.bucket &&
      resource.filePath &&
      !directPublicUrl,
    ),
    queryKey: ['resource-public-url', resourceId],
    queryFn: async () => {
      if (!resource?.bucket || !resource.filePath) {
        throw new Error('Missing storage location for this resource');
      }
      return getPublicStorageUrl({ resourceId: resource.id }, getToken);
    },
  });

  const paidUrlQuery = useQuery({
    enabled: Boolean(
      resource && canAccess && resource.type === 'pdf' && resource.bucket && resource.filePath,
    ),
    queryKey: ['resource-paid-url', resourceId, canAccess],
    queryFn: async () => {
      if (!resource || resource.access !== 'paid') {
        return null;
      }
      return getPaidStorageUrl({ resourceId: resource.id, expiresIn: 3600 }, getToken);
    },
    staleTime: 50 * 60 * 1000,
  });

  const publicObjectUrl = directPublicUrl || publicUrlQuery.data?.url || null;
  const paidObjectUrl = paidUrlQuery.data?.url ?? null;
  const pdfUrl = publicObjectUrl ?? paidObjectUrl;

  const backendDownloadUrl = useMemo(() => {
    if (!resource?.bucket || !resource.filePath) return null;
    const path =
      resource.access === 'paid'
        ? null
        : `/storage/public-download?resource_id=${encodeURIComponent(resource.id)}`;
    const base = import.meta.env.VITE_API_BASE_URL ?? '';
    return base && path ? `${base}${path}` : null;
  }, [resource]);

  const downloadFilename = `${resource?.title ?? 'resource'}.pdf`.replace(/[<>:"/\\|?*]/g, '-');

  const isVideo = resource?.type === 'video';
  const isPdf = resource?.type === 'pdf';
  const playbackJwt = muxTokenQuery.data?.token ?? null;
  const resourceProgress = resource ? progressByResourceId.get(resource.id) : undefined;
  const progressPercent = resourceProgress?.progressPercent ?? 0;
  const resourceCompleted = Boolean(resourceProgress?.completed);
  const savedVideoStartTime =
    isVideo && !resourceCompleted ? resourceProgress?.lastPositionSeconds : undefined;
  const progressBusy = completeResource.isPending || incompleteResource.isPending;

  useEffect(() => {
    if (!resource?.id || !resourceCompleted) {
      videoCompletionSaveRef.current = null;
    }
  }, [resource?.id, resourceCompleted]);

  const saveVideoProgress = useCallback(
    (
      event: Event,
      options: { force?: boolean; completionSource?: 'video_threshold' | 'video_ended' } = {},
    ) => {
      if (!isSignedIn || !resource || !canAccess || !isVideo || resourceCompleted) return;
      const media = (event.currentTarget ?? event.target) as {
        currentTime?: number;
        duration?: number;
      } | null;
      const currentTime = Number(media?.currentTime ?? 0);
      const duration = Number(media?.duration ?? 0);
      if (!Number.isFinite(currentTime) || currentTime < 0) return;

      const hasDuration = Number.isFinite(duration) && duration > 0;
      const nextPercent = hasDuration
        ? Math.min(100, Math.max(0, Math.round((currentTime / duration) * 100)))
        : progressPercent;
      const completionSource =
        options.completionSource ?? (nextPercent >= 90 ? 'video_threshold' : undefined);
      if (completionSource) {
        if (videoCompletionSaveRef.current === resource.id) return;
        videoCompletionSaveRef.current = resource.id;
      }
      const now = Date.now();
      if (!options.force && !completionSource && now - lastVideoSaveRef.current < 10_000) {
        return;
      }
      lastVideoSaveRef.current = now;
      updateProgress.mutate(
        {
          progressPercent: nextPercent,
          lastPositionSeconds: Math.floor(currentTime),
          durationSeconds: hasDuration ? Math.floor(duration) : undefined,
          completed: Boolean(completionSource),
          completionSource,
        },
        {
          onError: () => {
            if (completionSource && videoCompletionSaveRef.current === resource.id) {
              videoCompletionSaveRef.current = null;
            }
          },
        },
      );
    },
    [canAccess, isSignedIn, isVideo, progressPercent, resource, resourceCompleted, updateProgress],
  );

  const savePdfProgress = useCallback(
    ({ pagesViewed, pageCount }: { pagesViewed: number[]; pageCount: number }) => {
      if (!isSignedIn || !resource || !canAccess || !isPdf) return;
      const viewedPages = [...new Set(pagesViewed)]
        .filter((page) => Number.isInteger(page) && page > 0 && page <= pageCount)
        .sort((a, b) => a - b);
      const signature = `${pageCount}:${viewedPages.join(',')}`;
      if (lastPdfSaveSignatureRef.current === signature) return;

      const percent = pageCount > 0 ? Math.round((viewedPages.length / pageCount) * 100) : 0;
      const now = Date.now();
      const viewedAllPages = pageCount > 0 && viewedPages.length >= pageCount;
      if (now - lastPdfSaveRef.current < 5_000 && !viewedAllPages) return;
      lastPdfSaveRef.current = now;
      lastPdfSaveSignatureRef.current = signature;
      updateProgress.mutate(
        {
          progressPercent: Math.min(100, percent),
          pagesViewed: viewedPages,
          pageCount,
        },
        {
          onError: () => {
            if (lastPdfSaveSignatureRef.current === signature) {
              lastPdfSaveSignatureRef.current = null;
            }
          },
        },
      );
    },
    [canAccess, isPdf, isSignedIn, resource, updateProgress],
  );

  const markComplete = () => {
    completeResource.mutate('manual', {
      onSuccess: () => toast.success('Marked complete'),
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : 'Unable to save progress'),
    });
  };

  const markIncomplete = () => {
    incompleteResource.mutate(undefined, {
      onSuccess: () => toast.success('Marked incomplete'),
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : 'Unable to save progress'),
    });
  };

  if (!resource) {
    return (
      <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <p className="text-sm text-muted-foreground">Resource not found.</p>
          <Button variant="outline" asChild>
            <Link
              to={backToCourseList.to}
              params={backToCourseList.params}
              search={backToCourseList.search}
            >
              Back to course list
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  if (!entitlementsLoading && !canAccess) {
    return (
      <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {resource.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            This resource requires course access. Sign in or redeem an access code to unlock it.
          </p>
          <Button variant="outline" asChild>
            <Link
              to={backToCourseList.to}
              params={backToCourseList.params}
              search={backToCourseList.search}
            >
              Back to course list
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const videoReadyPublic = isVideo && resource.muxPlaybackId && !resource.muxPlaybackSigned;
  const videoReadySigned =
    isVideo && resource.muxPlaybackId && resource.muxPlaybackSigned && playbackJwt;

  return (
    <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {resource.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{resource.description}</p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <Button variant="outline" size="icon" asChild>
              <Link
                to={backToCourseList.to}
                params={backToCourseList.params}
                search={backToCourseList.search}
                aria-label="Back"
                title="Back"
              >
                <ArrowLeft aria-hidden="true" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            {isPdf && pdfUrl && (
              <Button size="icon" asChild>
                <a
                  href={resource.access === 'paid' ? pdfUrl : (backendDownloadUrl ?? pdfUrl)}
                  download={downloadFilename}
                  aria-label="Download PDF"
                  title="Download PDF"
                >
                  <Download aria-hidden="true" />
                  <span className="sr-only">Download PDF</span>
                </a>
              </Button>
            )}
          </div>
        </header>

        {isSignedIn && isPdf && (
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>Saved progress</span>
                  <span className="font-medium text-foreground">
                    {resourceProgress?.completed ? 'Complete' : `${progressPercent}%`}
                  </span>
                </div>
                <Progress
                  value={resourceProgress?.completed ? 100 : progressPercent}
                  className="h-2 bg-brand-sage/25 **:data-[slot=progress-indicator]:bg-brand-sage"
                />
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {resourceProgress?.completed ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={progressBusy}
                    onClick={markIncomplete}
                  >
                    <Circle className="size-4" aria-hidden />
                    Mark incomplete
                  </Button>
                ) : (
                  <Button type="button" size="sm" disabled={progressBusy} onClick={markComplete}>
                    <CheckCircle2 className="size-4" aria-hidden />
                    Mark complete
                  </Button>
                )}
              </div>
            </div>
          </section>
        )}

        {isVideo && !resource.muxPlaybackId && (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            This video is not provisioned yet (no Mux playback ID in the catalog).
          </div>
        )}

        {isVideo && resource.muxPlaybackId && resource.muxPlaybackSigned && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {muxTokenQuery.isLoading && (
              <div className="p-6 text-sm text-muted-foreground">Preparing secure playback…</div>
            )}
            {muxTokenQuery.error && (
              <div className="p-6 text-sm text-destructive space-y-2" role="alert">
                <p>
                  {muxTokenQuery.error instanceof Error
                    ? muxTokenQuery.error.message
                    : 'Failed to load playback token'}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void queryClient.invalidateQueries({
                      queryKey: ['mux-playback-token', resourceId, canAccess],
                    })
                  }
                >
                  Retry
                </Button>
              </div>
            )}
            {videoReadySigned && playbackJwt && (
              <Suspense
                fallback={<ResourceLoadingState label="Loading video player..." className="p-6" />}
              >
                <MuxSignedPlayer
                  playbackId={resource.muxPlaybackId}
                  playbackToken={playbackJwt}
                  title={resource.title}
                  startTime={savedVideoStartTime}
                  onTimeUpdate={(event) => saveVideoProgress(event)}
                  onPause={(event) => saveVideoProgress(event, { force: true })}
                  onEnded={(event) =>
                    saveVideoProgress(event, { force: true, completionSource: 'video_ended' })
                  }
                  onError={() => {
                    void queryClient.invalidateQueries({
                      queryKey: ['mux-playback-token', resourceId, canAccess],
                    });
                  }}
                />
              </Suspense>
            )}
          </div>
        )}

        {videoReadyPublic && resource.muxPlaybackId && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Suspense
              fallback={<ResourceLoadingState label="Loading video player..." className="p-6" />}
            >
              <MuxPublicPlayer
                playbackId={resource.muxPlaybackId}
                title={resource.title}
                startTime={savedVideoStartTime}
                onTimeUpdate={(event) => saveVideoProgress(event)}
                onPause={(event) => saveVideoProgress(event, { force: true })}
                onEnded={(event) =>
                  saveVideoProgress(event, { force: true, completionSource: 'video_ended' })
                }
              />
            </Suspense>
          </div>
        )}

        {!isPdf && !isVideo && (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            This detail page supports PDFs and Mux-hosted videos only.
          </div>
        )}

        {isPdf && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {(publicUrlQuery.isLoading || paidUrlQuery.isLoading) && (
              <ResourceLoadingState label="Preparing your document…" className="p-6" />
            )}
            {(publicUrlQuery.error || paidUrlQuery.error) && (
              <div className="p-6 text-sm text-destructive" role="alert">
                {publicUrlQuery.error instanceof Error
                  ? publicUrlQuery.error.message
                  : paidUrlQuery.error instanceof Error
                    ? paidUrlQuery.error.message
                    : 'Failed to load PDF'}
                <div className="mt-2 text-xs text-muted-foreground">
                  Tip: ensure <span className="font-mono">VITE_API_BASE_URL</span> points at your
                  backend (usually <span className="font-mono">http://127.0.0.1:8000/api/v1</span>{' '}
                  when running <span className="font-mono">npm run dev</span>).
                </div>
              </div>
            )}
            {pdfUrl && (
              <Suspense
                fallback={<ResourceLoadingState label="Loading PDF viewer…" className="p-6" />}
              >
                <PdfDocumentViewer
                  key={pdfUrl}
                  file={pdfUrl}
                  title={resource.title}
                  onProgress={savePdfProgress}
                />
              </Suspense>
            )}
            {!publicUrlQuery.isLoading &&
              !paidUrlQuery.isLoading &&
              !publicUrlQuery.error &&
              !paidUrlQuery.error &&
              !publicObjectUrl &&
              !paidObjectUrl && (
                <div className="p-6 text-sm text-muted-foreground">No PDF content loaded yet.</div>
              )}
          </div>
        )}
      </div>
    </main>
  );
}
