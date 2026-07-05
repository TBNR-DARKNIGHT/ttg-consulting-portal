import { createFileRoute, Link } from '@tanstack/react-router';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { publicStorageUrl } from '@/lib/public-assets';

const HEADER_IMAGE = publicStorageUrl('group-prog/header.jpg');
const SESSION_IMAGE = publicStorageUrl('group-prog/sub_header.jpg');
const WAITLIST_EMAIL = 'mailto:beyondgrades@thinkteachacademy.com';

const sessions = [
  ['01', 'How DSA Interviews Actually Work', 'Understand what selection panels assess, how interviews are structured, and what strong candidates do differently.'],
  ['02', 'Structuring Answers That Land', 'Build answers with substance and clarity without sounding scripted or rehearsed.'],
  ['03', 'Thinking Under Pressure', 'Learn practical tools for handling unexpected questions and recovering composure.'],
  ['04', 'Guided Mock Interview Practice', 'Apply every skill in realistic practice with direct, specific coaching from our team.'],
] as const;

const outcomes = [
  'A clear understanding of what interviewers are genuinely assessing.',
  'Practised answers that reflect who they are rather than rehearsed scripts.',
  'The composure to hold a real conversation under pressure.',
  'Specific feedback on where to sharpen before the application window opens.',
] as const;

export const Route = createFileRoute('/group-programme')({ component: GroupProgrammePage });

function GroupProgrammePage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-brand-dark">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_50%,rgba(91,91,214,0.18),transparent_70%)]" />
          <div className="relative mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8a8f0]">DSA Interview Intensive</p>
            <h1 className="max-w-[780px] font-serif text-4xl font-bold leading-[1.12] text-white md:text-[56px]">
              The DSA Interview Programme That Helps Students Walk Into Selection Rooms
              <br /><em className="font-normal text-[#a8a8f0]">With Confidence.</em>
            </h1>
            <p className="mt-5 max-w-[620px] font-light leading-[1.7] text-white/65">Two successful runs. A focused half-day format. Real coaching from mentors who have navigated competitive admissions across global institutions. Registration for the next cycle opens early 2027.</p>
            <a href={WAITLIST_EMAIL} className="mt-8 inline-block rounded-[7px] bg-brand-indigo px-7 py-3.5 text-sm font-semibold text-white hover:opacity-90">Join the 2027 Waitlist</a>
            {HEADER_IMAGE ? <img src={HEADER_IMAGE} alt="DSA Interview Intensive participants" className="mt-12 block h-auto w-full max-w-[720px] rounded-xl border border-white/10" loading="eager" decoding="async" /> : null}
          </div>
        </section>

        <section className="border-b border-brand-dark/15 bg-brand-grey">
          <div className="mx-auto max-w-[960px] px-5 py-12 md:px-8">
            <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">Programme Details</p>
            <div className="grid overflow-hidden rounded-xl border border-brand-dark/15 bg-white sm:grid-cols-3">
              {[['Format', 'Small group interactive workshop'], ['Duration', '4 hours, including a short break'], ['Programme cycle', 'April and May annually']].map(([label, value]) => <div key={label} className="border-b border-brand-dark/15 px-7 py-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-indigo">{label}</p><p className="mt-2 text-sm text-brand-dark/70">{value}</p></div>)}
            </div>
          </div>
        </section>

        <section className="border-b border-brand-dark/15 bg-brand-cream">
          <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">What the Programme Covers</p>
            <h2 className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">Four sessions.<br /><em className="font-normal text-brand-indigo">One complete preparation.</em></h2>
            <div className="mt-12 grid overflow-hidden rounded-xl border border-brand-dark/15 md:grid-cols-2">
              {sessions.map(([number, title, body]) => <article key={number} className="border-b border-brand-dark/15 bg-white px-8 py-8 odd:md:border-r [&:nth-child(3)]:md:border-b-0 [&:nth-child(4)]:border-b-0"><p className="font-serif text-3xl font-bold text-[#e8e8fa]">{number}</p><h3 className="mt-2 text-lg font-bold text-brand-dark">{title}</h3><p className="mt-2 text-sm leading-[1.65] text-brand-dark/70">{body}</p></article>)}
            </div>
          </div>
        </section>

        {SESSION_IMAGE ? <div className="border-b border-brand-dark/15 bg-brand-cream px-5 py-12"><img src={SESSION_IMAGE} alt="Students practising DSA interviews" className="mx-auto block h-auto w-full max-w-[960px] rounded-xl" loading="lazy" decoding="async" /></div> : null}

        <section className="border-b border-brand-dark/15 bg-brand-grey">
          <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">What Your Child Leaves With</p>
            <h2 className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">Not just prepared.<br /><em className="font-normal text-brand-indigo">Genuinely ready.</em></h2>
            <div className="mt-10 grid gap-2 sm:grid-cols-2">{outcomes.map((outcome) => <div key={outcome} className="flex gap-4 bg-white px-6 py-5 text-sm leading-[1.6] text-brand-dark/70"><span className="text-brand-indigo">✓</span>{outcome}</div>)}</div>
          </div>
        </section>

        <section className="bg-brand-dark">
          <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8a8f0]">Reserve Your Child&apos;s Place</p>
            <h2 className="text-3xl font-bold leading-[1.2] text-white md:text-[40px]">The 2026 intake is now closed.<br /><em className="font-normal text-[#a8a8f0]">Join the 2027 waitlist.</em></h2>
            <p className="mt-5 max-w-[640px] leading-[1.7] text-white/55">Places are kept small deliberately so every student receives individual coaching and meaningful practice time.</p>
            <div className="mt-8"><a href={WAITLIST_EMAIL} className="inline-block rounded-[7px] bg-brand-indigo px-7 py-3.5 text-sm font-semibold text-white">Join the 2027 Waitlist</a></div>
          </div>
        </section>

        <section className="bg-brand-cream"><div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20"><p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">Explore Our Other Offerings</p><h2 className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">Not quite the right fit?<br /><em className="font-normal text-brand-indigo">We have other pathways.</em></h2><div className="mt-10 grid overflow-hidden rounded-xl border border-brand-dark/15 md:grid-cols-2">{[['The Beyond Grades Portal', 'Free resources and self-paced premium courses.', '/portal'], ['DSA Consulting', 'A personalised strategy built around your child’s profile.', '/consult']].map(([title, body, to]) => <article key={title} className="border-b border-brand-dark/15 bg-white px-8 py-8 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"><h3 className="text-lg font-bold text-brand-dark">{title}</h3><p className="mt-3 text-sm text-brand-dark/70">{body}</p><Link to={to} className="mt-5 inline-block text-[13px] font-semibold text-brand-indigo">Learn more →</Link></article>)}</div></div></section>
      </main>
      <Footer />
    </div>
  );
}
