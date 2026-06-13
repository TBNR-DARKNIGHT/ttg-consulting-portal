import { Button } from '@/components/ui/button';
import { TTA_SHOP_URL } from '@/lib/tta-shop';

const PREVIEW_PLACEHOLDER_COUNT = 4;

export function PortalPremiumCourseSection() {
  return (
    <section className="mt-14 md:mt-16" aria-labelledby="portal-premium-course-heading">
      <h2
        id="portal-premium-course-heading"
        className="text-2xl font-semibold tracking-tight text-brand-dark md:text-3xl"
      >
        Ace Your DSA Interview — Our Most Complete Preparation Resource
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-brand-dark/80 md:text-lg">
        This is what proper preparation looks like. Watch a preview below and see exactly how our
        coaches break down the questions most students get wrong — and how your child can walk in
        ready to get them right.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: PREVIEW_PLACEHOLDER_COUNT }, (_, i) => (
          <div
            key={i}
            className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-brand-grey bg-brand-grey/15 px-3 text-center text-sm text-brand-dark/60"
          >
            Preview clip {i + 1}
            <span className="sr-only"> (embedded video coming soon)</span>
          </div>
        ))}
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
