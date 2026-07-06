import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Linkedin } from 'lucide-react';
import { publicStorageUrl } from '@/lib/public-assets';

const team = [
  {
    name: 'Shou Yee',
    title: 'The Selection Insider',
    initials: 'SY',
    photoPath: 'about/shouyee.png',
    linkedinUrl: 'https://www.linkedin.com/in/shou-yee/',
    tags: ['SMU', 'UBS', 'Scholarship Assessor', 'RI Pioneer Batch'],
    bio: "A pioneer batch alumnus of the Raffles Integrated Programme and Lee Kong Chian Scholar at SMU, Shou Yee joined UBS through its Graduate Talent Programme, where he later assessed candidates for campus recruitment. He has also served as an assessor on the Lee Kong Chian Scholarship panel. His work is driven by a conviction that the insider's perspective on selection should be available to every family.",
  },
  {
    name: 'Isaac',
    title: 'The Multidisciplinary Strategist',
    initials: 'I',
    photoPath: 'about/isaac.jpg',
    linkedinUrl: 'https://www.linkedin.com/in/isaac-ong-6a9a51163/',
    tags: ['Cambridge Law', 'Duke-NUS Medicine', 'Hwa Chong'],
    bio: 'Isaac moved from ACS Primary to Hwa Chong Institution via the DSA Gifted Education pathway, graduated from Cambridge University with a Law degree, then transitioned to Duke-NUS Medical School. He specialises in helping multidisciplinary learners synthesise diverse passions into one compelling story.',
  },
  {
    name: 'Hugo',
    title: 'The Narrative Architect',
    initials: 'H',
    photoPath: 'about/hugo.jpg',
    linkedinUrl: 'https://www.linkedin.com/in/mrhugobear/',
    tags: ['UCLA', 'Personal Narrative', 'US Admissions'],
    bio: 'A UCLA graduate and lifelong collaborator with Isaac since ACS Primary, Hugo secured his university place through the power of his personal narrative rather than flawless grades. He helps students find their Unique Selling Point and craft authentic stories that resonate with selection panels.',
  },
  {
    name: 'Martin',
    title: 'The Elite Strategy Specialist',
    initials: 'M',
    photoPath: 'about/martin.jpg',
    linkedinUrl: 'https://www.linkedin.com/in/li-yicheng/',
    tags: ['Oxford', 'PSC Scholar', 'SAFOS', 'Hwa Chong'],
    bio: 'A graduate of Hwa Chong Institution and the University of Oxford, Martin was offered the PSC and SAFOS Overseas Scholarship and gained early experience at GIC’s London office. He prepares students for high-stakes applications and the communication demands of the most competitive selection environments.',
  },
] as const;

function TeamPhoto({ member }: { member: (typeof team)[number] }) {
  const photoUrl = publicStorageUrl(member.photoPath);
  const [failed, setFailed] = useState(() => !photoUrl);

  if (failed) {
    return (
      <div className="grid size-[120px] place-items-center rounded-full bg-[#e8e8fa] text-sm font-semibold text-brand-indigo" aria-hidden>
        {member.initials}
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={`Photo of ${member.name}`}
      className="block size-[120px] rounded-full object-cover object-top"
      loading="lazy"
      decoding="async"
      width={120}
      height={120}
      onError={() => setFailed(true)}
    />
  );
}

export function MeetTheTeamSection() {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-dark">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_50%,rgba(91,91,214,0.18),transparent_70%)]" />
        <div className="relative mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8a8f0]">About Beyond Grades</p>
          <h1 className="max-w-[720px] font-serif text-4xl font-bold leading-[1.12] tracking-[-0.02em] text-white md:text-[52px]">
            We Built This Because We Saw What Was
            <br /><em className="font-normal text-[#a8a8f0]">Missing From the Inside.</em>
          </h1>
          <p className="mt-5 max-w-[560px] font-light leading-[1.7] text-white/65">
            We spent years navigating the corridors of global banks, law firms, hospitals, and
            world-class universities. Along the way, we noticed a recurring truth: your grades get
            you into the room, but your voice gets you the seat.
          </p>
        </div>
      </section>

      <section className="border-b border-brand-dark/15 bg-brand-grey">
        <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">Our Story</p>
          <h2 className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">
            Built by people who saw
            <br /><em className="font-normal text-brand-indigo">the gap from the inside.</em>
          </h2>
          <div className="mt-12 grid items-start gap-10 md:grid-cols-2 md:gap-16">
            <div className="space-y-5 text-[15px] leading-[1.75] text-brand-dark/70">
              <p>We saw brilliant students miss out on life-changing opportunities—not because they were not smart enough, but because they had not yet found their personal brand or the confidence to speak authentically.</p>
              <p>We created Beyond Grades because these insider skills should not be a secret. Whether your child is preparing for DSA, university, or a competitive scholarship, we help them find their voice and position themselves for success.</p>
              <p>From free resources to specialised coaching, we make high-level mentorship accessible to every student who is ready to be heard.</p>
            </div>
            <aside className="rounded-xl bg-brand-dark px-8 py-10 md:px-10 md:py-12">
              <blockquote className="font-serif text-[22px] italic leading-[1.5] text-white/90">“Your grades get you into the room. Your voice gets you the seat.”</blockquote>
              <cite className="mt-6 block text-[13px] not-italic text-white/40">— The Beyond Grades founding conviction</cite>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-b border-brand-dark/15 bg-brand-cream" aria-labelledby="meet-the-team-heading">
        <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">The Team</p>
          <h2 id="meet-the-team-heading" className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">
            Four founders.
            <br /><em className="font-normal text-brand-indigo">One shared conviction.</em>
          </h2>
          <p className="mb-12 mt-5 max-w-[680px] leading-[1.7] text-brand-dark/70">Between us, we hold degrees from Oxford, Cambridge, UCLA, and SMU. We have navigated DSA, secured PSC and SAFOS Overseas Scholarships, and gained early careers experience at UBS and GIC.</p>
          <div className="grid overflow-hidden rounded-xl border border-brand-dark/15 md:grid-cols-2">
            {team.map((member) => (
              <article key={member.name} className="flex flex-col border-b border-brand-dark/15 bg-white px-8 py-10 odd:md:border-r [&:nth-child(3)]:md:border-b-0 [&:nth-child(4)]:border-b-0">
                <TeamPhoto member={member} />
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-indigo">Co-founder</p>
                <h3 className="mt-2 text-[22px] font-bold text-brand-dark">{member.name}</h3>
                <p className="mt-1 text-[13px] italic text-brand-dark/60">{member.title}</p>
                <p className="mt-3 flex-1 text-sm leading-[1.7] text-brand-dark/70">{member.bio}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {member.tags.map((tag) => <span key={tag} className="rounded-full bg-[#e8e8fa] px-2.5 py-1 text-[11px] text-brand-indigo">{tag}</span>)}
                </div>
                <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-indigo hover:opacity-75">
                  <Linkedin className="size-3.5" aria-hidden /> LinkedIn →
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-brand-dark/15 bg-brand-grey">
        <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">Our Work Begins Earlier Than You Might Think</p>
          <h2 className="text-3xl font-bold leading-[1.2] text-brand-dark md:text-[40px]">Confidence starts<br /><em className="font-normal text-brand-indigo">before secondary school.</em></h2>
          <div className="mt-12 grid items-center gap-10 rounded-xl border border-brand-dark/15 bg-white px-8 py-10 md:grid-cols-2 md:px-10">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-indigo">In partnership with MapleBear Student Care</p><h3 className="mt-3 text-2xl font-bold text-brand-dark">Young Explorers Programme</h3><p className="mt-3 text-[15px] leading-[1.7] text-brand-dark/70">The same team brings confident communication to Primary 1 to 6 children through a joyful year-long programme delivered in Singapore and Shanghai.</p><Link to="/young-explorers" className="mt-5 inline-block text-[13px] font-semibold text-brand-indigo">Learn More About Young Explorers →</Link></div>
            <div className="flex flex-wrap gap-8">{[['12', 'Engaging modules'], ['P1–P6', 'All primary levels'], ['2', 'Countries']].map(([value, label]) => <div key={label}><p className="font-serif text-[28px] font-bold text-brand-dark">{value}</p><p className="mt-1 text-xs text-brand-dark/60">{label}</p></div>)}</div>
          </div>
        </div>
      </section>

      <section className="bg-brand-dark text-center">
        <div className="mx-auto max-w-[560px] px-5 py-16 md:px-8 md:py-20">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8a8f0]">Ready to Work With Us</p>
          <h2 className="text-3xl font-bold leading-[1.2] text-white md:text-[40px]">Three ways to engage.<br /><em className="font-normal text-[#a8a8f0]">One place to start.</em></h2>
          <p className="mt-4 leading-[1.7] text-white/60">Explore our offerings at your own pace, in a cohort, or one-on-one with our team.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/portal" className="rounded-[7px] bg-brand-indigo px-7 py-3.5 text-sm font-semibold text-white">Explore the Portal - Free to Join</Link><Link to="/consult" className="rounded-[7px] border border-white/25 px-7 py-3.5 text-sm text-white/75">Book a Consulting Call</Link></div>
        </div>
      </section>
    </>
  );
}
