import { Link } from '@tanstack/react-router';
import { FileText, MessageSquareText, Route, Target, UserRound } from 'lucide-react';
import { publicStorageUrl } from '@/lib/public-assets';

const HERO_IMAGE = publicStorageUrl('landing/executive_counsulting.jpg');
const SESSION_IMAGE = publicStorageUrl('landing/personalized_next_steps.jpg');
const CONTACT_EMAIL = 'mailto:beyondgrades@thinkteachacademy.com';

const areas = [
  [
    'Holistic Profile Understanding',
    "We look beyond grades to understand your child's genuine strengths, interests, and experiences.",
    UserRound,
  ],
  [
    'Identifying the Right Domain',
    "We determine which areas genuinely fit your child's profile and what specific schools look for.",
    Target,
  ],
  [
    'Portfolio Evaluation',
    'We identify what carries real weight with selection panels and share honest feedback on the gaps.',
    FileText,
  ],
  [
    'Interview Readiness Assessment',
    'We give your child an honest picture of where they stand and what they need to work on.',
    MessageSquareText,
  ],
  [
    'Personalised Next Steps',
    'Every session ends with a clear, realistic plan your family can act on immediately.',
    Route,
  ],
] as const;

export function ConsultUsSection() {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-dark">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_50%,rgba(91,91,214,0.18),transparent_70%)]" />
        <div className="relative mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8a8f0]">
            DSA Consulting
          </p>
          <h1 className="max-w-[760px] font-serif text-4xl font-bold leading-[1.12] text-white md:text-[56px]">
            Clarity on Your Child&apos;s DSA Journey.
            <br />
            <em className="font-normal text-[#a8a8f0]">In a Single Conversation.</em>
          </h1>
          <p className="mt-5 max-w-[620px] font-light leading-[1.7] text-white/65">
            Every child&apos;s profile is different. The right domain, the right schools, the right
            preparation focus. Our Initial Consultation gives you an honest, personalised assessment
            of where your child stands and what a realistic path forward looks like.
          </p>
          <div className="mt-8">
            <a
              href={CONTACT_EMAIL}
              className="rounded-[7px] bg-brand-indigo px-7 py-3.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Get in Touch to Discuss
            </a>
          </div>
          {HERO_IMAGE ? (
            <img
              src={HERO_IMAGE}
              alt="Beyond Grades consultation"
              className="mt-12 block h-auto w-full max-w-[720px] rounded-xl border border-white/10"
              loading="eager"
              decoding="async"
            />
          ) : null}
        </div>
      </section>

      <section className="border-b border-brand-dark/15 bg-brand-cream">
        <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">
            What to Expect
          </p>
          <h2 className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">
            One session.
            <br />
            <em className="font-normal text-brand-indigo">Five areas covered.</em>
          </h2>
          <div className="mt-12 grid items-start gap-10 md:grid-cols-2 md:gap-20">
            <div>
              <p className="leading-[1.7] text-brand-dark/70">
                A focused 1-on-1 session with a member of our team. We cover five areas in sequence,
                giving you a complete and honest picture of where your child stands and what their
                DSA journey should look like.
              </p>
              <a
                href={CONTACT_EMAIL}
                className="mt-6 inline-block rounded-[7px] bg-brand-indigo px-7 py-3.5 text-sm font-semibold text-white"
              >
                Book Your Consultation
              </a>
            </div>
            <div className="flex flex-col gap-6">
              {areas.map(([title, body, Icon]) => (
                <article key={title} className="flex gap-5">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#e8e8fa]">
                    <Icon className="size-[18px] text-brand-indigo" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-brand-dark">{title}</h3>
                    <p className="mt-1.5 text-sm leading-[1.6] text-brand-dark/70">{body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {SESSION_IMAGE ? (
        <div className="border-b border-brand-dark/15 bg-brand-cream px-5 py-12">
          <img
            src={SESSION_IMAGE}
            alt="Personalised next steps consultation"
            className="mx-auto block h-auto w-full max-w-[960px] rounded-xl"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}

      <section className="border-b border-brand-dark/15 bg-brand-grey">
        <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
          <div className="grid items-center gap-10 rounded-xl bg-brand-dark px-7 py-10 md:grid-cols-[1fr_auto] md:px-12 md:py-12">
            <div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8a8f0]">
                When Should You Book
              </p>
              <h2 className="text-3xl font-bold leading-[1.2] text-white md:text-[40px]">
                The earlier,
                <br />
                <em className="font-normal text-[#a8a8f0]">the better.</em>
              </h2>
              <p className="mt-4 max-w-[560px] text-sm leading-[1.7] text-white/55">
                The families who benefit most start the conversation early, giving their child time
                to build deliberately. If your child is in Primary 4 or above and DSA is on your
                radar, now is the right time.
              </p>
            </div>
            <div>
              <a
                href={CONTACT_EMAIL}
                className="inline-block rounded-[7px] bg-brand-indigo px-7 py-3.5 text-center text-sm font-semibold text-white"
              >
                Start the Conversation
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-brand-dark/15 bg-brand-cream">
        <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">
            Our Approach
          </p>
          <h2 className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">
            Not about gaming
            <br />
            <em className="font-normal text-brand-indigo">the system.</em>
          </h2>
          <div className="mt-12 grid items-start gap-10 md:grid-cols-2 md:gap-16">
            <div className="space-y-4 leading-[1.7] text-brand-dark/70">
              <p>
                DSA selection is designed to identify students who know themselves well—their
                interests, strengths, and reasons for pursuing a pathway. Our role is not to
                manufacture a profile, but to help your child present who they genuinely are.
              </p>
              <p>
                The students who do well are rarely the most polished. They are the most prepared to
                be themselves.
              </p>
            </div>
            <aside className="rounded-xl bg-[#e8e8fa] px-8 py-10">
              <blockquote className="font-serif text-xl italic leading-[1.55] text-brand-dark">
                “The students who get selected are not always the ones with the most impressive
                achievements. They are the ones who walk in knowing who they are and why they are
                there.”
              </blockquote>
              <cite className="mt-5 block text-xs not-italic text-brand-dark/50">
                — From the Beyond Grades founding team
              </cite>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-b border-brand-dark/15 bg-brand-grey text-center">
        <div className="mx-auto max-w-[720px] px-5 py-16 md:px-8 md:py-20">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">
            Begin With a Conversation
          </p>
          <h2 className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">
            One honest conversation can change how your family
            <br />
            <em className="font-normal text-brand-indigo">approaches the entire DSA journey.</em>
          </h2>
          <p className="mt-5 leading-[1.7] text-brand-dark/70">
            You will leave with a clear strategy, an honest assessment, and a concrete plan to act
            on.
          </p>
          <a
            href={CONTACT_EMAIL}
            className="mt-8 inline-block rounded-[7px] bg-brand-indigo px-7 py-3.5 text-sm font-semibold text-white"
          >
            Book Your Initial Consultation
          </a>
        </div>
      </section>

      <section className="bg-brand-cream">
        <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">
            Explore Our Other Offerings
          </p>
          <h2 className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">
            Looking for a<br />
            <em className="font-normal text-brand-indigo">different starting point?</em>
          </h2>
          <div className="mt-10 grid overflow-hidden rounded-xl border border-brand-dark/15 md:grid-cols-2">
            <article className="border-b border-brand-dark/15 bg-white px-8 py-8 md:border-b-0 md:border-r">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-indigo">
                Cohort-based
              </span>
              <h3 className="mt-3 text-lg font-bold text-brand-dark">DSA Interview Intensive</h3>
              <p className="mt-3 text-sm leading-[1.65] text-brand-dark/70">
                Small groups, real practice, and direct coaching from our team.
              </p>
              <Link
                to="/group-programme"
                className="mt-5 inline-block text-[13px] font-semibold text-brand-indigo"
              >
                Join the 2027 Waitlist →
              </Link>
            </article>
            <article className="bg-white px-8 py-8">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-indigo">
                Self-paced
              </span>
              <h3 className="mt-3 text-lg font-bold text-brand-dark">The Beyond Grades Portal</h3>
              <p className="mt-3 text-sm leading-[1.65] text-brand-dark/70">
                Free foundational frameworks and premium self-paced courses.
              </p>
              <Link
                to="/portal"
                className="mt-5 inline-block text-[13px] font-semibold text-brand-indigo"
              >
                Explore the Portal →
              </Link>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
