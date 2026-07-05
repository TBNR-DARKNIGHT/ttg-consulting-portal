import { Link } from '@tanstack/react-router';
import { publicStorageUrl } from '@/lib/public-assets';

const options = [
  {
    badge: 'Self-paced',
    title: 'Explore at Your Own Pace',
    body: "Free to join. Access our DSA seminar clips, Opportunities Directory, and practical guides the moment you sign up. Premium courses are available when you're ready.",
    cta: 'Join the Portal Free',
    to: '/portal',
    imagePath: 'landing/explore_at_own_pace.jpeg',
  },
  {
    badge: 'Cohort-based',
    title: 'Learn With a Cohort',
    body: 'Our DSA Interview Intensive is a focused programme with small groups, real practice, and direct coaching from our team.',
    cta: 'View DSA Interview Intensive',
    to: '/group-programme',
    imagePath: 'landing/learn_with_a_cohort.jpeg',
  },
  {
    badge: '1-on-1',
    title: 'Work With Us Directly',
    body: "Our DSA Consultation begins with a personalised session covering your child's profile, the right domain to pursue, and a clear set of next steps.",
    cta: 'Book Your Initial Consultation',
    to: '/consult',
    imagePath: 'landing/work_with_us_directly.jpeg',
  },
] as const;

export function StartOptionsSection() {
  return (
      <section className="w-full border-b border-brand-dark/15 bg-brand-grey">
        <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">
            How Would You Like to Begin
          </p>
          <h2 className="text-3xl font-bold leading-[1.15] tracking-[-0.02em] text-brand-dark md:text-[40px]">
            Every family&apos;s journey
            <br />
            looks <em className="font-normal text-brand-indigo">different.</em>
          </h2>
          <p className="mt-5 max-w-[640px] leading-[1.7] text-brand-dark/70">
            Choose the path that fits where you are right now. You can move between pathways at any
            time.
          </p>

          <div className="mt-12 grid overflow-hidden rounded-xl border border-brand-dark/15 md:grid-cols-3">
            {options.map((option) => (
              <article
                key={option.title}
                className="flex min-h-[330px] flex-col border-b border-brand-dark/15 bg-white px-8 py-9 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <div className="flex min-h-14 items-center gap-3">
                  <img
                    src={publicStorageUrl(option.imagePath)}
                    alt=""
                    className="block h-auto max-h-14 w-auto max-w-[150px] shrink-0 object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="w-fit rounded bg-[#e8e8fa] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-indigo">
                    {option.badge}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-bold leading-tight text-brand-dark">{option.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-[1.65] text-brand-dark/70">{option.body}</p>
                <Link
                  to={option.to}
                  className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-indigo transition-opacity hover:opacity-75"
                >
                  {option.cta} <span aria-hidden>→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
  );
}
