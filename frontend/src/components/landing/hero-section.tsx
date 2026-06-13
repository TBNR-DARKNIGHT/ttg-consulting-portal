import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { publicStorageUrl } from '@/lib/public-assets';

const HERO_HEADER_IMAGE = publicStorageUrl('landing/hero_section_header.jpg');

export function HeroSection() {
  return (
    <section className="w-full overflow-x-clip bg-brand-cream">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-4 pb-16 md:pt-24 md:pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-x-12">
          <div className="order-2 min-w-0 lg:order-1">
            <h1 className="font-serif text-brand-dark text-4xl md:text-[52px] lg:text-[56px] font-bold leading-[1.08] tracking-[-0.02em]">
              Your Child’s Voice.
              <br />
              Their Future.
            </h1>

            <p className="mt-5 text-brand-dark/80 max-w-[620px] text-base md:text-lg leading-relaxed">
              For parents who know that grades alone are no longer enough.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-7">
                <Link to="/portal">
                  Explore the Portal - Free to Join
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7">
                <Link to="/consult">
                  Book a Consulting Call
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-8 max-w-[620px] space-y-4 text-base leading-relaxed text-brand-dark/75 md:text-lg">
              <p>
                The world&apos;s most selective schools, scholarship panels, and employers share one
                open secret: your grades get you into the room, but your voice gets you the seat.
              </p>
              <p>
                Every year, brilliant students miss life-changing opportunities — not because they
                lacked ability, but because nobody taught them how to find their voice, build their
                narrative, or walk into a room with genuine confidence. Beyond Grades exists to change
                that.
              </p>
            </div>
          </div>

          <div className="order-1 min-w-0 lg:order-2">
            {HERO_HEADER_IMAGE ? (
              <div className="relative w-full overflow-hidden rounded-lg shadow-[0_12px_40px_-28px_rgba(26,26,46,0.35)] ring-1 ring-brand-dark/10 lg:aspect-[2.1/1]">
                <img
                  src={HERO_HEADER_IMAGE}
                  alt="Beyond Grades hero"
                  className="block h-auto w-full lg:absolute lg:inset-0 lg:h-full lg:object-cover lg:object-center"
                  loading="eager"
                  decoding="async"
                  sizes="(max-width: 1023px) 100vw, min(540px, 50vw)"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-brand-grey bg-white p-8 text-brand-dark/70">
                Hero image placeholder
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
