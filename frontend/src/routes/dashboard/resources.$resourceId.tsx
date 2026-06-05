import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { usePortalAuth } from '@/auth/auth-context';
import { Button } from '@/components/ui/button';
import { apiFetchBlob, getMuxPlaybackToken, getPublicStorageUrl } from '@/lib/api';
import { useResources } from '@/hooks/use-resources';
import { getCourseIdForTopic } from '@/lib/courses';

export const Route = createFileRoute('/dashboard/resources/$resourceId')({
  component: ResourceDetailPage,
});

function ResourceDetailPage() {
  const { resourceId } = Route.useParams();
  const { resources } = useResources();
  const { getToken, tier } = usePortalAuth();
  const queryClient = useQueryClient();

  const resource = useMemo(() => resources.find((r) => r.id === resourceId) ?? null, [resources, resourceId]);

  const canAccess = resource ? tier === 'paid' || resource.access !== 'paid' : false;

  const backToCourseList = useMemo(() => {
    if (!resource) {
      return { to: '/dashboard/course/$courseId/resources' as const, params: { courseId: 'course-1' as const } };
    }
    const courseId = getCourseIdForTopic(resource.topic);
    if (resource.type === 'video') {
      return { to: '/dashboard/course/$courseId/videos' as const, params: { courseId } };
    }
    return { to: '/dashboard/course/$courseId/resources' as const, params: { courseId } };
  }, [resource]);

  const needsMuxToken = Boolean(
    resource &&
      canAccess &&
      resource.type === 'video' &&
      resource.muxPlaybackId &&
      resource.muxPlaybackSigned,
  );

  const muxTokenQuery = useQuery({
    enabled: needsMuxToken,
    queryKey: ['mux-playback-token', resourceId, tier],
    queryFn: async () => {
      if (!resource?.muxPlaybackId) {
        throw new Error('Missing Mux playback id');
      }
      return getMuxPlaybackToken({ resourceId: resource.id, expiresIn: 3600 }, getToken);
    },
    staleTime: 50 * 60 * 1000,
  });

  const publicUrlQuery = useQuery({
    enabled: Boolean(
      resource &&
        canAccess &&
        resource.type === 'pdf' &&
        resource.access !== 'paid' &&
        resource.bucket &&
        resource.filePath,
    ),
    queryKey: ['resource-public-url', resourceId],
    queryFn: async () => {
      if (!resource?.bucket || !resource.filePath) {
        throw new Error('Missing storage location for this resource');
      }
      return getPublicStorageUrl({ bucket: resource.bucket, path: resource.filePath }, getToken);
    },
  });

  const paidBlobQuery = useQuery({
    enabled: Boolean(resource && canAccess && resource.type === 'pdf' && resource.bucket && resource.filePath),
    queryKey: ['resource-paid-blob', resourceId, tier],
    queryFn: async () => {
      if (!resource?.bucket || !resource.filePath) {
        throw new Error('Missing storage location for this resource');
      }

      const encodedBucket = encodeURIComponent(resource.bucket);
      const encodedPath = encodeURIComponent(resource.filePath);

      if (resource.access !== 'paid') {
        return null;
      }

      const endpoint = `/storage/paid-download?bucket=${encodedBucket}&path=${encodedPath}`;

      return apiFetchBlob(endpoint, getToken);
    },
  });

  const blobUrl = useMemo(() => {
    if (!paidBlobQuery.data) return null;
    if (!(paidBlobQuery.data instanceof Blob)) return null;
    return URL.createObjectURL(paidBlobQuery.data);
  }, [paidBlobQuery.data]);
  useEffect(() => {
    if (!blobUrl) return;
    return () => URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);

  const publicObjectUrl = publicUrlQuery.data?.url ?? null;

  const backendDownloadUrl = useMemo(() => {
    if (!resource?.bucket || !resource.filePath) return null;
    const encodedBucket = encodeURIComponent(resource.bucket);
    const encodedPath = encodeURIComponent(resource.filePath);
    const path =
      resource.access === 'paid'
        ? `/storage/paid-download?bucket=${encodedBucket}&path=${encodedPath}`
        : `/storage/public-download?bucket=${encodedBucket}&path=${encodedPath}`;
    const base = import.meta.env.VITE_API_BASE_URL ?? '';
    return base ? `${base}${path}` : null;
  }, [resource]);

  const muxEnvKey = import.meta.env.VITE_MUX_ENV_KEY?.trim() || undefined;

  if (!resource) {
    return (
      <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <p className="text-sm text-muted-foreground">Resource not found.</p>
          <Button variant="outline" asChild>
            <Link to={backToCourseList.to} params={backToCourseList.params}>
              Back to course list
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  if (!canAccess) {
    return (
      <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {resource.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            This resource is part of Course 2 (Paid). Sign in with the paid login to unlock it.
          </p>
          <Button variant="outline" asChild>
            <Link to={backToCourseList.to} params={backToCourseList.params}>
              Back to course list
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const isVideo = resource.type === 'video';
  const isPdf = resource.type === 'pdf';
  const playbackJwt = muxTokenQuery.data?.token ?? null;

  const videoReadyPublic =
    isVideo && resource.muxPlaybackId && !resource.muxPlaybackSigned;
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
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" asChild>
              <Link to={backToCourseList.to} params={backToCourseList.params}>
                Back
              </Link>
            </Button>
          </div>
        </header>

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
                      queryKey: ['mux-playback-token', resourceId, tier],
                    })
                  }
                >
                  Retry
                </Button>
              </div>
            )}
            {videoReadySigned && playbackJwt && (
              <MuxPlayer
                className="aspect-video w-full"
                playbackId={resource.muxPlaybackId}
                tokens={{ playback: playbackJwt }}
                metadataVideoTitle={resource.title}
                {...(muxEnvKey ? { envKey: muxEnvKey } : {})}
                playsInline
                onError={() => {
                  void queryClient.invalidateQueries({
                    queryKey: ['mux-playback-token', resourceId, tier],
                  });
                }}
              />
            )}
          </div>
        )}

        {videoReadyPublic && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <MuxPlayer
              className="aspect-video w-full"
              playbackId={resource.muxPlaybackId}
              metadataVideoTitle={resource.title}
              {...(muxEnvKey ? { envKey: muxEnvKey } : {})}
              playsInline
            />
          </div>
        )}

        {!isPdf && !isVideo && (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            This detail page supports PDFs and Mux-hosted videos only.
          </div>
        )}

        {isPdf && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {(publicUrlQuery.isLoading || paidBlobQuery.isLoading) && (
              <div className="p-6 text-sm text-muted-foreground">Preparing your document…</div>
            )}
            {(publicUrlQuery.error || paidBlobQuery.error) && (
              <div className="p-6 text-sm text-destructive" role="alert">
                {publicUrlQuery.error instanceof Error
                  ? publicUrlQuery.error.message
                  : paidBlobQuery.error instanceof Error
                    ? paidBlobQuery.error.message
                    : 'Failed to load PDF'}
                <div className="mt-2 text-xs text-muted-foreground">
                  Tip: ensure <span className="font-mono">VITE_API_BASE_URL</span> points at your backend (usually{' '}
                  <span className="font-mono">http://127.0.0.1:8000/api/v1</span> when running{' '}
                  <span className="font-mono">npm run dev</span>).
                </div>
              </div>
            )}
            {publicObjectUrl && (
              <iframe title={resource.title} src={publicObjectUrl} className="h-[75vh] w-full" />
            )}
            {!publicObjectUrl && blobUrl && (
              <iframe title={resource.title} src={blobUrl} className="h-[75vh] w-full" />
            )}
            {!publicUrlQuery.isLoading &&
              !paidBlobQuery.isLoading &&
              !publicUrlQuery.error &&
              !paidBlobQuery.error &&
              !publicObjectUrl &&
              !blobUrl && (
                <div className="p-6 text-sm text-muted-foreground">No PDF content loaded yet.</div>
              )}
          </div>
        )}

        <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>
              <span className="font-medium text-foreground">Debug</span> — tier:{' '}
              <span className="font-mono">{tier}</span>
            </span>
            {isPdf && (
              <>
                <span>
                  pdf enabled:{' '}
                  <span className="font-mono">
                    {String(Boolean(canAccess && resource.bucket && resource.filePath))}
                  </span>
                </span>
                <span>
                  pdf status:{' '}
                  <span className="font-mono">
                    {publicUrlQuery.isLoading || paidBlobQuery.isLoading
                      ? 'loading'
                      : publicUrlQuery.error || paidBlobQuery.error
                        ? 'error'
                        : publicObjectUrl || blobUrl
                          ? 'ok'
                          : 'idle'}
                  </span>
                </span>
              </>
            )}
            {isVideo && (
              <>
                <span>
                  mux signed:{' '}
                  <span className="font-mono">{String(Boolean(resource.muxPlaybackSigned))}</span>
                </span>
                <span>
                  mux token:{' '}
                  <span className="font-mono">
                    {muxTokenQuery.isLoading ? 'loading' : muxTokenQuery.error ? 'error' : videoReadySigned ? 'ok' : 'n/a'}
                  </span>
                </span>
              </>
            )}
            {backendDownloadUrl && isPdf && (
              <a className="underline" href={backendDownloadUrl} target="_blank" rel="noreferrer">
                Open backend download directly
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
