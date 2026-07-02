import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { publicStorageUrl } from '@/lib/public-assets';

const YOUNG_EXPLORERS_IMAGE = publicStorageUrl('landing/young_explorers.png');

export function YoungExplorersTeaserSection() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1200px] px-6 pb-18 pt-8 md:pb-22 md:pt-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-10">
          <h2 className="text-brand-dark text-3xl font-bold leading-[1.08] tracking-[-0.02em] md:text-[44px] lg:col-start-1 lg:row-start-1">
            Building Confident Communicators From The Start.
          </h2>

          <div className="flex min-w-0 justify-center self-stretch lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:items-center lg:justify-center">
            {YOUNG_EXPLORERS_IMAGE ? (
              <img
                src={YOUNG_EXPLORERS_IMAGE}
                alt="Young Explorers programme"
                className="mx-auto block w-full max-w-lg rounded-lg border border-brand-grey object-cover lg:max-w-xl"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="mx-auto w-full max-w-lg rounded-lg border border-brand-grey bg-brand-grey/20 p-10 text-center text-brand-dark/70 lg:max-w-xl">
                Young Explorers image placeholder
              </div>
            )}
          </div>

          <div className="max-w-[650px] lg:col-start-1 lg:row-start-2">
            <p className="text-base leading-relaxed text-brand-dark/75 md:text-lg">
              Confidence in the interview room begins long before secondary school. For younger
              children in Primary 1 to 6, our Young Explorers Programme - delivered in partnership
              with MapleBear Student Care Eunos - introduces the foundations of public speaking,
              personal expression, and storytelling in a fun and age-appropriate setting.
            </p>
            <p className="mt-3 text-base leading-relaxed text-brand-dark/75 md:text-lg">
              Run successfully in Singapore and Shanghai, Young Explorers gives children an early
              start on the skills that will matter most when the stakes are higher.
            </p>
            <Button asChild className="mt-6 h-11 px-7">
              <Link to="/young-explorers">Learn More About Young Explorers</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
