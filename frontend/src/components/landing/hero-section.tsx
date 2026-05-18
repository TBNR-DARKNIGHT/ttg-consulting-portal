import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { publicStorageUrl } from '@/lib/public-assets';

const HERO_HEADER_IMAGE = publicStorageUrl('landing/hero_section_header.jpg');

export function HeroSection() {
  return (
    <section className="w-full overflow-x-clip bg-brand-cream">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-16 md:pt-24 pb-16 md:pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:items-start lg:gap-x-10 lg:gap-y-0 xl:gap-x-14">
          <div className="min-w-0">
            {HERO_HEADER_IMAGE ? (
              <div className="relative mb-6 w-full overflow-hidden rounded-lg shadow-[0_12px_40px_-28px_rgba(26,26,46,0.35)] ring-1 ring-brand-dark/10 lg:aspect-[2.1/1]">
                <img
                  src={HERO_HEADER_IMAGE}
                  alt="BeyondGrades"
                  className="block h-auto w-full lg:absolute lg:inset-0 lg:h-full lg:object-cover lg:object-center"
                  loading="eager"
                  decoding="async"
                  sizes="(max-width: 1023px) 100vw, min(540px, 50vw)"
                />
              </div>
            ) : (
              <p className="text-xs uppercase tracking-[0.22em] font-medium text-brand-dark/70 mb-5">
                beyondgrades · DSA consulting portal
              </p>
            )}

            <h1 className="font-serif text-brand-dark text-4xl md:text-[52px] lg:text-[56px] font-bold leading-[1.08] tracking-[-0.02em] max-w-xl lg:max-w-none">
              Your Child’s Voice.
              <br />
              Their Future.
            </h1>

            <p className="font-sans mt-5 text-xl md:text-2xl font-bold italic text-brand-dark max-w-xl lg:max-w-none">
              The DSA & Portfolio Blueprint
            </p>

            <p className="font-sans mt-6 text-brand-dark/80 max-w-[560px] text-base md:text-lg leading-relaxed mb-10 lg:max-w-[52ch]">
              We help students find their voice, build standout portfolios, and master
              the art of personal branding and interviews—from primary school to university and beyond.
            </p>

            <Button asChild size="lg" className="h-12 px-7">
              <Link to="/auth/sign-up">
                Get Started
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>

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

          <div className="relative min-w-0">
            <div className="mx-auto w-full max-w-[560px] lg:max-w-[420px] rounded-2xl border border-brand-grey bg-white shadow-[0_18px_50px_-35px_rgba(26,26,46,0.25)] overflow-hidden">
              <div className="flex items-center justify-center px-5 py-4 border-b border-brand-grey bg-brand-grey/20">
                <div className="text-center text-sm font-medium tracking-wide text-brand-dark/70 px-2">
                  Hear their aspirations. See their potential
                </div>
              </div>

              <div className="p-5 lg:p-4">
                <div className="mx-auto flex w-full justify-center">
                  <div className="relative mx-auto aspect-9/16 h-[420px] w-auto max-w-full overflow-hidden rounded-xl border border-brand-grey bg-brand-grey/30 shadow-sm sm:h-[460px] lg:h-[380px]">
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      src="https://www.youtube-nocookie.com/embed/o75xaFFw0vU?playsinline=1&rel=0&modestbranding=1&vq=hd1080"
                      title="BeyondGrades intro video"
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
