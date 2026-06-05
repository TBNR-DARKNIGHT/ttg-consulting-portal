import { createFileRoute, Link } from '@tanstack/react-router';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/group-programme')({
  component: GroupProgrammePage,
});

function GroupProgrammePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-[1000px] px-6 py-16 md:py-24">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-brand-dark md:text-5xl">
          The DSA Interview Programme That Helps Students Walk Into Selection Rooms With Confidence
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-brand-dark/80 md:text-lg">
        Two successful runs. A focused half-day format. Real coaching from mentors who have navigated competitive admissions across global institutions. 
        Our DSA Interview Intensive runs each year in April and May, timed specifically for students preparing for the DSA application window. 
        Registration for the next cycle opens early 2027.
        </p>

        <section className="mt-10 grid gap-4 rounded-2xl border border-brand-grey bg-brand-grey/20 p-6 text-brand-dark/80">
          <p>
            <span className="font-semibold text-brand-dark">Format:</span> Small group interactive
            workshop with guided practice and feedback.
          </p>
          <p>
            <span className="font-semibold text-brand-dark">Duration:</span> 4 hours including a
            short lunch break.
          </p>
          <p>
            <span className="font-semibold text-brand-dark">Programme cycle:</span> April and May
            annually.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-brand-grey bg-brand-grey/20 p-6">
          <p className="text-brand-dark/80 leading-relaxed">
            The 2026 intake is now closed. To be among the first to know when registration opens
            for 2027, join our waitlist below.
          </p>
          <Button asChild className="mt-5">
            <a href="https://wa.me/6597692396" target="_blank" rel="noopener noreferrer">
              Join the 2027 Waitlist
            </a>
          </Button>
          <p className="mt-4 text-brand-dark/80 leading-relaxed">
            TTA families: contact our client services team to access your exclusive member rate
            when registration opens.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-brand-grey bg-white p-6">
          <h2 className="text-2xl font-semibold text-brand-dark">Reserve Your Child&apos;s Place</h2>
          <p className="mt-3 text-brand-dark/75 leading-relaxed">
          Places are kept small deliberately — so every student receives individual coaching and meaningful practice time. 
          Families on the waitlist are given priority access when the next cycle opens.

          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <a href="https://wa.me/6597692396" target="_blank" rel="noopener noreferrer">
                Join the 2027 Waitlist
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link to="/consult">Get in touch with a question</Link>
            </Button>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-brand-grey bg-white p-6">
          <p className="text-brand-dark/80 leading-relaxed">
            Prefer a fully personalised approach? Our Executive Consulting service builds a bespoke
            strategy around your child&apos;s specific profile from the first session.
          </p>
          <Link
            to="/consult"
            className="mt-4 inline-block text-brand-indigo underline underline-offset-4"
          >
            Learn About Executive Consulting
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
