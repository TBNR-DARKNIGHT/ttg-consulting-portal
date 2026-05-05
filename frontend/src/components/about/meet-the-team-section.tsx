import { useState } from 'react';
import { Linkedin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { publicStorageUrl } from '@/lib/public-assets';
import { cn } from '@/lib/utils';

const team = [
  {
    name: 'Shou Yee',
    title: 'The Selection Insider',
    initials: 'SY',
    accent: 'from-brand-cream to-white',
    photoPath: 'about/shouyee.png',
    bio: 'An alumnus of the pioneer batch of the Raffles Integrated Programme, Shou Yee witnessed firsthand the shift toward holistic education in Singapore. This experience of being among the first to navigate a system that demanded more than just exam scores fuels his passion for Beyond Grades. A double degree graduate from SMU and a Lee Kong Chian Scholar, Shou Yee’s edge lies in him being on both sides of the scholarship table. Having served on the selection panel for the Lee Kong Chian Scholarship and as an assessor for a global bank campus recruitment, he provides students with an "assessor’s eye" view of the specific personality traits and leadership markers that elite selection boards prioritise today.',
  },
  {
    name: 'Isaac',
    title: 'The Multidisciplinary Strategist',
    initials: 'I',
    accent: 'from-brand-grey/60 to-white',
    photoPath: 'about/isaac.jpg',
    bio: 'Isaac’s journey is a testament to the power of strategic positioning across different domains. He moved from ACS Primary to Hwa Chong Institution via the DSA Gifted Education pathway, later graduating from Cambridge University (Law) before making the bold transition to Duke-NUS Medical School. This rare multidisciplinary background makes him a specialist in guiding "multi-talent" students. Isaac excels at helping multi-disciplinary learners synthesise diverse interests into a cohesive, high-impact narrative that stands out to schools and university boards alike.',
  },
  {
    name: 'Hugo',
    title: 'The Narrative Architect',
    initials: 'H',
    accent: 'from-brand-sage/35 to-white',
    photoPath: 'about/hugo.jpg',
    bio: 'A graduate of UCLA, Hugo’s deep connection to the mission of Beyond Grades began decades ago at ACS Primary, where he first met his co-founder, Isaac. While Isaac navigated the academic pathways of Law and Medicine, Hugo focused on the power of the personal narrative. He secured his own spot at a US university by mastering the art of branding despite not having “perfect” academic results. He now specialises in helping students find their "Unique Selling Point," teaching them how to craft authentic stories that resonate with interview panels on an emotional and intellectual level.',
  },
  {
    name: 'Martin',
    title: 'The Elite Strategy Specialist',
    initials: 'M',
    accent: 'from-brand-sage/25 to-white',
    photoPath: 'about/martin.jpg',
    bio: 'Martin is a proud representative of Hwa Chong Institution and the University of Oxford, where he was offered the prestigious PSC/SAFOS Overseas Scholarship. Having successfully navigated the most rigorous selection process in the country, Martin possesses a deep understanding of what it takes to thrive in international environments, from the historic halls of Oxford to the competitive offices of GIC in London. He specialises in training students to tackle high-level applications with the refined communication skills and poise required to win over the most discerning selection panels.',
  },
];

function TeamAvatar({
  photoUrl,
  initials,
  accent,
  name,
}: {
  photoUrl: string;
  initials: string;
  accent: string;
  name: string;
}) {
  const [showFallback, setShowFallback] = useState(() => !photoUrl);

  const circleClass = 'size-28 shrink-0 rounded-full border-2 border-brand-grey';

  if (showFallback) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-linear-to-br text-lg font-semibold text-brand-dark/90',
          circleClass,
          accent
        )}
        aria-hidden
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={`Photo of ${name}`}
      className={cn('object-cover', circleClass)}
      onError={() => setShowFallback(true)}
    />
  );
}

export function MeetTheTeamSection() {
  return (
    <section className="bg-white py-16 md:py-24" aria-labelledby="meet-the-team-heading">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2
          id="meet-the-team-heading"
          className="text-center text-3xl font-bold tracking-tight text-brand-dark md:text-[2rem] md:leading-tight"
        >
          About Us
        </h2>
        <div className="mx-auto mt-4 max-w-4xl space-y-4 text-center text-base leading-relaxed text-brand-dark/75">
          <p>
            We spent years navigating the corridors of global banks, law firms, hospitals, and
            world-class universities. Along the way, we noticed a recurring truth: in the real
            world, your grades get you into the room, but your voice gets you the seat.
          </p>
          <p>
            We saw brilliant students miss out on life-changing opportunities—not because they
            weren&apos;t smart enough, but because they hadn&apos;t yet found their personal brand or the
            confidence to speak their truth authentically.
          </p>
          <p>
            We came together to create Beyond Grades because we believe these "insider" skills
            shouldn&apos;t be a secret. Whether you are preparing for a DSA interview, a university
            application, or a competitive scholarship, we are here to help you find your voice and
            position yourself for success. From free resources to specialised coaching, we are
            dedicated to making high-level mentorship accessible to every student who is ready to
            be heard.
          </p>
        </div>

        <h3 className="mt-12 text-center text-2xl font-bold tracking-tight text-brand-dark md:text-[1.75rem]">
          Meet the Team
        </h3>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => (
            <li key={member.name}>
              <Card
                className={cn(
                  'h-full border border-brand-grey bg-white py-0 shadow-none transition-shadow duration-200',
                  'hover:shadow-md'
                )}
              >
                <CardContent className="flex flex-col items-center px-5 pb-6 pt-8 text-center">
                  <TeamAvatar
                    photoUrl={publicStorageUrl(member.photoPath)}
                    initials={member.initials}
                    accent={member.accent}
                    name={member.name}
                  />
                  <h3 className="mt-5 font-bold text-brand-dark">{member.name}</h3>
                  <p className="mt-1 text-sm font-medium text-brand-indigo">{member.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-brand-dark/75">{member.bio}</p>
                  <a
                    href="https://www.linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-indigo underline-offset-4 hover:underline"
                  >
                    <Linkedin className="size-4 shrink-0" aria-hidden />
                    LinkedIn
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
