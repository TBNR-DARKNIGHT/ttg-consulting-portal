import { Link } from '@tanstack/react-router';
import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type CommunityQnaCard = {
  id: string;
  question: string;
  answer: string;
};

const qnaCards: CommunityQnaCard[] = [
  {
    id: 'qna-1',
    question: 'When should my child start DSA prep?',
    answer:
      'Start with clarity on the DSA category and timeline, then build evidence month-by-month. For most families, the best time is when you can consistently track CCA progress and portfolio artifacts without burning out.',
  },
  {
    id: 'qna-2',
    question: 'What CCA activities help DSA applications?',
    answer:
      'Schools look for commitment, growth, and documented impact. Choose CCAs where your child can progress, lead, and show sustained training — and make sure you capture outcomes (competitions, performances, roles, reflections).',
  },
  {
    id: 'qna-3',
    question: 'How do we prepare for DSA interviews without sounding rehearsed?',
    answer:
      'Build a story bank instead of memorising scripts. Practice answering with a simple structure (context → action → result → learning), then vary prompts so your child stays natural and confident under follow-up questions.',
  },
  {
    id: 'qna-4',
    question: 'What should go into a DSA portfolio for sports?',
    answer:
      'Keep it selective: a 1-page summary, key achievements, verified records, and evidence of training consistency. Add short reflections that show coachability and teamwork — and align everything to the school’s sport culture.',
  },
  {
    id: 'qna-5',
    question: 'Does academic performance still matter for DSA?',
    answer:
      'Yes — it’s often the gatekeeper after talent. Aim for stability and improvement, and be ready to explain dips. The strongest profiles connect academics to habits: discipline, reflection, and the ability to juggle commitments.',
  },
];

export function CommunityQnaSection() {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="w-full bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-18 md:py-22">
        <h2
          id={headingId}
          className="text-left text-brand-dark text-3xl md:text-[40px] font-bold tracking-[-0.02em]"
        >
          Our Experts Are Here To Help ....
        </h2>

        <div className="mt-8 grid gap-5 md:mt-10 md:grid-cols-2">
          {qnaCards.map((card) => (
            <article key={card.id}>
              <Card className="h-full rounded-2xl border border-brand-grey bg-white shadow-none">
                <CardContent className="px-6 py-6">
                  <h3 className="text-brand-dark font-semibold text-lg leading-snug">
                    Q: {card.question}
                  </h3>
                  <p className="mt-3 text-sm text-brand-dark/80 leading-relaxed">
                    A: {card.answer}
                  </p>
                </CardContent>
              </Card>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-brand-dark/75">
            Sign up to access all community answers
          </p>
          <Button asChild size="lg" className="h-11 px-7">
            <Link to="/auth/sign-up">Join Free</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

