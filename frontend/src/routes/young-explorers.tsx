import { createFileRoute } from '@tanstack/react-router';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { YoutubeShortsVideoCard } from '@/components/landing/youtube-shorts-video-card';
import { publicStorageUrl } from '@/lib/public-assets';

const YOUNG_EXPLORERS_IMAGE = publicStorageUrl('landing/young_explorers_prog.jpg');

export const Route = createFileRoute('/young-explorers')({
  component: YoungExplorersPage,
});

function YoungExplorersPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-[1000px] px-6 pt-4 pb-16 md:pb-24 md:pt-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[0.14em] text-brand-dark/60">
            A Beyond Grades programme, delivered in partnership with MapleBear Student Care.
          </p>

          {YOUNG_EXPLORERS_IMAGE ? (
            <div className="mx-auto mt-5 max-w-[520px] overflow-hidden rounded-xl border border-brand-grey md:mt-6">
              <img
                src={YOUNG_EXPLORERS_IMAGE}
                alt=""
                className="w-full object-cover"
                loading="eager"
                decoding="async"
              />
            </div>
          ) : null}

          <h1
            className={`font-serif text-3xl font-bold tracking-tight text-brand-dark md:text-5xl ${YOUNG_EXPLORERS_IMAGE ? 'mt-6 md:mt-8' : 'mt-3'}`}
          >
            The Foundation Of Every Confident Communicator Is Built Early.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-brand-dark/80 md:text-lg">
            Young Explorers is a public speaking and personal expression programme for Primary 1 to
            Primary 6 children, designed to build confidence, storytelling ability, and self-expression
            in a joyful environment.
          </p>
        </div>

        <section className="mt-10 rounded-2xl border border-brand-grey bg-brand-grey/20 p-6">
          <h2 className="text-2xl font-semibold text-brand-dark">How Young Explorers Works</h2>
          <p className="mt-3 text-brand-dark/75 leading-relaxed">
            The programme runs across a full academic year in 12 engaging modules, each lasting
            three to four weeks. Students practise, present, and receive feedback progressively.
          </p>
          <p className="mt-3 text-brand-dark/75 leading-relaxed">
            Every module builds toward a moment of showcase — a short presentation or creative
            project where students demonstrate what they have learned. Parents get a clear and
            tangible view of their child&apos;s growth at every stage, not just at the end of the
            year.
          </p>
        </section>

        <div className="mt-8">
          <YoutubeShortsVideoCard
            videoId="sXO7Fp9rcNc"
            title="Young Explorers programme highlight"
          />
        </div>

        <section className="mt-8 rounded-2xl border border-brand-grey bg-white p-6">
          <h2 className="text-2xl font-semibold text-brand-dark">What Your Child Builds Over The Year</h2>
          <ul className="mt-4 grid gap-2 text-brand-dark/80">
            <li>- Voice projection, eye contact, and purposeful body language.</li>
            <li>- Storytelling structure and clearer organization of ideas.</li>
            <li>- Confidence speaking to classmates, parents, and panels.</li>
            <li>- Creative thinking, teamwork, and listening skills.</li>
            <li>- A personal communication style that is authentically their own.</li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-brand-grey bg-white p-6">
          <h2 className="text-2xl font-semibold text-brand-dark">How To Enrol</h2>
          <p className="mt-3 text-brand-dark/75 leading-relaxed">
            Young Explorers runs at{' '}
            <span className="font-medium text-brand-dark">MapleBear Student Care (Eunos)</span>
            . Reach out to the centre directly for programme availability and next steps.
          </p>
          <Button asChild className="mt-5">
            <a
              href="https://wa.me/6588935430"
              target="_blank"
              rel="noopener noreferrer"
            >
              Enquire with MapleBear
            </a>
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
