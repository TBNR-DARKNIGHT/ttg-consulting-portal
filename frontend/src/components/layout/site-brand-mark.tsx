import { publicStorageUrl } from '@/lib/public-assets';

const SITE_LOGO_URL = publicStorageUrl('BG_Logo');

type SiteBrandMarkProps = {
  /** Tailwind box size (image is contained inside; fallback circle matches). */
  sizeClass?: string;
  /** When false, render the logo without the rounded icon frame (e.g. navbar wordmark). */
  framed?: boolean;
};

/** Logo from Supabase `public-assets/BG_Logo`, or the indigo “bg” mark when the URL is unavailable. */
export function SiteBrandMark({ sizeClass = 'size-9', framed = true }: SiteBrandMarkProps) {
  if (SITE_LOGO_URL) {
    if (!framed) {
      return (
        <img
          src={SITE_LOGO_URL}
          alt="Beyond Grades"
          className={`shrink-0 object-contain group-hover:opacity-80 transition-opacity ${sizeClass}`}
          decoding="async"
          height={64}
        />
      );
    }

    return (
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-brand-grey/20 ${sizeClass}`}
      >
        <img
          src={SITE_LOGO_URL}
          alt="Beyond Grades"
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
