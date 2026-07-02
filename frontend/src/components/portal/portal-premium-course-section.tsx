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

        ? previews.slice(0, PREVIEW_SLOT_COUNT).map((preview) => ({

            kind: 'preview' as const,

            key: preview.id,

            preview,

          }))

        : Array.from({ length: PREVIEW_SLOT_COUNT }, (_, i) => ({

            kind: 'empty' as const,

            key: `empty-${i}`,

          }));



  return (

    <section className="mt-14 md:mt-16" aria-labelledby="portal-premium-course-heading">

      <h2

        id="portal-premium-course-heading"

        className="text-2xl font-semibold tracking-tight text-brand-dark md:text-3xl"

      >

        Premium Course: Ace Your DSA Interview

      </h2>

      <p className="mt-4 max-w-3xl text-base leading-relaxed text-brand-dark/80 md:text-lg">

        This is what proper preparation looks like. Watch a preview below and see exactly how our

        coaches break down the questions most students get wrong — and how your child can walk in

        ready to get them right.

      </p>



      {error ? (

        <div

          className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"

          role="alert"

        >

          <p>{error instanceof Error ? error.message : 'Failed to load preview clips'}</p>

          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>

            Retry

          </Button>

        </div>

      ) : null}



      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">

        {slots.map((slot) => {

          if (slot.kind === 'loading') {

            return <PortalPreviewCardSkeleton key={slot.key} />;

          }

          if (slot.kind === 'error') {

            return <PortalPreviewCardPlaceholder key={slot.key} message="Preview unavailable" />;

          }

          if (slot.kind === 'empty') {

            return <PortalPreviewCardPlaceholder key={slot.key} message="Preview coming soon" />;

          }

          return (

            <PortalMuxPreviewCard

              key={slot.key}

              preview={slot.preview}

              isOfflineDemo={isOfflineDemo}

            />

          );

        })}

      </div>

      <p className="mt-8 max-w-3xl text-base leading-relaxed text-brand-dark/80 md:text-lg">
        Want to know exactly what your child will learn? Download our Parent Overview Guide — a
        complete walkthrough of the four modules, how the course works, and how you can support your
        child through it.
      </p>

      <div className="mt-6">
        <Button asChild size="lg" variant="outline">
          <a href={PARENT_OVERVIEW_GUIDE_URL} download="Course Overview Parents.pdf">
            Download the Parent Overview Guide
          </a>
        </Button>
      </div>



      <p className="mt-8 max-w-3xl text-base leading-relaxed text-brand-dark/80 md:text-lg">

        Like what you see? The full course covers four modules taking your child from research to

        interview close, with companion worksheets and a dedicated Parent Overview Guide.

      </p>



      <div className="mt-6">

        <Button asChild size="lg">

          <a href={TTA_SHOP_URL} target="_blank" rel="noopener noreferrer">

            Unlock the Full Course

          </a>

        </Button>

      </div>

    </section>

  );

}


