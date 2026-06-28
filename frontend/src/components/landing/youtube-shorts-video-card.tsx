import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type YoutubeShortsVideoCardProps = {
  videoId: string;
  title: string;
  headerText?: string;
  className?: string;
};

export function YoutubeShortsVideoCard({
  videoId,
  title,
  headerText,
  className,
}: YoutubeShortsVideoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);
  const iframeBaseSrc = `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&vq=hd1080`;

  return (
    <>
      <div
        className={cn(
          'mx-auto w-full max-w-[640px] overflow-hidden rounded-2xl border border-brand-grey bg-white shadow-[0_18px_50px_-35px_rgba(26,26,46,0.25)]',
          className,
        )}
      >
        {headerText ? (
          <div className="flex items-center justify-center border-b border-brand-grey bg-brand-grey/20 px-5 py-4">
            <div className="px-2 text-center text-sm font-medium tracking-wide text-brand-dark/70">
              {headerText}
            </div>
          </div>
        ) : null}

        <div className="p-5 lg:p-4">
          <div className="mx-auto flex w-full justify-center">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsExpanded(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setIsExpanded(true);
                }
              }}
              className="relative mx-auto h-[430px] w-full max-w-[320px] cursor-pointer overflow-hidden rounded-xl border border-brand-grey bg-brand-grey/30 shadow-sm transition-transform duration-200 hover:scale-[1.01] sm:h-[500px] sm:max-w-[360px] lg:h-[480px] lg:max-w-[380px]"
            >
              <button
                type="button"
                aria-label={`Expand ${title}`}
                onClick={() => setIsExpanded(true)}
                className="absolute inset-0 z-10 h-full w-full bg-transparent"
              />
              <iframe
                className="absolute inset-0 z-0 h-full w-full"
                src={iframeBaseSrc}
                title={title}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-center bg-gradient-to-t from-black/55 to-transparent px-4 py-4 text-sm font-medium text-white">
                Click to expand
              </div>
            </div>
          </div>
        </div>
      </div>

      {isExpanded ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              aria-label="Close video"
              onClick={() => setIsExpanded(false)}
              className="absolute right-2 top-2 z-10 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-brand-dark shadow-lg transition hover:bg-white"
            >
              ✕
            </button>
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-black shadow-2xl">
              <div className="mx-auto h-[78vh] max-h-[900px] w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[520px]">
                <iframe
                  className="h-full w-full"
                  src={`${iframeBaseSrc}&autoplay=1`}
                  title={title}
                  loading="eager"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
