import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const options = [
  {
    title: 'Explore at Your Own Pace',
    body: "The Beyond Grades Portal gives you immediate access to our frameworks, tools, and resources - free to join, with premium courses available when you are ready. Work through our materials at your own pace, preview what our methodology looks like in practice, and take the first step towards building your child's standout profile.",
    cta: 'Join the Portal Free',
    to: '/portal',
  },
  {
    title: 'Learn With a Cohort',
    body: 'Our Group DSA Programme brings motivated students together in a structured, time-bound environment. Working alongside peers who share the same ambition, your child will build their portfolio, refine their personal narrative, and develop the interview presence that selection panels remember. Places are limited each intake.',
    cta: 'View the Group Programme',
    to: '/group-programme',
  },
  {
    title: 'Work With Us Directly',
    body: 'Executive Consulting is our highest-touch offering. Your child works one-on-one with a member of our team to build a fully personalised strategy from narrative development to mock interview panels.',
    cta: 'Book a Consulting Call',
    to: '/consult',
  },
] as const;

export function StartOptionsSection() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-18 md:py-22">
        <h2 className="text-brand-dark text-3xl md:text-[44px] font-bold tracking-[-0.02em] leading-[1.08]">
          How Would You Like to Begin?
        </h2>
        <p className="mt-4 text-brand-dark/75 text-base md:text-lg leading-relaxed max-w-[720px]">
          Every family&apos;s journey looks different. Choose the path that fits where you are right
          now.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {options.map((option) => (
            <Card
              key={option.title}
              className="h-full rounded-2xl border border-brand-grey shadow-none flex flex-col"
            >
              <CardHeader>
                <CardTitle className="text-brand-dark text-xl">{option.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="text-brand-dark/75 leading-relaxed text-sm md:text-base">{option.body}</p>
                <Button asChild className="mt-6 w-full md:mt-auto">
                  <Link to={option.to}>{option.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
