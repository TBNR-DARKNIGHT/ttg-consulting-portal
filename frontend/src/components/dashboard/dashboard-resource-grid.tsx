import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { FileUp, ImageOff, LockKeyhole, Pencil, Play } from 'lucide-react';
import { toast } from 'sonner';
import { usePortalAuth } from '@/auth/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResourceLoadingState } from '@/components/dashboard/resource-loading-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useResources } from '@/hooks/use-resources';
import { getCourseIdForTopic } from '@/lib/courses';
import { useEntitlements } from '@/hooks/use-entitlements';
import {
  deleteAdminResource,
  getMuxThumbnailToken,
  getPdfThumbnailUrl,
  replaceAdminDocument,
  updateAdminResource,
} from '@/lib/api';
import { muxSignedThumbnailUrl, muxThumbnailUrl } from '@/lib/mux';
import { publicBucketStorageUrl } from '@/lib/public-assets';
import { TTA_SHOP_URL } from '@/lib/tta-shop';
import type { ContentTopic, Resource, ResourceType } from '@/types';

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function resourceTypeLabel(type: ResourceType) {
  return type === 'pdf' ? 'PDF' : titleCase(type);
}

function AdaptiveResourceTitle({ children }: { children: ReactNode }) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const title = titleRef.current;
    const cardContent = title?.closest<HTMLElement>('[data-resource-card-content]');
    if (!title || !cardContent) return;

    const updateTitleLines = () => {
      const lineHeight = Number.parseFloat(window.getComputedStyle(title).lineHeight);
      cardContent.dataset.titleLines =
        Number.isFinite(lineHeight) && title.getBoundingClientRect().height > lineHeight * 1.5
          ? 'two'
          : 'one';
    };

    updateTitleLines();
    const observer = new ResizeObserver(updateTitleLines);
    observer.observe(title);
    return () => observer.disconnect();
  }, [children]);

  return (
    <h2 ref={titleRef} className="min-w-0 font-semibold leading-snug text-foreground">
      {children}
    </h2>
  );
}

function ResourceVideoThumbnail({
  resource,
  locked,
}: {
  resource: Resource;
  locked: boolean;
}) {
  const { getToken } = usePortalAuth();
  const [imageFailed, setImageFailed] = useState(false);
  const signed = Boolean(resource.muxPlaybackId && resource.muxPlaybackSigned);
  const tokenQuery = useQuery({
    queryKey: ['mux-thumbnail-token', resource.id],
    queryFn: () => getMuxThumbnailToken(resource.id, getToken),
    enabled: signed && !locked && !resource.thumbnailUrl,
    staleTime: 50 * 60 * 1000,
  });

  const thumbnailUrl =
    !locked && (resource.thumbnailUrl ??
    (resource.muxPlaybackId && !resource.muxPlaybackSigned
      ? muxThumbnailUrl(resource.muxPlaybackId, { width: 720 })
      : resource.muxPlaybackId && tokenQuery.data?.token
        ? muxSignedThumbnailUrl(resource.muxPlaybackId, tokenQuery.data.token)
        : undefined));
  const loading = signed && !locked && tokenQuery.isLoading;

  return (
    <div className="group relative aspect-video overflow-hidden bg-muted">
      {thumbnailUrl && !imageFailed ? (
        <>
          <img
            src={thumbnailUrl}
            alt={`Preview for ${resource.title}`}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
          <span className="absolute inset-0 bg-brand-dark/10" aria-hidden />
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <span className="flex size-11 items-center justify-center rounded-full bg-white/90 text-brand-dark shadow-sm">
              <Play className="ml-0.5 size-5 fill-current" />
            </span>
          </span>
        </>
      ) : loading ? (
        <div className="h-full w-full animate-pulse bg-muted" aria-label="Loading video preview" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageOff className="size-6" aria-hidden />
          <span className="text-xs">
            {locked ? 'Preview locked' : 'Preview unavailable'}
          </span>
        </div>
      )}
    </div>
  );
}

function ResourcePdfThumbnail({ resource, locked }: { resource: Resource; locked: boolean }) {
  const { getToken } = usePortalAuth();
  const [imageFailed, setImageFailed] = useState(false);
  const publicThumbnailUrl =
    resource.access !== 'paid' && resource.bucket && resource.filePath
      ? publicBucketStorageUrl(
          resource.bucket,
          resource.filePath.replace(/([^/]+)\.pdf$/i, '$1_thumbnail.jpg'),
        )
      : '';
  const thumbnailQuery = useQuery({
    queryKey: ['pdf-thumbnail-url', resource.id],
    queryFn: () => getPdfThumbnailUrl(resource.id, getToken),
    enabled: !locked && !resource.thumbnailUrl && !publicThumbnailUrl,
    staleTime: 10 * 60 * 1000,
  });
  const thumbnailUrl =
    resource.thumbnailUrl ?? (publicThumbnailUrl || thumbnailQuery.data?.url);

  return (
    <div className="group relative aspect-video overflow-hidden bg-muted">
      {thumbnailUrl && !imageFailed ? (
        <img
          src={thumbnailUrl}
          alt={`Preview for ${resource.title}`}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : thumbnailQuery.isLoading && !locked ? (
        <div className="h-full w-full animate-pulse bg-muted" aria-label="Loading PDF preview" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageOff className="size-6" aria-hidden />
          <span className="text-xs">{locked ? 'Preview locked' : 'Preview unavailable'}</span>
        </div>
      )}
    </div>
  );
}

function AdminResourceEditButton({ resource }: { resource: Resource }) {
  const { getToken } = usePortalAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(resource.title);
  const [topic, setTopic] = useState(resource.topic);
  const [description, setDescription] = useState(resource.description);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [replacementProgress, setReplacementProgress] = useState(0);
  const updateMutation = useMutation({
    mutationFn: () =>
      updateAdminResource(
        resource.id,
        { title: title.trim(), topic: topic.trim(), description: description.trim() },
        getToken,
      ),
    onSuccess: async () => {
      const updatedMetadata = {
        title: title.trim(),
        topic: topic.trim(),
        description: description.trim(),
      };
      queryClient.setQueriesData<Resource[]>(
        { queryKey: ['resources'] },
        (resources) =>
          resources?.map((item) =>
            item.id === resource.id ? { ...item, ...updatedMetadata } : item,
          ),
      );
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource updated');
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to update resource');
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminResource(resource.id, getToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource deleted');
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to delete resource');
    },
  });
  const replaceMutation = useMutation({
    mutationFn: (file: File) =>
      replaceAdminDocument(resource.id, file, getToken, setReplacementProgress),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pdf-thumbnail-url', resource.id] });
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('PDF replaced');
      setReplacementProgress(0);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to replace PDF');
      setReplacementProgress(0);
    },
  });

  const startEditing = () => {
    setTitle(resource.title);
    setTopic(resource.topic);
    setDescription(resource.description);
    setConfirmingDelete(false);
    setOpen(true);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !topic.trim()) return;
    updateMutation.mutate();
  };

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="absolute right-3 top-3 z-20 size-8 border border-border bg-background text-foreground opacity-0 shadow-md transition-opacity hover:bg-background group-hover/card:opacity-100 group-focus-within/card:opacity-100"
        aria-label={`Edit ${resource.title}`}
        onClick={startEditing}
      >
        <Pencil className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {confirmingDelete ? (
            <div className="space-y-5">
              <DialogHeader>
                <DialogTitle>Delete Resource?</DialogTitle>
                <DialogDescription>
                  This permanently deletes “{resource.title}” and its uploaded file. This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={deleteMutation.isPending}
                  onClick={() => setConfirmingDelete(false)}
                >
                  Keep resource
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete permanently'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
          <form className="space-y-4" onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
                Update the details shown to students or replace the PDF without changing them.
            </DialogDescription>
            {resource.type === 'pdf' && (
              <div className="rounded-md border border-border p-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (!file) return;
                    if (file.type && file.type !== 'application/pdf') {
                      toast.error('Choose a PDF file');
                      return;
                    }
                    replaceMutation.mutate(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={replaceMutation.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="mr-2 size-4" />
                  {replaceMutation.isPending
                    ? `Replacing PDF… ${replacementProgress}%`
                    : 'Replace PDF file'}
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Keeps the current title, topic, and description.
                </p>
              </div>
            )}
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor={`resource-title-${resource.id}`}>Title</Label>
              <Input
                id={`resource-title-${resource.id}`}
                value={title}
                maxLength={300}
                required
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`resource-topic-${resource.id}`}>Topic</Label>
              <Input
                id={`resource-topic-${resource.id}`}
                value={topic}
                maxLength={100}
                required
                onChange={(event) => setTopic(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`resource-description-${resource.id}`}>Description</Label>
              <Textarea
                id={`resource-description-${resource.id}`}
                rows={5}
                value={description}
                maxLength={2000}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="destructive"
                className="sm:mr-auto"
                disabled={updateMutation.isPending}
                onClick={() => setConfirmingDelete(true)}
              >
                Delete
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !title.trim() || !topic.trim()}>
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export interface DashboardResourceGridProps {
  courseId: string;
  topics: readonly ContentTopic[];
  resourceTypes: readonly ResourceType[];
  /** undefined = all modules, null = course-level content only, string = one module */
  moduleId?: string | null;
}

export function DashboardResourceGrid({
  courseId,
  topics,
  resourceTypes,
  moduleId,
}: DashboardResourceGridProps) {
  const { resources, isLoading: resourcesLoading, error: resourcesError } = useResources();
  const { hasCourseAccess, isLoading: entitlementsLoading } = useEntitlements();
  const currentUser = useCurrentUser();
  const isAdmin = currentUser.data?.role === 'ADMIN';

  const topicSet = useMemo(() => new Set(topics), [topics]);
  const typeSet = useMemo(() => new Set(resourceTypes), [resourceTypes]);
  const resourceOrigin: 'overview' | 'resources' | 'videos' =
    resourceTypes.length === 1 && resourceTypes[0] === 'pdf'
      ? 'resources'
      : resourceTypes.length === 1 && resourceTypes[0] === 'video'
        ? 'videos'
        : 'overview';

  const filtered = useMemo(
    () =>
      resources
        .filter(
          (r) =>
            (r.courseId === courseId || (!r.courseId && topicSet.has(r.topic))) &&
            typeSet.has(r.type) &&
            (moduleId === undefined ||
              (moduleId === null ? !r.moduleId : r.moduleId === moduleId)),
        )
        .sort((a, b) => {
          const typeOrder: Partial<Record<ResourceType, number>> = { pdf: 0, video: 1 };
          const typeDifference = (typeOrder[a.type] ?? 2) - (typeOrder[b.type] ?? 2);
          const topicDifference = a.topic.localeCompare(b.topic, undefined, {
            sensitivity: 'base',
          });
          return (
            typeDifference ||
            topicDifference ||
            a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
          );
        }),
    [resources, courseId, topicSet, typeSet, moduleId],
  );

  const loading = resourcesLoading || entitlementsLoading;
  const error = resourcesError;

  if (loading) {
    return <ResourceLoadingState />;
  }

  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error instanceof Error ? error.message : 'Something went wrong'}
      </p>
    );
  }

  if (filtered.length === 0) {
    return <p className="text-sm text-muted-foreground">No content has been added here yet.</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {filtered.map((resource) => {
        const topicLabel = resource.topic;
        const typeLabel = resourceTypeLabel(resource.type);
        const courseId = resource.courseId ?? getCourseIdForTopic(resource.topic);
        const locked = !hasCourseAccess(courseId);
        const resourceLink = {
          to: '/dashboard/resources/$resourceId' as const,
          params: { resourceId: resource.id },
          search: {
            from: resourceOrigin,
            courseId,
            ...(typeof moduleId === 'string' ? { module: moduleId } : {}),
          },
        };
        const thumbnail =
          resource.type === 'video' ? (
            <ResourceVideoThumbnail resource={resource} locked={locked} />
          ) : resource.type === 'pdf' ? (
            <ResourcePdfThumbnail resource={resource} locked={locked} />
          ) : (
            <div className="aspect-video bg-muted/20" aria-hidden />
          );
        return (
          <li
            key={resource.id}
            className="group/card relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            {isAdmin && <AdminResourceEditButton resource={resource} />}
            {locked ? (
              <a
                href={TTA_SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                aria-label={`Purchase access to ${resource.title}`}
              >
                {thumbnail}
              </a>
            ) : (
              <Link
                {...resourceLink}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                aria-label={`Open ${resource.title}`}
              >
                {thumbnail}
              </Link>
            )}
            <div
              data-resource-card-content
              data-title-lines="one"
              className="group/content flex h-64 flex-none flex-col gap-2 overflow-hidden border-t border-border p-5"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                {locked ? (
                  <AdaptiveResourceTitle>
                    <a
                      href={TTA_SHOP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="line-clamp-2 rounded-sm [overflow-wrap:anywhere] hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Purchase access to ${resource.title}`}
                    >
                      {resource.title}
                    </a>
                  </AdaptiveResourceTitle>
                ) : (
                  <AdaptiveResourceTitle>
                    <Link
                      {...resourceLink}
                      className="line-clamp-2 rounded-sm [overflow-wrap:anywhere] hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {resource.title}
                    </Link>
                  </AdaptiveResourceTitle>
                )}
                <div className="flex shrink-0 items-center gap-2">
                  {locked && (
                    <LockKeyhole
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-label="Locked"
                    />
                  )}
                </div>
              </div>
              {resource.type === 'video' ? (
                <p className="break-words text-xs text-primary [overflow-wrap:anywhere]">
                  {topicLabel}
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="break-words text-xs text-primary [overflow-wrap:anywhere]">
                    {topicLabel}
                  </span>
                </div>
              )}
              <div className="min-h-0 flex-1 overflow-hidden">
                <p className="line-clamp-6 text-sm text-muted-foreground group-data-[title-lines=two]/content:line-clamp-5">
                  {resource.description}
                </p>
              </div>
              {resource.duration && (
                <div className="shrink-0 text-xs text-muted-foreground">{resource.duration}</div>
              )}
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="shrink-0">
                  {typeLabel}
                </Badge>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
