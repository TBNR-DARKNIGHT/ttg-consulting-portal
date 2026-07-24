import { createFileRoute, Link } from '@tanstack/react-router';
import {
  CalendarDays,
  Clock3,
  Globe2,
  Mic2,
  PenLine,
  Presentation,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { YoutubeShortsVideoCard } from '@/components/landing/youtube-shorts-video-card';
import { publicStorageUrl } from '@/lib/public-assets';

const PROGRAMME_IMAGE = publicStorageUrl('landing/young_explorers_prog.jpg');

const programmeDetails = [
  [
    'Year-long Programme',
    '12 modules across the full academic year, each lasting three to four weeks.',
    CalendarDays,
  ],
  [
    'Weekly Sessions',
    'One core hour per week, with an optional enrichment hour for extended practice and personalised feedback.',
    Clock3,
  ],
  [
    'Primary 1 to 6',
    'Content is adapted to each age group so every child is appropriately challenged.',
    Users,
  ],
  [
    'End-of-Module Showcase',
    "Every module closes with a presentation or creative project so parents can see their child's progress.",
    Presentation,
  ],
] as const;

const skills = [
  ['Voice and Presence', 'Voice projection, eye contact, and purposeful body language.', Mic2],
  [
    'Storytelling Structure',
    "The ability to organise ideas clearly and hold an audience's attention.",
    PenLine,
  ],
  [
    'Audience Confidence',
    'The confidence to speak in front of classmates, parents, and panels.',
    Users,
  ],
  [
    'Creative Thinking',
    'Teamwork, listening skills, and the ability to think on their feet.',
    Globe2,
  ],
  ['Personal Communication Style', 'An authentic voice that is genuinely their own.', Star],
] as const;

export const Route = createFileRoute('/young-explorers')({ component: YoungExplorersPage });

function YoungExplorersPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-brand-dark">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_50%,rgba(91,91,214,0.18),transparent_70%)]" />
          <div className="relative mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
              A Beyond Grades Programme · In Partnership with MapleBear Student Care
            </p>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8a8f0]">
              Young Explorers Programme
            </p>
            <h1 className="max-w-[700px] font-serif text-4xl font-bold leading-[1.12] tracking-[-0.02em] text-white md:text-[52px]">
              The Foundation of Every Confident Communicator Is Built{' '}
              <em className="font-normal text-[#a8a8f0]">Early.</em>
            </h1>
            <p className="mt-5 max-w-[520px] font-light leading-[1.7] text-white/65">
              Young Explorers is a public speaking and personal expression programme for Primary 1
              to Primary 6 children, designed to build confidence, storytelling ability, and
              self-expression in a joyful environment.
            </p>
            <a
              href="https://www.mjceunos.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded-[7px] bg-brand-indigo px-7 py-3.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Enquire with MapleBear
            </a>
            {PROGRAMME_IMAGE ? (
              <img
                src={PROGRAMME_IMAGE}
                alt="Young Explorers programme"
                className="mt-12 block h-auto w-full max-w-[560px] rounded-xl border border-white/10"
                loading="eager"
                decoding="async"
              />
            ) : null}
          </div>
        </section>

        <section className="border-b border-brand-dark/15 bg-brand-grey">
          <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">
              How Young Explorers Works
            </p>
            <h2 className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">
              Twelve modules.
              <br />
              <em className="font-normal text-brand-indigo">One full year of growth.</em>
            </h2>
            <div className="mt-12 grid items-start gap-10 md:grid-cols-2 md:gap-16">
              <div className="space-y-4 text-[15px] leading-[1.75] text-brand-dark/70">
                <p>
                  The programme runs across a full academic year in 12 engaging modules, each
                  lasting three to four weeks. Students practise, present, and receive feedback
                  progressively.
                </p>
                <p>
                  Every module builds toward a showcase where students demonstrate what they have
                  learned. Parents get a tangible view of their child&apos;s growth at every stage.
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border border-brand-dark/15">
                {programmeDetails.map(([title, body, Icon]) => (
                  <article
                    key={title}
                    className="flex gap-4 border-b border-brand-dark/15 bg-white px-7 py-6 last:border-b-0"
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#e8e8fa]">
                      <Icon className="size-4 text-brand-indigo" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-brand-dark">{title}</h3>
                      <p className="mt-1 text-[13px] leading-[1.6] text-brand-dark/70">{body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-brand-dark/15 bg-brand-cream">
          <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">
              See It In Action
            </p>
            <h2 className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">
              What a Young Explorers
              <br />
              <em className="font-normal text-brand-indigo">session looks like.</em>
            </h2>
            <p className="mb-12 mt-5 max-w-[640px] leading-[1.7] text-brand-dark/70">
              Watch how our facilitators guide students through storytelling, debate, and
              presentation activities designed to build genuine confidence.
            </p>
            <YoutubeShortsVideoCard
              videoId="sXO7Fp9rcNc"
              title="Young Explorers programme highlight"
              className="!max-w-none border-white/10 bg-brand-dark"
            />
          </div>
        </section>

        <section className="border-b border-brand-dark/15 bg-brand-grey">
          <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">
              What Your Child Builds Over the Year
            </p>
            <h2 className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">
              Skills that compound
              <br />
              <em className="font-normal text-brand-indigo">long before secondary school.</em>
            </h2>
            <p className="mb-12 mt-5 max-w-[640px] leading-[1.7] text-brand-dark/70">
              Every module is designed around real communication skills—not performance or polish,
              but the genuine ability to think clearly and speak confidently.
            </p>
            <div className="grid overflow-hidden rounded-xl border border-brand-dark/15 sm:grid-cols-2 lg:grid-cols-3">
              {skills.map(([title, body, Icon], index) => (
                <article
                  key={title}
                  className="border-b border-brand-dark/15 bg-white px-7 py-8 sm:border-r sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0"
                >
                  <div className="grid size-10 place-items-center rounded-lg bg-[#e8e8fa]">
                    <Icon className="size-[18px] text-brand-indigo" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-brand-dark">{title}</h3>
                  <p className="mt-2 text-[13px] leading-[1.6] text-brand-dark/70">{body}</p>
                  {index === skills.length - 1 ? (
                    <Sparkles className="mt-4 size-4 text-brand-indigo/40" aria-hidden />
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="enrol"
          className="scroll-mt-16 border-b border-white/10 bg-brand-dark text-center"
        >
          <div className="mx-auto max-w-[560px] px-5 py-16 md:px-8 md:py-20">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8a8f0]">
              How to Enrol
            </p>
            <h2 className="text-3xl font-bold leading-[1.2] text-white md:text-[40px]">
              Young Explorers runs at
              <br />
              <em className="font-normal text-[#a8a8f0]">MapleBear Student Care.</em>
            </h2>
            <p className="mt-4 leading-[1.7] text-white/60">
              Reach out to the centre directly for programme availability and next steps. Our team
              is happy to answer any questions before you commit.
            </p>
            <p className="mt-3 text-[13px] text-white/35">
              Currently available at MapleBear Student Care (Eunos). Additional centres to be
              confirmed.
            </p>
            <a
              href="https://www.mjceunos.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded-[7px] bg-brand-indigo px-7 py-3.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Enquire with MapleBear
            </a>
          </div>
        </section>

        <section className="bg-brand-grey">
          <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">
              As Your Child Grows
            </p>
            <h2 className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">
              Beyond Grades is here
              <br />
              <em className="font-normal text-brand-indigo">at every stage.</em>
            </h2>
            <div className="mt-12 grid overflow-hidden rounded-xl border border-brand-dark/15 md:grid-cols-3">
              {[
                [
                  'Self-paced',
                  'The Beyond Grades Portal',
                  'Free foundational resources and premium self-paced courses.',
                  '/portal',
                ],
                [
                  'Cohort-based',
                  'DSA Interview Intensive',
                  'A focused group programme for students preparing for the DSA window.',
                  '/group-programme',
                ],
                [
                  '1-on-1',
                  'DSA Consulting',
                  "A personalised consultation covering your child's profile and readiness.",
                  '/consult',
                ],
              ].map(([badge, title, body, to]) => (
                <article
                  key={title}
                  className="flex flex-col border-b border-brand-dark/15 bg-white px-7 py-8 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
                >
                  <span className="w-fit rounded bg-[#e8e8fa] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-indigo">
                    {badge}
                  </span>
                  <h3 className="mt-3 text-[17px] font-bold text-brand-dark">{title}</h3>
                  <p className="mt-3 flex-1 text-[13px] leading-[1.6] text-brand-dark/70">{body}</p>
                  <Link to={to} className="mt-5 text-[13px] font-semibold text-brand-indigo">
                    Learn more →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
