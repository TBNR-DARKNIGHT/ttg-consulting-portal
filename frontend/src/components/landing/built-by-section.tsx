import { Link } from '@tanstack/react-router';
import { publicStorageUrl } from '@/lib/public-assets';

const founders = [
  {
    role: 'Co-founder',
    name: 'Shou Yee',
    photoPath: 'about/shouyee.png',
    title: 'The Selection Insider',
    bio: 'Pioneer batch of the Raffles Integrated Programme. Lee Kong Chian Scholar. Former assessor on the Lee Kong Chian Scholarship panel and UBS campus recruitment.',
    tags: ['SMU', 'UBS', 'Scholarship Assessor'],
  },
  {
    role: 'Co-founder',
    name: 'Isaac',
    photoPath: 'about/isaac.jpg',
    title: 'The Multidisciplinary Strategist',
    bio: 'ACS Primary to Hwa Chong via DSA Gifted Education. Cambridge University Law graduate. Duke-NUS Medical School.',
    tags: ['Cambridge Law', 'Duke-NUS', 'DSA Expert'],
  },
  {
    role: 'Co-founder',
    name: 'Hugo',
    photoPath: 'about/hugo.jpg',
    title: 'The Narrative Architect',
    bio: 'UCLA graduate. Secured his university place on the strength of his personal narrative, not a perfect academic record.',
    tags: ['UCLA', 'Personal Narrative', 'US Admissions'],
  },
  {
    role: 'Co-founder',
    name: 'Martin',
    photoPath: 'about/martin.jpg',
    title: 'The Elite Strategy Specialist',
    bio: 'Hwa Chong Institution and University of Oxford. Offered PSC and SAFOS Overseas Scholarships.',
    tags: ['Oxford', 'PSC Scholar', 'SAFOS'],
  },
] as const;

export function BuiltBySection() {
  return (
    <section className="w-full border-b border-white/10 bg-brand-dark">
      <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8a8f0]">
          The Team Behind Beyond Grades
        </p>
        <h2 className="text-3xl font-bold leading-[1.15] tracking-[-0.02em] text-white md:text-[40px]">
          Built by people
          <br />
          <em className="font-normal text-[#a8a8f0]">who have been there.</em>
        </h2>
        <p className="mt-5 max-w-[720px] leading-[1.7] text-white/60">
          Between us, we hold degrees from Oxford, Cambridge, UCLA, and SMU. We have navigated DSA,
          secured PSC and SAFOS Overseas Scholarships, and gained early careers experience at UBS
          and GIC.
        </p>

        <div className="mt-12 grid overflow-hidden rounded-xl border border-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {founders.map((founder) => (
            <article
              key={founder.name}
              className="border-b border-white/10 bg-white/[0.04] px-7 py-8 transition-colors last:border-b-0 hover:bg-white/[0.07] sm:border-r sm:[&:nth-child(2n)]:border-r-0 lg:border-b-0 lg:[&:nth-child(2n)]:border-r lg:last:border-r-0"
            >
              <div className="mb-5 size-20 overflow-hidden rounded-full ring-1 ring-white/15">
                <img
                  src={publicStorageUrl(founder.photoPath)}
                  alt={`${founder.name} headshot`}
                  className="size-full object-cover"
                  loading="lazy"
                  decoding="async"
                  width={80}
                  height={80}
                />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a8a8f0]">
                {founder.role}
              </p>
              <h3 className="mt-2 text-lg font-bold text-white">{founder.name}</h3>
              <p className="mt-1 text-[13px] italic text-white/50">{founder.title}</p>
              <p className="mt-3 text-[13px] leading-[1.65] text-white/55">{founder.bio}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {founder.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand-indigo/20 px-2.5 py-1 text-[11px] text-[#a8a8f0]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
        <Link
          to="/about"
          className="mt-8 inline-flex text-[13px] font-semibold text-[#a8a8f0] hover:opacity-75"
        >
          Read our full story{' '}
          <span aria-hidden className="ml-1.5">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
