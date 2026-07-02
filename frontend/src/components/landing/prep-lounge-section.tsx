import { Link } from '@tanstack/react-router';
import { CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { publicStorageUrl } from '@/lib/public-assets';

const PREP_LOUNGE_IMAGE = publicStorageUrl('landing/prep_lounge_image.jpg');

const bullets = [
  {
    title: 'Strategic Masterclasses',
    body: 'Expert-led video modules from our team of global graduates.',
  },
  {
    title: 'The Portfolio Blueprint',
    body: 'Downloadable frameworks to synthesize talents and achievements.',
  },
  {
    title: 'Direct Access',
    body: 'A dedicated space for live Q&A and real-time community insights.',
  },
  {
    title: 'Executive Consulting',
    body: 'Tailored 1-on-1 strategy sessions for a personalized competitive edge.',
  },
] as const;

export function PrepLoungeSection() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-18 md:py-22">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0">
            {PREP_LOUNGE_IMAGE ? (
              <div className="relative mb-6 w-full overflow-hidden rounded-lg shadow-[0_12px_40px_-28px_rgba(26,26,46,0.35)] ring-1 ring-brand-dark/10 lg:aspect-[2.1/1]">
                <img
                  src={PREP_LOUNGE_IMAGE}
                  alt="DSA and portfolio prep workspace"
                  className="block h-auto w-full lg:absolute lg:inset-0 lg:h-full lg:object-cover lg:object-center"
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 1023px) 100vw, min(540px, 50vw)"
                />
              </div>
            ) : null}

            <h2 className="text-brand-dark text-4xl md:text-[52px] font-bold leading-[1.05] tracking-[-0.02em] mb-6">
              The Comprehensive DSA &amp; Portfolio Ecosystem
            </h2>

            <ul className="grid gap-3 mb-7">
              {bullets.map((item) => (
                <li key={item.title} className="flex gap-3 items-start">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-sage shrink-0" />
                  <span className="text-brand-dark/80">
                    <span className="font-semibold text-brand-dark">{item.title}:</span>{' '}
                    {item.body}
                  </span>
                </li>
              ))}
            </ul>

            <p className="text-brand-dark/75 leading-relaxed max-w-[640px] mb-7">
              We’ve distilled years of elite mentorship into a structured, high-yield workspace.
              Designed for parents who value strategy over guesswork, our portal provides the
              tools to ensure your child navigates the pathway with absolute confidence.
            </p>

            <Button asChild size="lg" className="h-12 rounded-full px-7">
              <Link to="/auth/sign-up">Start your journey for free</Link>
            </Button>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-linear-to-tr from-brand-indigo/0 via-brand-indigo/10 to-brand-indigo/0 blur-2xl" />

            <div className="mx-auto max-w-[560px]">
              <div className="relative">
                <div className="absolute inset-0 -z-10 translate-y-3 rounded-2xl bg-white/40 ring-1 ring-brand-grey/60" />

                <div className="rounded-2xl border border-brand-grey bg-white shadow-[0_20px_60px_-30px_rgba(26,26,46,0.25)]">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-brand-grey">
                    <div>
                      <div className="text-xs text-brand-dark/60">Dashboard</div>
                      <div className="text-sm font-semibold text-brand-dark">Content Library</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-brand-grey" />
                      <span className="h-2 w-2 rounded-full bg-brand-grey" />
                      <span className="h-2 w-2 rounded-full bg-brand-grey" />
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between rounded-xl border border-brand-grey bg-brand-grey/30 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-indigo/10 text-brand-indigo">
                            <PlayCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-brand-dark">Course 1</div>
                            <div className="text-xs text-brand-dark/60">DSA Foundations</div>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-brand-dark/65">In progress</span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-brand-grey bg-white px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-grey/60 text-brand-dark/70">
                            <Lock className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-brand-dark">Course 2</div>
                            <div className="text-xs text-brand-dark/60">Interview Prep (Locked)</div>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-brand-dark/55">Locked</span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-brand-grey bg-white px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-indigo/10 text-brand-indigo">
                            <PlayCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-brand-dark">Module checklist</div>
                            <div className="text-xs text-brand-dark/60">
                              Profile, portfolio, questions
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-brand-dark/65">Updated</span>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-brand-grey bg-white px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-brand-dark">Overall progress</div>
                        <div className="text-sm font-semibold text-brand-dark">42%</div>
                      </div>
                      <Progress
                        value={42}
                        className="mt-3 h-2.5 bg-brand-grey **:data-[slot='progress-indicator']:bg-brand-indigo"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-brand-dark/55 text-center">
                Preview of your dashboard after you sign up
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

