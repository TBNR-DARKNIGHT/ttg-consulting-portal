import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { publicStorageUrl } from '@/lib/public-assets';

const HERO_HEADER_IMAGE = publicStorageUrl('landing/hero_section_header.jpg');

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-brand-dark">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_65%_at_80%_50%,rgba(91,91,214,0.22),transparent_70%)]" />
      <div className="relative mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8a8f0]">
          Beyond Grades · Strategic Personal Branding
        </p>
        <div className="max-w-[760px]">
          <h1 className="font-serif text-4xl font-bold leading-[1.08] tracking-[-0.02em] text-white md:text-[64px]">
            Your Child&apos;s Voice.
            <br />
            <em className="font-normal text-[#a8a8f0]">Their Future.</em>
          </h1>
          <p className="mt-6 max-w-[600px] text-base font-light leading-[1.7] text-white/70 md:text-[17px]">
            For parents who know that grades alone are no longer enough. We help students find their
            voice, build standout portfolios, and master the art of personal branding.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-7">
              <Link to="/portal">
                Explore the DSA Portal - Free to Join
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/30 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/consult">
                Book a Consulting Call
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {HERO_HEADER_IMAGE ? (
            <img
              src={HERO_HEADER_IMAGE}
              alt="Beyond Grades"
              className="mt-10 block h-auto w-full max-w-[720px] rounded-xl border border-white/10"
              loading="eager"
              decoding="async"
            />
          ) : null}
          <div className="mt-8 max-w-[620px] space-y-3 text-sm leading-relaxed text-white/55 md:text-base">
            <p>
              Your grades get you into the room, but your voice gets you the seat. Beyond Grades
              helps students build their narrative and walk into the room with genuine confidence.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
