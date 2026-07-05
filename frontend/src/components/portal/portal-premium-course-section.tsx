import { Button } from '@/components/ui/button';
import {
  PortalMuxPreviewCard,
  PortalPreviewCardPlaceholder,
  PortalPreviewCardSkeleton,
} from '@/components/portal/portal-mux-preview-card';
import { usePortalCoursePreviews } from '@/hooks/use-portal-course-previews';
import { TTA_SHOP_URL } from '@/lib/tta-shop';

const PREVIEW_SLOT_COUNT = 3;
const PARENT_OVERVIEW_GUIDE_URL =
  'https://ikyirsacgxlyovmxskij.supabase.co/storage/v1/object/public/public-assets/resources/Course%20Overview%20Parents.pdf';

export function PortalPremiumCourseSection() {
  const { previews, isLoading, error, refetch, isOfflineDemo } = usePortalCoursePreviews();
  const slots = isLoading
    ? Array.from({ length: PREVIEW_SLOT_COUNT }, (_, i) => ({ kind: 'loading' as const, key: `loading-${i}` }))
    : error
      ? Array.from({ length: PREVIEW_SLOT_COUNT }, (_, i) => ({ kind: 'error' as const, key: `error-${i}` }))
      : previews.length > 0
        ? previews.slice(0, PREVIEW_SLOT_COUNT).map((preview) => ({ kind: 'preview' as const, key: preview.id, preview }))
        : Array.from({ length: PREVIEW_SLOT_COUNT }, (_, i) => ({ kind: 'empty' as const, key: `empty-${i}` }));

  return (
    <section className="border-b border-brand-dark/15 bg-brand-cream" aria-labelledby="portal-premium-course-heading">
      <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">Premium Course</p>
        <div className="grid items-start gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <h2 id="portal-premium-course-heading" className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">
              Ace Your DSA Interview — <em className="font-normal text-brand-indigo">Our Most Complete Preparation Resource</em>
            </h2>
            <p className="mt-4 text-[15px] leading-[1.7] text-brand-dark/70">
              This is what proper preparation looks like. Watch a preview and see how our coaches
              break down the questions most students get wrong.
            </p>
            <p className="mt-4 text-[15px] leading-[1.7] text-brand-dark/70">
              Four modules taking your child from research to interview close, paired with companion
              worksheets and a dedicated Parent Overview Guide.
            </p>
            <a href={PARENT_OVERVIEW_GUIDE_URL} download="Course Overview Parents.pdf" className="mt-5 inline-flex text-[13px] font-semibold text-brand-dark/60 hover:text-brand-indigo">
              ← Download the Parent Overview Guide
            </a>
            <a href={TTA_SHOP_URL} target="_blank" rel="noopener noreferrer" className="mt-7 block w-fit rounded-[7px] bg-brand-indigo px-7 py-3.5 text-sm font-semibold text-white hover:opacity-90">
              Unlock the Full Course
            </a>
          </div>
          <div>
            {error ? (
              <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
                <p>{error instanceof Error ? error.message : 'Failed to load preview clips'}</p>
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Retry</Button>
              </div>
            ) : null}
            <div className="grid gap-3">
              {slots.map((slot) => {
                if (slot.kind === 'loading') return <PortalPreviewCardSkeleton key={slot.key} />;
                if (slot.kind === 'error') return <PortalPreviewCardPlaceholder key={slot.key} message="Preview unavailable" />;
                if (slot.kind === 'empty') return <PortalPreviewCardPlaceholder key={slot.key} message="Preview coming soon" />;
                return <PortalMuxPreviewCard key={slot.key} preview={slot.preview} isOfflineDemo={isOfflineDemo} />;
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
