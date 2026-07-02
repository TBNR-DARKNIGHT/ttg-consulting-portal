import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { publicStorageUrl } from '@/lib/public-assets';

const resources = [
  {
    title: 'DSA Seminar Clips',
    imagePath: 'portal/dsa_seminar_clips.jpeg',
    description:
      'Bite-sized videos covering the history of DSA, common misconceptions, how to choose the right domain, and the interview questions that come up most consistently across schools.',
  },
  {
    title: 'Opportunities Directory',
    imagePath: 'portal/opportunities_directory.jpeg',
    description:
      'A curated guide to competitions, programmes, and experiences across primary and secondary levels — organised by domain and stage of learning.',
  },
  {
    title: '8 Golden Rules for Acing DSA Interviews',
    imagePath: 'portal/8_golden_rules.jpeg',
    description:
      'A practical guide built from real experience on both sides of the interview process. Written for students who want to walk into any room with genuine confidence.',
  },
] as const;

export function PortalFreeResourcesSection() {
  return (
    <section className="mt-14 md:mt-16" aria-labelledby="portal-free-resources-heading">
      <h2
        id="portal-free-resources-heading"
        className="text-2xl font-semibold tracking-tight text-brand-dark md:text-3xl"
      >
        Free On Signup: DSA 101
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-dark/75 md:text-lg">
        Three resources, available the moment you create your account.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {resources.map((item) => {
          const thumbUrl = publicStorageUrl(item.imagePath);
          return (
            <Card
              key={item.title}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand-grey shadow-none"
            >
              <CardHeader className="pb-2 pt-5">
                {thumbUrl ? (
                  <div className="mb-2 flex h-16 items-center justify-start">
                    <img
                      src={thumbUrl}
                      alt=""
                      className="max-h-16 w-auto max-w-[220px] object-contain object-left"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : null}
                <h3 className="text-lg font-semibold leading-snug text-brand-dark">{item.title}</h3>
              </CardHeader>
              <CardContent className="pt-0 pb-5 text-sm leading-relaxed text-brand-dark/75 md:text-base">
                {item.description}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
