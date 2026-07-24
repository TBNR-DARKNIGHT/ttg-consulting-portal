import { BadgeCheck, Clock3, MessageSquareText } from 'lucide-react';

const philosophySteps = [
  {
    title: 'Crafting the Narrative',
    description:
      'Moving beyond a list of grades to answer the most important question: who is this student, and why do they belong here?',
    Icon: Clock3,
  },
  {
    title: 'Strategic Personal Branding',
    description:
      'Synthesising diverse talents, interests, and achievements into a unique profile that stands out to selection panels.',
    Icon: BadgeCheck,
  },
  {
    title: 'Elite Communication',
    description:
      'Developing the poise, presence, and clarity required to walk into any competitive interview room with genuine confidence.',
    Icon: MessageSquareText,
  },
] as const;

export function WhySection() {
  return (
    <section className="w-full border-b border-brand-dark/15 bg-brand-cream">
      <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">
          The Beyond Grades Philosophy
        </p>
        <h2 className="text-3xl font-bold leading-[1.2] tracking-[-0.02em] text-brand-dark md:text-[40px]">
          DSA is not about
          <br />
          <em className="font-normal text-brand-indigo">gaming the system.</em>
        </h2>
        <p className="mt-5 max-w-[640px] leading-[1.7] text-brand-dark/70">
          Selection panels are looking for students who know themselves well. Our role is to help
          your child develop the self-awareness and clarity to present who they genuinely are with
          confidence.
        </p>

        <div className="mt-12 grid items-start gap-10 md:grid-cols-2 md:gap-20">
          <div className="flex flex-col gap-8">
            {philosophySteps.map(({ title, description, Icon }) => (
              <article key={title} className="flex items-start gap-5">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#e8e8fa]">
                  <Icon className="size-[18px] text-brand-indigo" aria-hidden />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-dark">{title}</h3>
                  <p className="mt-1.5 text-sm leading-[1.6] text-brand-dark/70">{description}</p>
                </div>
              </article>
            ))}
          </div>

          <aside className="rounded-xl bg-brand-dark px-8 py-10 md:px-10 md:py-12">
            <blockquote className="font-serif text-[22px] italic leading-[1.5] text-white/90">
              “Many believe DSA is reserved only for students with elite talents in sports or the
              arts. We offer a different perspective. Whether or not a student secures an offer, the
              process is a rare opportunity to explore their identity and learn to articulate their
              thinking.”
            </blockquote>
            <cite className="mt-6 block text-[13px] not-italic text-white/50">
              — The Beyond Grades founding team
            </cite>
          </aside>
        </div>
      </div>
    </section>
  );
}
