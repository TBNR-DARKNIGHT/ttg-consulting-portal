import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { publicStorageUrl } from '@/lib/public-assets';

const options = [
  {
    title: 'Explore at Your Own Pace',
    body: "The Beyond Grades Portal gives you immediate access to our frameworks, tools, and resources - free to join, with premium courses available when you are ready. Work through our materials at your own pace, preview what our methodology looks like in practice, and take the first step towards building your child's standout profile.",
    cta: 'Join the Portal Free',
    to: '/portal',
    /** `public-assets/landing/explore_at_own_pace.jpeg` */
    logoPath: 'landing/explore_at_own_pace.jpeg',
  },
  {
    title: 'Learn With a Cohort',
    body: 'DSA Interview Intensive brings motivated students together in a structured, time-bound environment. Working alongside peers who share the same ambition, your child will build their portfolio, refine their personal narrative, and develop the interview presence that selection panels remember. Places are limited each intake.',
    cta: 'View DSA Interview Intensive',
    to: '/group-programme',
    /** `public-assets/landing/learn_with_a_cohort.jpeg` */
    logoPath: 'landing/learn_with_a_cohort.jpeg',
  },
  {
    title: 'Work With Us Directly',
    body: 'Our DSA Consultation is our highest-touch offering. Your child works one-on-one with a member of our team to build a fully personalised strategy from narrative development to mock interview panels.',
    cta: 'Book a Consulting Call',
    to: '/consult',
    /** `public-assets/landing/work_with_us_directly.jpeg` */
    logoPath: 'landing/work_with_us_directly.jpeg',
  },
] as const;

const TTA_CLIENT_SERVICES_WA = 'https://wa.me/6597692396';
const THINK_TEACH_ACADEMY_URL = 'https://www.thinkteachacademy.com';

export function StartOptionsSection() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-18 md:py-22">
        <h2 className="text-brand-dark text-3xl md:text-[44px] font-bold tracking-[-0.02em] leading-[1.08]">
          How Would You Like To Begin?
        </h2>
        <p className="mt-4 text-brand-dark/75 text-base md:text-lg leading-relaxed max-w-[720px]">
          Every family&apos;s journey looks different. Choose the path that fits where you are right
          now.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {options.map((option) => {
            const logoUrl = publicStorageUrl(option.logoPath);
            return (
            <Card
              key={option.title}
              className="h-full rounded-2xl border border-brand-grey shadow-none flex flex-col"
            >
              <CardHeader>
                {logoUrl ? (
                  <div className="mb-4 flex h-14 items-center justify-start">
                    <img
                      src={logoUrl}
                      alt=""
                      className="max-h-14 w-auto max-w-[200px] object-contain object-left"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : null}
                <CardTitle className="text-brand-dark text-xl">{option.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="text-brand-dark/75 leading-relaxed text-sm md:text-base">{option.body}</p>
                <Button asChild className="mt-6 w-full md:mt-auto">
                  <Link to={option.to}>{option.cta}</Link>
                </Button>
              </CardContent>
            </Card>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-brand-grey bg-brand-cream/60 px-6 py-7 md:mt-14 md:px-8 md:py-9">
          <h3 className="text-brand-dark text-2xl font-bold tracking-[-0.01em] md:text-3xl">
            A Note For Think Teach Academy Families
          </h3>
          <div className="mt-4 space-y-4 text-brand-dark/80 leading-relaxed">
            <p>
              If your child is currently enrolled at Think Teach Academy, you already have full
              access to our premium courses — at no additional cost.
            </p>
            <p>
              Beyond Grades is part of the Think Teach Group, the same team behind Think Teach
              Academy, MACRO Academy and the education approach featured in The Straits Times,
              Channel NewsAsia, and Bloomberg, and South Korea’s Education Broadcasting Network. As
              a TTA family, your membership extends here automatically.
            </p>
            <p>
              To claim your complimentary access, simply reach out to our client services team and
              we will get you set up.
            </p>
          </div>
          <div className="mt-6 flex flex-col items-start gap-3">
            <Button asChild className="h-11 px-5">
              <a href={TTA_CLIENT_SERVICES_WA} target="_blank" rel="noopener noreferrer">
                Contact Client Services
              </a>
            </Button>
            <a
              href={THINK_TEACH_ACADEMY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-indigo underline underline-offset-4 hover:opacity-80"
            >
              Not a TTA family yet? Learn more about Think Teach Academy
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
