import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="w-full bg-brand-cream">
      <div className="mx-auto max-w-[1200px] px-6 pt-16 md:pt-24 pb-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] font-medium text-brand-dark/70 mb-5">
              beyondgrades · DSA consulting portal
            </p>

            <h1 className="text-brand-dark text-4xl md:text-[56px] font-bold leading-[1.05] tracking-[-0.02em] max-w-xl mb-6">
              Your DSA Journey
              <br />
              Starts Here
            </h1>

            <p className="text-brand-dark/75 max-w-[560px] text-lg leading-relaxed mb-10">
              A guided portal for Singapore parents to navigate DSA pathways,
              build standout profiles, and prepare confidently for interviews.
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

          <div className="relative">
            <div className="mx-auto max-w-[560px] lg:max-w-[420px] rounded-2xl border border-brand-grey bg-white shadow-[0_18px_50px_-35px_rgba(26,26,46,0.25)] overflow-hidden">
              <div className="flex items-center justify-center px-5 py-4 border-b border-brand-grey bg-brand-grey/20">
                <div className="text-center text-xs font-medium uppercase tracking-[0.18em] text-brand-dark/60">
                  Watch a quick intro
                </div>
              </div>

              <div className="p-5 lg:p-4">
                <div className="mx-auto flex w-full justify-center">
                  <div className="relative aspect-9/16 h-[420px] sm:h-[460px] lg:h-[min(60vh,520px)] w-auto max-w-full overflow-hidden rounded-xl border border-brand-grey bg-brand-grey/30 shadow-sm">
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

                <div className="mt-4 text-xs text-brand-dark/60 text-center">
                  A quick look at how the portal supports your DSA journey
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
