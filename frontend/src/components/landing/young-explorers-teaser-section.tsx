import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { publicStorageUrl } from '@/lib/public-assets';

const YOUNG_EXPLORERS_IMAGE = publicStorageUrl('landing/young_explorers.png');

export function YoungExplorersTeaserSection() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-18 md:py-22">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-brand-dark text-3xl md:text-[44px] font-bold tracking-[-0.02em] leading-[1.08]">
              Building Confident Communicators From the Start.
            </h2>
            <p className="mt-5 text-brand-dark/75 leading-relaxed text-base md:text-lg max-w-[650px]">
              Confidence in the interview room begins long before secondary school. For younger
              children in Primary 1 to 6, our Young Explorers Programme - delivered in partnership
              with MapleBear Student Care Eunos - introduces the foundations of public speaking,
              personal expression, and storytelling in a fun and age-appropriate setting.
            </p>
            <p className="mt-3 text-brand-dark/75 leading-relaxed text-base md:text-lg max-w-[650px]">
              Run successfully in Singapore and Shanghai, Young Explorers gives children an early
              start on the skills that will matter most when the stakes are higher.
            </p>
            <Button asChild className="mt-6 h-11 px-7">
              <Link to="/young-explorers">Learn More About Young Explorers</Link>
            </Button>
          </div>

          <div>
            {YOUNG_EXPLORERS_IMAGE ? (
              <img
                src={YOUNG_EXPLORERS_IMAGE}
                alt="Young Explorers programme"
                className="w-full rounded-lg border border-brand-grey object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="rounded-lg border border-brand-grey bg-brand-grey/20 p-10 text-center text-brand-dark/70">
                Young Explorers image placeholder
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
