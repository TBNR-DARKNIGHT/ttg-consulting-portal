import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { publicStorageUrl } from '@/lib/public-assets';

const BUILT_BY_IMAGE = publicStorageUrl('landing/prep_lounge_image.jpg');

const founders = [
  {
    name: 'Shou Yee | The Selection Insider',
    photoPath: 'about/shouyee.png',
    bio: 'Pioneer batch of the Raffles Integrated Programme. Lee Kong Chian Scholar. Former assessor on the Lee Kong Chian Scholarship panel and UBS campus recruitment.',
  },
  {
    name: 'Isaac | The Multidisciplinary Strategist',
    photoPath: 'about/isaac.jpg',
    bio: 'ACS Primary to Hwa Chong via DSA Gifted Education. Cambridge University Law graduate. Duke-NUS Medical School. Specialist in synthesising multi-talent profiles into high-impact narratives.',
  },
  {
    name: 'Hugo | The Narrative Architect',
    photoPath: 'about/hugo.jpg',
    bio: 'UCLA graduate. Secured his university place on the strength of his personal narrative, not a perfect academic record. Specialist in helping students find and articulate their Unique Selling Point.',
  },
  {
    name: 'Martin | The Elite Strategy Specialist',
    photoPath: 'about/martin.jpg',
    bio: 'Hwa Chong Institution and University of Oxford. PSC and SAFOS Overseas Scholar. Former GIC professional. Specialist in training students for the most demanding selection environments.',
  },
] as const;

function founderHeadshotAlt(fullName: string): string {
  const first = fullName.split('|')[0]?.trim() ?? fullName;
  return `${first} headshot`;
}

export function BuiltBySection() {
  return (
    <section className="w-full bg-brand-grey/20">
      <div className="mx-auto max-w-[1200px] px-6 py-18 md:py-22">
        <h2 className="text-center text-brand-dark text-3xl md:text-[44px] font-bold tracking-[-0.02em] leading-[1.08]">
          Built by People Who Have Been There
        </h2>
        <div className="mt-5 flex flex-col gap-8">
          <div className="order-3 mx-auto max-w-[920px] space-y-4 text-left text-base leading-relaxed text-brand-dark/75 md:order-2 md:text-lg">
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

          <div className="order-4 grid gap-3 md:order-3 md:grid-cols-2">
            {founders.map((founder) => {
              const src = publicStorageUrl(founder.photoPath);
              return (
                <article
                  key={founder.name}
                  className="flex gap-4 rounded-xl border border-brand-grey bg-white px-5 py-4"
                >
                  {src ? (
                    <div className="size-16 shrink-0 overflow-hidden rounded-full ring-1 ring-brand-grey/40 md:size-20">
                      <img
                        src={src}
                        alt={founderHeadshotAlt(founder.name)}
                        className="size-full object-cover"
                        loading="lazy"
                        decoding="async"
                        width={80}
                        height={80}
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-brand-dark font-semibold">{founder.name}</p>
                    <p className="mt-2 text-sm leading-relaxed text-brand-dark/75 md:text-base">
                      {founder.bio}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          {BUILT_BY_IMAGE ? (
            <div className="order-2 mx-auto max-w-[860px] overflow-hidden rounded-xl border border-brand-grey md:order-4">
              <img
                src={BUILT_BY_IMAGE}
                alt="Beyond Grades workshop session"
                className="w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : null}

          <div className="order-5 mx-auto max-w-[860px] md:order-5">
            <Button asChild variant="link" className="h-auto p-0 text-brand-indigo">
              <Link to="/about">Read our full story on the About Us page</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
