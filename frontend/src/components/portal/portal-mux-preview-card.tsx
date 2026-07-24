import { useEffect, useState, type ReactNode } from 'react';
import { Play } from 'lucide-react';
import { MuxPublicPlayer } from '@/components/mux/mux-public-player';
import { muxThumbnailUrl } from '@/lib/mux';
import type { PortalPreview } from '@/lib/api';
import { cn } from '@/lib/utils';

const cardShellClassName = 'overflow-hidden rounded-[10px] border border-brand-dark/15 bg-white';

const videoFrameClassName = 'overflow-hidden bg-brand-grey/30';

export function PortalPreviewCardShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(cardShellClassName, className)}>
      <div>
        <div className={videoFrameClassName}>{children}</div>
      </div>
    </div>
  );
}

export interface PortalMuxPreviewCardProps {
  preview: PortalPreview;
  isOfflineDemo?: boolean;
  videoClassName?: string;
  className?: string;
}

export function PortalMuxPreviewCard({
  preview,
  isOfflineDemo,
  videoClassName,
  className,
}: PortalMuxPreviewCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const hasPlayback = Boolean(preview.muxPlaybackId);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isPlaying]);
  const videoAreaClassName = cn('h-[160px] w-full', videoClassName);

  if (!hasPlayback) {
    return (
      <PortalPreviewCardShell className={className}>
        <div
          className={cn(
            videoAreaClassName,
            'flex flex-col items-center justify-center bg-brand-grey/15 px-3 text-center text-sm text-brand-dark/60',
          )}
        >
          <p>{isOfflineDemo ? 'Preview unavailable in offline demo' : 'Preview coming soon'}</p>
        </div>
      </PortalPreviewCardShell>
    );
  }

  if (isPlaying) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-6"
        onClick={() => setIsPlaying(false)}
      >
        <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            aria-label="Close video"
            onClick={(event) => {
              event.stopPropagation();
              setIsPlaying(false);
            }}
            className="absolute right-2 top-2 z-10 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-brand-dark shadow-lg transition hover:bg-white"
          >
            ✕
          </button>
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-black shadow-2xl">
            <div className="mx-auto aspect-video w-full max-w-[900px]">
              <MuxPublicPlayer
                playbackId={preview.muxPlaybackId}
                title={preview.title}
                className="h-full w-full"
                initialExpanded
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const thumbnailUrl = muxThumbnailUrl(preview.muxPlaybackId);

  return (
    <PortalPreviewCardShell className={className}>
      <button
        type="button"
        className={cn(
          videoAreaClassName,
          'group relative block w-full overflow-hidden bg-brand-grey/20 text-left',
        )}
        onClick={() => setIsPlaying(true)}
        aria-label={`Play preview: ${preview.title}`}
      >
        <img
          src={thumbnailUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          loading="lazy"
          decoding="async"
        />
        <span className="absolute inset-0 bg-brand-dark/20 transition-colors group-hover:bg-brand-dark/30" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-brand-dark shadow-md md:size-14">
            <Play className="ml-1 size-7 fill-current md:size-6" aria-hidden />
          </span>
        </span>
      </button>
    </PortalPreviewCardShell>
  );
}

export function PortalPreviewCardSkeleton({ className }: { className?: string }) {
  return (
    <PortalPreviewCardShell className={className}>
      <div className="h-[160px] w-full animate-pulse bg-brand-grey/25" />
    </PortalPreviewCardShell>
  );
}

export function PortalPreviewCardPlaceholder({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <PortalPreviewCardShell className={className}>
      <div className="flex h-[160px] w-full items-center justify-center bg-brand-grey/15 px-3 text-center text-sm text-brand-dark/60">
        {message}
      </div>
    </PortalPreviewCardShell>
  );
}
