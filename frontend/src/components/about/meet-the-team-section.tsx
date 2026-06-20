import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    linkedinUrl: 'https://www.linkedin.com/in/shou-yee/',
    bio: `Most advisors teach students how to impress a panel. Shou Yee has been on one.

A pioneer batch alumnus of the Raffles Integrated Programme and Lee Kong Chian Scholar at SMU, Shou Yee went on to join UBS through its Graduate Talent Programme — where he later crossed to the other side of the table, assessing candidates for campus recruitment. He has also served as an assessor on the Lee Kong Chian Scholarship panel.

His work with Beyond Grades is driven by a conviction that the insider's perspective on selection should be available to every family, not just those with the right connections.`,
  },
  {
    name: 'Isaac',
    title: 'The Multidisciplinary Strategist',
    initials: 'I',
    accent: 'from-brand-grey/60 to-white',
    photoPath: 'about/isaac.jpg',
    linkedinUrl: 'https://www.linkedin.com/in/isaac-ong-6a9a51163/',
    bio: `Isaac's greatest strength is an ability to see the coherent narrative running through what looks, on the surface, like a collection of unrelated interests and achievements.

He moved from ACS Primary to Hwa Chong Institution via the DSA Gifted Education pathway, later graduating from Cambridge University with a Law degree before making the deliberate transition to Duke-NUS Medical School. This is not a career that followed a straight line — it is a profile built on the rare ability to synthesise diverse passions into a compelling, unified story.

Isaac now brings that same skill to the students he works with. He specialises in guiding multi-disciplinary learners who feel their range of interests is a liability, and helping them understand that it is, in fact, their most powerful asset.`,
  },
  {
    name: 'Hugo',
    title: 'The Narrative Architect',
    initials: 'H',
    accent: 'from-brand-sage/35 to-white',
    photoPath: 'about/hugo.jpg',
    linkedinUrl: 'https://www.linkedin.com/in/mrhugobear/',
    bio: `Hugo's founding insight is a personal one: you do not need a perfect record to earn a place at the table. You need a compelling story about why you belong there.

A graduate of UCLA and a lifelong friend and co-founder alongside Isaac since their days at ACS Primary, Hugo secured his place at an American university not on the strength of flawless grades but on the power of his personal narrative. He understood, earlier than most, that elite institutions are not just selecting academic performers. They are selecting people.

He now specialises in helping students find their Unique Selling Point and craft authentic stories that resonate with interview panels on both an emotional and intellectual level — the kind of stories that panels remember long after the interview ends.`,
  },
  {
    name: 'Martin',
    title: 'The Elite Strategy Specialist',
    initials: 'M',
    accent: 'from-brand-sage/25 to-white',
    photoPath: 'about/martin.jpg',
    linkedinUrl: 'https://www.linkedin.com/in/li-yicheng/',
    bio: `Martin has competed at the highest level of Singapore’s selection landscape — and was offered the PSC and SAFOS Overseas Scholarship, one of the most coveted and demanding awards in the country.

A graduate of Hwa Chong Institution and the University of Oxford, Martin gained early experience in one of the world’s most competitive financial environments during his time at GIC’s London office. He understands, from personal experience, the specific combination of intellectual rigour, communication poise, and personal clarity that the most demanding selection panels require.

Martin now specialises in preparing students for high-stakes applications and interviews, teaching the refined communication skills and composure required to perform when the pressure is highest.`,
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

  const circleClass = 'size-36 shrink-0 rounded-full border-2 border-brand-grey';

  if (showFallback) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-linear-to-br text-xl font-semibold text-brand-dark/90',
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
        <h3 className="mt-4 text-center text-2xl font-bold tracking-tight text-brand-dark md:text-[1.75rem]">
          We Built This Because We Saw What Was Missing From the Inside.
        </h3>
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
          The Team
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
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-brand-dark/75">
                    {member.bio}
                  </p>
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-indigo underline-offset-4 hover:underline"
                  >
                    <Linkedin className="size-4 shrink-0" aria-hidden />
                    LinkedIn
                    <span className="sr-only">
                      {' '}
                      — {member.name} (opens in new tab)
                    </span>
                  </a>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-14 max-w-4xl rounded-2xl border border-brand-grey bg-brand-grey/20 px-6 py-8 text-center">
          <h3 className="text-2xl font-bold tracking-tight text-brand-dark md:text-[1.75rem]">
            Our Work Begins Earlier Than You Might Think.
          </h3>
          <p className="mt-4 text-base leading-relaxed text-brand-dark/75">
            The Beyond Grades mission does not begin at P5. Through Young Explorers, our formally
            partnered programme with MapleBear Student Care Eunos, the same team brings the
            foundations of confident communication to younger children from Primary 1 onwards.
            Delivered in Singapore and Shanghai, Young Explorers gives students an early and joyful
            introduction to public speaking, personal storytelling, and self-expression - skills
            that compound long before the DSA journey officially begins.
          </p>
          <Button asChild variant="link" className="mt-2 h-auto p-0 text-brand-indigo">
            <Link to="/young-explorers">Learn More About Young Explorers</Link>
          </Button>
        </div>

        <div className="mx-auto mt-12 max-w-4xl rounded-2xl border border-brand-grey bg-white px-6 py-8 text-center">
          <h3 className="text-2xl font-bold tracking-tight text-brand-dark md:text-[1.75rem]">
            Ready to Work With Us?
          </h3>
          <p className="mt-4 text-base leading-relaxed text-brand-dark/75">
            Explore our three ways to engage: at your own pace, in a cohort, or one-on-one with
            our team.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/portal">Explore the Portal - Free to Join</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/group-programme">View the Group Programme</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/consult">Book a Consulting Call</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
