import { BadgeCheck, MessageSquareText, Sparkles } from 'lucide-react';

const whyPoints = [
  {
    title: 'Crafting the Narrative',
    description:
      'Moving beyond a list of grades to answer the most important question: "Who am I?"',
    icon: <Sparkles className="h-5 w-5 text-brand-indigo" aria-hidden />,
  },
  {
    title: 'Strategic Personal Branding',
    description:
      'Learning to synthesise diverse talents into a unique profile that stands out to selection panels.',
    icon: <BadgeCheck className="h-5 w-5 text-brand-indigo" aria-hidden />,
  },
  {
    title: 'Elite Communication',
    description:
      'Developing the poise, presence, and clarity required for the world’s most competitive rooms.',
    icon: <MessageSquareText className="h-5 w-5 text-brand-indigo" aria-hidden />,
  },
] as const;

export function WhySection() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-18 md:py-22">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 className="text-brand-dark text-3xl md:text-[44px] font-bold tracking-[-0.02em] leading-[1.08]">
              The Beyond Grades Philosophy
            </h2>
            <p className="mt-5 text-brand-dark/75 text-base md:text-lg leading-relaxed max-w-[640px]">
              Many believe that DSA is only for those with elite talents in sports or the arts. We
              offer a different perspective. We treat the DSA journey as a foundational workshop for
              life. Whether a child is successful in their application or not, the process of
              building a portfolio and preparing for an interview is invaluable. It is a rare
              opportunity for students to explore their identity and learn to articulate their
              thinking with confidence. These are skills that compound for decades.
            </p>
          </div>

          <div className="grid gap-4">
            {whyPoints.map((point) => (
              <div
                key={point.title}
                className="flex items-start gap-4 rounded-2xl border border-brand-grey bg-white px-6 py-5 shadow-none"
              >
                <div
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-grey/30"
                  aria-hidden
                >
                  {point.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-brand-dark font-semibold text-base">
                    {point.title}
                  </div>
                  <p className="mt-1 text-sm md:text-[15px] text-brand-dark/75 leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

