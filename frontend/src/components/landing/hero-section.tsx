import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { publicStorageUrl } from '@/lib/public-assets';

const HERO_HEADER_IMAGE = publicStorageUrl('landing/hero_section_header.jpg');

export function HeroSection() {
  return (
    <section className="w-full overflow-x-clip bg-brand-cream">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-16 md:pt-24 pb-16 md:pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-x-12">
          <div>
            <h1 className="font-serif text-brand-dark text-4xl md:text-[52px] lg:text-[56px] font-bold leading-[1.08] tracking-[-0.02em]">
              Your Child’s Voice.
              <br />
              Their Future.
            </h1>

            <p className="mt-5 text-brand-dark/80 max-w-[620px] text-base md:text-lg leading-relaxed">
              For parents who know that grades alone are no longer enough.
            </p>

            <p className="mt-4 text-brand-dark/75 max-w-[620px] text-base md:text-lg leading-relaxed">
              The world&apos;s most selective schools, scholarship panels, and employers share one
              open secret: grades get students into the room, but voice gets them the seat.
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

            <div className="mt-4 text-sm text-brand-dark/70">
              Already have an account?{' '}
              <Link
                to="/auth/login"
                className="text-brand-indigo underline underline-offset-4 hover:opacity-80"
              >
                Log in
              </Link>
            </div>
          </div>

          <div className="min-w-0">
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
            <p className="mt-4 text-sm text-brand-dark/70 leading-relaxed">
              Every year, brilliant students miss life-changing opportunities not because they lack
              ability, but because nobody taught them how to build their narrative with confidence.
              Beyond Grades exists to change that.
            </p>
            <Button asChild variant="link" className="mt-2 p-0 text-brand-indigo h-auto">
              <Link to="/about">
                Read our full story
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
