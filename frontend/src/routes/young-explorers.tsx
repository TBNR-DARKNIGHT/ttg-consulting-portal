import { createFileRoute } from '@tanstack/react-router';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/young-explorers')({
  component: YoungExplorersPage,
});

function YoungExplorersPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-[1000px] px-6 py-16 md:py-24">
        <p className="text-sm uppercase tracking-[0.14em] text-brand-dark/60">
          A Beyond Grades programme, delivered in partnership with MapleBear Student Care.
        </p>
        <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-brand-dark md:text-5xl">
          The Foundation of Every Confident Communicator Is Built Early.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-brand-dark/80 md:text-lg">
          Young Explorers is a public speaking and personal expression programme for Primary 1 to
          Primary 6 children, designed to build confidence, storytelling ability, and self-expression
          in a joyful environment.
        </p>

        <section className="mt-10 rounded-2xl border border-brand-grey bg-brand-grey/20 p-6">
          <h2 className="text-2xl font-semibold text-brand-dark">How Young Explorers Works</h2>
          <p className="mt-3 text-brand-dark/75 leading-relaxed">
            The programme runs across a full academic year in 12 engaging modules, each lasting
            three to four weeks. Students practise, present, and receive feedback progressively.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-brand-grey bg-white p-6">
          <h2 className="text-2xl font-semibold text-brand-dark">What Your Child Builds Over the Year</h2>
          <ul className="mt-4 grid gap-2 text-brand-dark/80">
            <li>- Voice projection, eye contact, and purposeful body language.</li>
            <li>- Storytelling structure and clearer organization of ideas.</li>
            <li>- Confidence speaking to classmates, parents, and panels.</li>
            <li>- Creative thinking, teamwork, and listening skills.</li>
            <li>- A personal communication style that is authentically their own.</li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-brand-grey bg-white p-6">
          <h2 className="text-2xl font-semibold text-brand-dark">How to Enrol</h2>
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
