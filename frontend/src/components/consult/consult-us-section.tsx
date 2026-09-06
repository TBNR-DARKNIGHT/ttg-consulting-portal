import { useState, type FormEvent } from 'react';
import {
  CalendarDays,
  FileText,
  GraduationCap,
  MessageSquareText,
  Route,
  Star,
  Target,
  UserRound,
} from 'lucide-react';
import { submitConsultationEnquiry } from '@/lib/api';

const HERO_IMAGE = '/images/consultation/education-consulting-hero.jpeg';
const CONSULTATION_IMAGE = '/images/consultation/dsa-consultation.jpeg';

const areas = [
  {
    title: 'Holistic Profile Understanding',
    body: "We look beyond grades to understand your child's genuine strengths, interests, and experiences.",
    Icon: UserRound,
  },
  {
    title: 'Identifying the Right Domain',
    body: "We determine which areas genuinely fit your child's profile and what specific schools look for.",
    Icon: Target,
  },
  {
    title: 'Portfolio Evaluation',
    body: 'We identify what carries real weight with selection panels and share honest feedback on the gaps.',
    Icon: FileText,
  },
  {
    title: 'Interview Readiness Assessment',
    body: 'We give your child an honest picture of where they stand and what they need to work on.',
    Icon: MessageSquareText,
  },
  {
    title: 'Personalised Next Steps',
    body: 'Every session ends with a clear, realistic plan your family can act on immediately.',
    Icon: Route,
  },
] as const;

const pillars = [
  {
    title: 'Profile Building and Portfolio Strategy',
    body: 'Evidence mapping, project planning, and guidance on competitions, research projects, internships and community initiatives — so every experience contributes to a compelling application story.',
    Icon: Star,
  },
  {
    title: 'Subject Choice, CCA and Work Experience Planning',
    body: 'Helping students make coherent academic and extracurricular decisions that build toward a compelling university application narrative rather than leaving it to chance.',
    Icon: GraduationCap,
  },
  {
    title: 'Early Academic Roadmap Planning',
    body: 'University course pathways, academic prerequisites, contingency planning, and long-term milestone planning — so students are working toward clear, realistic goals rather than reacting too late.',
    Icon: CalendarDays,
  },
] as const;

const levels = [
  ['P4', 'Primary 4'],
  ['P5', 'Primary 5'],
  ['P6', 'Primary 6'],
  ['Sec1', 'Secondary 1'],
  ['Sec2', 'Secondary 2'],
  ['Sec3', 'Secondary 3'],
  ['Sec4', 'Secondary 4'],
  ['JC1', 'Junior College 1'],
  ['JC2', 'Junior College 2'],
  ['Poly', 'Polytechnic'],
  ['NS', 'National Service'],
] as const;

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export function ConsultUsSection() {
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setFormStatus('submitting');

    try {
      const fields = Object.fromEntries(new FormData(form).entries());
      await submitConsultationEnquiry({
        parentName: String(fields.parent_name ?? ''),
        contactNumber: String(fields.contact ?? ''),
        childSchool: String(fields.child_school ?? ''),
        childLevel: String(fields.child_level ?? ''),
        programme: String(fields.programme ?? '') as 'dsa' | 'basecamp' | 'both',
        notes: String(fields.notes ?? ''),
        website: String(fields.website ?? ''),
      });

      form.reset();
      setFormStatus('success');
    } catch {
      setFormStatus('error');
    }
  }

  const fieldClassName =
    'w-full rounded-lg border border-white/15 bg-white/[0.07] px-4 py-3.5 text-[15px] text-white outline-none transition placeholder:text-white/30 focus:border-brand-indigo/80 focus:bg-white/10';

  return (
    <>
      <section className="relative overflow-hidden bg-brand-dark">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_85%_45%,rgba(91,91,214,0.2),transparent_65%)]" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-16 md:px-8 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8a8f0]">
              Education Consulting
            </p>
            <h1 className="max-w-[700px] font-serif text-4xl font-bold leading-[1.1] tracking-[-0.02em] text-white md:text-[54px]">
              Clarity on Your Child&apos;s Education Journey.
              <br />
              <em className="font-normal text-[#a8a8f0]">In a Single Conversation.</em>
            </h1>
            <p className="mt-5 max-w-[600px] font-light leading-[1.7] text-white/65">
              Every child&apos;s profile is different. Whether your child is preparing for DSA or
              planning ahead for university, our team provides an honest, personalised assessment of
              where they stand and what the path forward looks like.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <a
                href="#dsa"
                className="rounded-[10px] border border-brand-indigo/50 bg-brand-indigo/10 px-6 py-4 transition hover:border-white/30 hover:bg-white/10"
              >
                <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a8a8f0]">
                  Primary 4 to 6
                </span>
                <span className="mt-1 block font-serif text-[17px] font-bold text-white">
                  DSA Consultation
                </span>
                <span className="mt-1 block text-xs text-white/50">
                  Direct School Admission preparation
                </span>
              </a>
              <a
                href="#basecamp"
                className="rounded-[10px] border border-[#c9a84c]/50 bg-[#c9a84c]/10 px-6 py-4 transition hover:border-white/30 hover:bg-white/10"
              >
                <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#d4b96e]">
                  Secondary to JC
                </span>
                <span className="mt-1 block font-serif text-[17px] font-bold text-white">
                  Base Camp
                </span>
                <span className="mt-1 block text-xs text-white/50">
                  University pathway and portfolio planning
                </span>
              </a>
            </div>
          </div>

          <img
            src={HERO_IMAGE}
            alt="A Beyond Grades consultant meeting with a student and parent"
            className="h-auto w-full rounded-xl border border-white/10 object-contain shadow-2xl shadow-black/20"
            loading="eager"
            decoding="async"
          />
        </div>
      </section>

      <section
        id="dsa"
        className="scroll-mt-16 border-b border-brand-dark/15 bg-brand-grey"
        aria-labelledby="dsa-consultation-heading"
      >
        <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
          <p className="mb-5 inline-flex rounded-full bg-[#e8e8fa] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-indigo">
            DSA Consultation · Primary 4 to 6
          </p>
          <h2
            id="dsa-consultation-heading"
            className="text-3xl font-bold leading-[1.15] tracking-[-0.02em] text-brand-dark md:text-[42px]"
          >
            One session.
            <br />
            Five areas covered.
          </h2>
          <p className="mt-4 max-w-[650px] text-lg font-medium leading-[1.6] text-brand-dark">
            A focused 1-on-1 session with a member of our team. We cover five areas in sequence,
            giving you a complete and honest picture of where your child stands and what their DSA
            journey should look like.
          </p>

          <div className="mt-10 grid items-start gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <div className="space-y-5 text-[15px] leading-[1.75] text-brand-dark/70">
                <p>
                  Every child&apos;s profile is different. The right domain, the right schools, the
                  right preparation focus. Our Initial Consultation gives you an honest,
                  personalised assessment of where your child stands and what a realistic path
                  forward looks like.
                </p>
                <p>
                  The families who benefit most start the conversation early, giving their child
                  time to build deliberately. If your child is in Primary 4 or above and DSA is on
                  your radar, now is the right time.
                </p>
              </div>
              <img
                src={CONSULTATION_IMAGE}
                alt="A Beyond Grades consultant speaking with a student during a one-to-one session"
                className="mt-8 aspect-[4/3] w-full rounded-xl object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-brand-dark/15">
              {areas.map(({ title, body, Icon }) => (
                <article
                  key={title}
                  className="flex gap-4 border-b border-brand-dark/15 bg-white px-6 py-5 last:border-b-0"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#e8e8fa]">
                    <Icon className="size-4 text-brand-indigo" aria-hidden />
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

      <section
        id="basecamp"
        className="scroll-mt-16 border-b border-brand-dark/15 bg-brand-cream"
        aria-labelledby="basecamp-heading"
      >
        <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
          <p className="mb-5 inline-flex rounded-full bg-[#f7f0dc] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8b6914]">
            Base Camp · Secondary to JC
          </p>
          <h2
            id="basecamp-heading"
            className="text-3xl font-bold leading-[1.15] tracking-[-0.02em] text-brand-dark md:text-[42px]"
          >
            Plan early.
            <br />
            Build a profile that
            <br />
            <em className="font-normal text-[#c9a84c]">opens every door.</em>
          </h2>
          <p className="mt-4 max-w-[720px] text-lg font-medium leading-[1.6] text-brand-dark">
            For Secondary to JC students who are serious about competitive university admissions —
            in Singapore, the UK, the US, or beyond. The decisions your child makes now about
            subjects, CCAs, and experiences will shape their options years later.
          </p>

          <div className="mt-10 grid items-start gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <div className="space-y-5 text-[15px] leading-[1.75] text-brand-dark/70">
                <p>
                  Many capable students work hard in school but lack a clear long-term strategy for
                  building a profile that stands out when applying for competitive university
                  programmes. Base Camp is a structured, expert-guided programme that helps students
                  build a coherent profile from early secondary school, so that by the time
                  applications open, every experience has a purpose and every achievement tells a
                  story.
                </p>
                <p>
                  The entry point is a free 60-minute consultation. We map your child&apos;s current
                  profile, identify the gaps, and give you a concrete direction, whether or not you
                  continue with us beyond that session.
                </p>
              </div>

              <aside className="mt-8 rounded-xl bg-brand-grey px-7 py-7">
                <h3 className="text-[13px] font-semibold tracking-wide text-brand-dark">
                  This is for
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    'Secondary 1–4',
                    'Junior College',
                    'Polytechnic',
                    'National Service',
                    'International School',
                  ].map((audience) => (
                    <span
                      key={audience}
                      className="rounded-full border border-[#c9a84c]/30 bg-[#f7f0dc] px-3.5 py-1 text-xs font-medium text-[#7a5c0a]"
                    >
                      {audience}
                    </span>
                  ))}
                </div>
              </aside>
            </div>

            <div className="space-y-4">
              {pillars.map(({ title, body, Icon }) => (
                <article
                  key={title}
                  className="flex gap-4 rounded-xl border border-brand-dark/15 bg-white px-7 py-7"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f7f0dc]">
                    <Icon className="size-4 text-[#8b6914]" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-brand-dark">{title}</h3>
                    <p className="mt-1.5 text-[13px] leading-[1.6] text-brand-dark/70">{body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-brand-dark/15 bg-brand-grey">
        <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">
            Our Approach
          </p>
          <h2 className="text-3xl font-bold leading-[1.15] tracking-[-0.02em] text-brand-dark md:text-[42px]">
            Not about manufacturing a profile.
            <br />
            About finding
            <br />
            <em className="font-normal text-brand-indigo">who your child already is.</em>
          </h2>

          <div className="mt-12 grid items-start gap-10 md:grid-cols-2 md:gap-16">
            <div className="space-y-4 text-[15px] leading-[1.8] text-brand-dark/70">
              <p>
                Whether your child is preparing for a DSA interview or building toward a competitive
                university application, the fundamental work is the same — developing the
                self-awareness and clarity to present who they genuinely are with confidence.
              </p>
              <p>
                We do not tell students what to do to look good on paper. We help them understand
                what they have already done, why it matters, and how to articulate it in a way that
                resonates with the people making decisions about their future.
              </p>
              <p>
                The students who succeed in competitive admissions are rarely the most polished.
                They are the most prepared to be themselves.
              </p>
            </div>
            <aside className="rounded-xl border border-brand-dark/15 bg-white px-8 py-10">
              <blockquote className="font-serif text-xl italic leading-[1.55] text-brand-dark">
                &ldquo;Your grades get you into the room. Your voice gets you the seat.&rdquo;
              </blockquote>
              <cite className="mt-5 block text-[13px] not-italic text-brand-dark/55">
                — The Beyond Grades founding conviction
              </cite>
            </aside>
          </div>
        </div>
      </section>

      <section id="enquiry" className="scroll-mt-16 bg-brand-dark">
        <div className="mx-auto max-w-[720px] px-5 py-16 md:px-8 md:py-20">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8a8f0]">
            Get in Touch
          </p>
          <h2 className="text-3xl font-bold leading-[1.15] text-white md:text-[42px]">
            Tell us about
            <br />
            <em className="font-normal text-[#a8a8f0]">your child.</em>
          </h2>
          <p className="mt-4 max-w-[620px] text-lg font-medium leading-[1.6] text-white/60">
            Fill in the form below and our team will be in touch to arrange a conversation. No
            obligation, no pressure.
          </p>

          <form className="mt-10 space-y-5" onSubmit={submitEnquiry}>
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Parent Name" htmlFor="parent-name">
                <input
                  className={fieldClassName}
                  type="text"
                  id="parent-name"
                  name="parent_name"
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                />
              </FormField>
              <FormField label="Contact Number" htmlFor="contact">
                <input
                  className={fieldClassName}
                  type="tel"
                  id="contact"
                  name="contact"
                  placeholder="+65 XXXX XXXX"
                  autoComplete="tel"
                  required
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Child's Current School" htmlFor="child-school">
                <input
                  className={fieldClassName}
                  type="text"
                  id="child-school"
                  name="child_school"
                  placeholder="e.g. Raffles Girls' Primary"
                  required
                />
              </FormField>
              <FormField label="Child's Current Level" htmlFor="child-level">
                <select
                  className={fieldClassName}
                  id="child-level"
                  name="child_level"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Select level
                  </option>
                  {levels.map(([value, label]) => (
                    <option key={value} value={value} className="bg-brand-dark">
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Area of Interest" htmlFor="programme">
              <select
                className={fieldClassName}
                id="programme"
                name="programme"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Select programme
                </option>
                <option value="dsa" className="bg-brand-dark">
                  DSA Consultation, Primary 4 to 6
                </option>
                <option value="basecamp" className="bg-brand-dark">
                  Base Camp, Secondary to JC
                </option>
                <option value="both" className="bg-brand-dark">
                  Both — not sure yet
                </option>
              </select>
            </FormField>

            <FormField label="Additional Notes" htmlFor="notes">
              <textarea
                className={`${fieldClassName} min-h-28 resize-y`}
                id="notes"
                name="notes"
                placeholder="Share anything else you'd like us to know before we reach out — your child's interests, specific concerns, or what you're hoping to achieve."
              />
            </FormField>

            <p className="text-[13px] leading-[1.5] text-white/40">
              Our team will respond within one business day to arrange a conversation at a time that
              suits you.
            </p>

            <button
              type="submit"
              disabled={formStatus === 'submitting' || formStatus === 'success'}
              className="rounded-lg bg-brand-indigo px-8 py-4 text-[15px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {formStatus === 'submitting'
                ? 'Submitting…'
                : formStatus === 'success'
                  ? 'Submitted. We will be in touch shortly.'
                  : 'Submit Enquiry →'}
            </button>

            <div aria-live="polite">
              {formStatus === 'success' ? (
                <p className="text-sm font-medium text-emerald-300">
                  Thank you. Your enquiry has been sent to the Beyond Grades team.
                </p>
              ) : null}
              {formStatus === 'error' ? (
                <p className="text-sm font-medium text-red-300">
                  We could not send your enquiry. Please try again or email{' '}
                  <a
                    className="underline underline-offset-2"
                    href="mailto:beyondgrades@thinkteachacademy.com"
                  >
                    beyondgrades@thinkteachacademy.com
                  </a>
                  .
                </p>
              ) : null}
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold uppercase tracking-[0.04em] text-white/55"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
