import { Link } from '@tanstack/react-router';
import { MessageSquareText } from 'lucide-react';
import { TTA_WEBSITE_URL } from '@/lib/tta-shop';

const TTA_CONTACT_URL = 'https://thinkteachacademy.com/contact-us/';

export function PortalCommunitySection() {
  return (
    <section className="border-b border-white/10 bg-brand-dark">
      <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8a8f0]">Coming Soon</p>
        <h2 className="text-3xl font-bold leading-[1.2] text-white md:text-[40px]">Community and<br /><em className="font-normal text-[#a8a8f0]">Live Q and A</em></h2>
        <p className="mb-12 mt-5 max-w-[640px] leading-[1.7] text-white/55">A dedicated space for questions, shared experiences, and live sessions with the Beyond Grades team.</p>
        <div className="flex items-start gap-6 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-8 md:px-10 md:py-12">
          <div className="grid size-12 shrink-0 place-items-center rounded-[10px] bg-brand-indigo/20"><MessageSquareText className="size-[22px] text-[#a8a8f0]" /></div>
          <div><span className="rounded bg-brand-indigo/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a8a8f0]">Coming Soon</span><h3 className="mt-3 text-xl font-bold text-white">Community and Live Q and A</h3><p className="mt-2 text-sm leading-[1.65] text-white/50">A dedicated space where you can put your questions directly to the Beyond Grades team.</p></div>
        </div>
      </div>
    </section>
  );
}

const steps = [
  ['01', 'Open the dashboard', 'Get immediate access to the seminar clips, Opportunities Directory, guides, and course materials.'],
  ['02', 'Work through resources', 'Build a clear picture of where your child stands and what they need to develop next.'],
  ['03', 'Continue into the full course', 'Use the DSA interview modules, worksheets, and examples without a checkout step.'],
  ['04', 'Sign in only when useful', 'Create or use an account later for saved progress, account tools, and future paid courses.'],
] as const;

export function PortalHowItWorksSection() {
  return (
    <section className="border-b border-brand-dark/15 bg-brand-grey"><div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">How It Works</p>
      <h2 className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">Start immediately.<br /><em className="font-normal text-brand-indigo">Sign in only when it helps.</em></h2>
      <div className="mt-12 grid overflow-hidden rounded-xl border border-brand-dark/15 md:grid-cols-4">
        {steps.map(([number, title, body]) => <article key={number} className="border-b border-brand-dark/15 bg-white px-6 py-8 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"><p className="font-serif text-[32px] font-bold leading-none text-[#e8e8fa]">{number}</p><h3 className="mt-3 text-[13px] font-semibold text-brand-dark">{title}</h3><p className="mt-2 text-xs leading-[1.55] text-brand-dark/65">{body}</p></article>)}
      </div>
    </div></section>
  );
}

export function PortalBeginTodaySection() {
  return <section className="border-b border-brand-dark/15 bg-brand-cream text-center"><div className="mx-auto max-w-[560px] px-5 py-16 md:px-8 md:py-20"><p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">Begin Today</p><h2 className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">The dashboard is open.<br /><em className="font-normal text-brand-indigo">The frameworks are ready.</em></h2><p className="mt-4 leading-[1.7] text-brand-dark/70">Start exploring the resources and courses today.</p><Link to="/dashboard" className="mt-8 inline-block rounded-[7px] bg-brand-indigo px-7 py-3.5 text-sm font-semibold text-white hover:opacity-90">Open the Dashboard</Link></div></section>;
}

export function PortalTtaMembersSection() {
  return <section className="bg-[#e8e8fa] text-center"><div className="mx-auto max-w-[720px] px-5 py-16 md:px-8 md:py-20"><p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">For Think Teach Academy Families</p><h2 className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">Already a TTA family?<br /><em className="font-normal text-brand-indigo">You can start now.</em></h2><p className="mt-3 leading-[1.7] text-brand-dark/70">The current courses are open. Contact client services only if you need help with account access or programme support.</p><a href={TTA_CONTACT_URL} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block rounded-[7px] bg-brand-indigo px-7 py-3.5 text-sm font-semibold text-white hover:opacity-90">Contact Client Services</a><a href={TTA_WEBSITE_URL} target="_blank" rel="noopener noreferrer" className="mt-4 block text-[13px] font-semibold text-brand-dark/60 transition-colors hover:text-brand-indigo">Visit Think Teach Academy</a></div></section>;
}
