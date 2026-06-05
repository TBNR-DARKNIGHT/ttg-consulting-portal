import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { publicStorageUrl } from '@/lib/public-assets';

const BUILT_BY_IMAGE = publicStorageUrl('landing/prep_lounge_image.jpg');

const founders = [
  {
    name: 'Shou Yee | The Selection Insider',
    bio: 'Pioneer batch of the Raffles Integrated Programme. Lee Kong Chian Scholar. Former assessor on the Lee Kong Chian Scholarship panel and UBS campus recruitment.',
  },
  {
    name: 'Isaac | The Multidisciplinary Strategist',
    bio: 'ACS Primary to Hwa Chong via DSA Gifted Education. Cambridge University Law graduate. Duke-NUS Medical School. Specialist in synthesising multi-talent profiles into high-impact narratives.',
  },
  {
    name: 'Hugo | The Narrative Architect',
    bio: 'UCLA graduate. Secured his university place on the strength of his personal narrative, not a perfect academic record. Specialist in helping students find and articulate their Unique Selling Point.',
  },
  {
    name: 'Martin | The Elite Strategy Specialist',
    bio: 'Hwa Chong Institution and University of Oxford. PSC and SAFOS Overseas Scholar. Former GIC professional. Specialist in training students for the most demanding selection environments.',
  },
] as const;

export function BuiltBySection() {
  return (
    <section className="w-full bg-brand-grey/20">
      <div className="mx-auto max-w-[1200px] px-6 py-18 md:py-22">
        <h2 className="text-center text-brand-dark text-3xl md:text-[44px] font-bold tracking-[-0.02em] leading-[1.08]">
          Built by People Who Have Been There
        </h2>
        <div className="mt-5 mx-auto max-w-[920px] space-y-4 text-brand-dark/75 leading-relaxed text-base md:text-lg text-center">
          <p>
            Between us, we hold degrees from Oxford, Cambridge, UCLA, and SMU. We have navigated
            DSA, secured PSC and SAFOS Overseas Scholarships, transitioned between law and medicine,
            and built careers at global institutions like UBS and GIC.
          </p>
          <p>But credentials are not why we built Beyond Grades.</p>
          <p>
            We built it because across all of those experiences - in lecture halls, interview
            rooms, and boardrooms - we kept seeing the same gap. Brilliant students who had done
            everything right on paper, but had never been taught how to walk into a room and own
            it. How to tell their story. How to make a selection panel remember them.
          </p>
          <p>Beyond Grades exists to close that gap.</p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {founders.map((founder) => (
            <article key={founder.name} className="rounded-xl border border-brand-grey bg-white px-5 py-4">
              <p className="text-brand-dark font-semibold">{founder.name}</p>
              <p className="mt-2 text-sm md:text-base text-brand-dark/75 leading-relaxed">
                {founder.bio}
              </p>
            </article>
          ))}
        </div>

        {BUILT_BY_IMAGE ? (
          <div className="mx-auto mt-8 max-w-[860px] overflow-hidden rounded-xl border border-brand-grey">
            <img
              src={BUILT_BY_IMAGE}
              alt="Beyond Grades workshop session"
              className="w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : null}

        <div className="mx-auto mt-4 max-w-[860px]">
          <Button asChild variant="link" className="h-auto p-0 text-brand-indigo">
            <Link to="/about">Read our full story on the About Us page</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
