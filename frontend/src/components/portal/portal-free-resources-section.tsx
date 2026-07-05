import { BookOpen, FileText, Video } from 'lucide-react';

const resources = [
  {
    badge: 'Video Series',
    title: 'DSA Seminar Clips',
    description:
      'Bite-sized videos covering the history of DSA, common misconceptions, how to choose the right domain, and the interview questions that come up most consistently across schools.',
    Icon: Video,
  },
  {
    badge: 'Reference Guide',
    title: 'Opportunities Directory',
    description:
      'A curated guide to competitions, programmes, and experiences across primary and secondary levels—organised by domain and stage of learning.',
    Icon: FileText,
  },
  {
    badge: 'eBook',
    title: '8 Golden Rules for Acing DSA Interviews',
    description:
      'A practical guide built from real experience on both sides of the interview process. Written for students who want to walk into any room with genuine confidence.',
    Icon: BookOpen,
  },
] as const;

export function PortalFreeResourcesSection() {
  return (
    <section className="border-b border-brand-dark/15 bg-brand-grey" aria-labelledby="portal-free-resources-heading">
      <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">
          Free on Signup
        </p>
        <h2 id="portal-free-resources-heading" className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">
          Three resources, available
          <br />
          <em className="font-normal text-brand-indigo">the moment you join.</em>
        </h2>
        <p className="mb-12 mt-5 max-w-[640px] leading-[1.7] text-brand-dark/70">
          No payment required. Create your account and access all three immediately.
        </p>
        <div className="grid overflow-hidden rounded-xl border border-brand-dark/15 md:grid-cols-3">
          {resources.map(({ badge, title, description, Icon }) => (
            <article key={title} className="border-b border-brand-dark/15 bg-white px-8 py-9 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
              <div className="grid size-11 place-items-center rounded-[10px] bg-[#e8e8fa]">
                <Icon className="size-5 text-brand-indigo" aria-hidden />
              </div>
              <span className="mt-4 inline-block rounded bg-[#e8e8fa] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-indigo">{badge}</span>
              <h3 className="mt-3 text-lg font-bold leading-tight text-brand-dark">{title}</h3>
              <p className="mt-3 text-sm leading-[1.65] text-brand-dark/70">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
