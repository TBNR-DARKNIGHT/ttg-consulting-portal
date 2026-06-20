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
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-brand-grey bg-white shadow-[0_18px_50px_-35px_rgba(26,26,46,0.25)]',
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
          <div className="relative mx-auto aspect-9/16 h-[420px] w-auto max-w-full overflow-hidden rounded-xl border border-brand-grey bg-brand-grey/30 shadow-sm sm:h-[460px] lg:h-[380px]">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&vq=hd1080`}
              title={title}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}
