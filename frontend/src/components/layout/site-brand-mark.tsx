import { publicStorageUrl } from '@/lib/public-assets';

const SITE_LOGO_URL = publicStorageUrl('logo.jpg');

type SiteBrandMarkProps = {
  /** Tailwind box size (image is contained inside; fallback circle matches). */
  sizeClass?: string;
};

/** Logo from Supabase `public-assets/logo.jpg`, or the indigo “bg” mark when the URL is unavailable. */
export function SiteBrandMark({ sizeClass = 'size-9' }: SiteBrandMarkProps) {
  if (SITE_LOGO_URL) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-brand-grey/20 ${sizeClass}`}
      >
        <img
          src={SITE_LOGO_URL}
          alt=""
          className="max-h-full max-w-full object-contain p-0.5"
          decoding="async"
          width={36}
          height={36}
        />
      </span>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-indigo text-sm font-semibold tracking-tight text-white ${sizeClass}`}
    >
      bg
    </div>
  );
}
