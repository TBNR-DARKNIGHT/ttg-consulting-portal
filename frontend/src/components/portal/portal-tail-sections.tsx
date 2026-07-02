import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

const TTA_CONTACT_URL = 'https://thinkteachacademy.com/contact-us/';

export function PortalCommunitySection() {
  return (
    <section className="mt-14 md:mt-16" aria-labelledby="portal-community-heading">
      <div className="rounded-2xl border border-brand-grey bg-brand-grey/20 p-6 md:p-8">
        <h2
          id="portal-community-heading"
          className="text-2xl font-semibold tracking-tight text-brand-dark md:text-3xl"
        >
          Community And Live Q And A
        </h2>
        <p className="mt-2 text-sm font-medium uppercase tracking-wide text-brand-dark/60">
          (Coming Soon)
        </p>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-brand-dark/80 md:text-lg">
          A dedicated space for questions, shared experiences, and live sessions where you can put
          your questions directly to the Beyond Grades team.
        </p>
      </div>
    </section>
  );
}

export function PortalBeginTodaySection() {
  return (
    <section className="mt-14 md:mt-16" aria-labelledby="portal-begin-today-heading">
      <div className="mx-auto max-w-xl rounded-2xl border border-brand-grey bg-brand-grey/20 p-6 text-center md:p-8">
        <h2
          id="portal-begin-today-heading"
          className="text-2xl font-semibold tracking-tight text-brand-dark md:text-3xl"
        >
          Begin Today.
        </h2>
        <div className="mt-6 flex justify-center">
          <Button asChild size="lg">
            <Link to="/auth/sign-up">Create Your Free Account</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function PortalTtaMembersSection() {
  return (
    <section className="mt-14 md:mt-16" aria-labelledby="portal-tta-members-heading">
      <div className="rounded-2xl border border-brand-grey bg-white p-6 md:p-8">
        <h2
          id="portal-tta-members-heading"
          className="text-2xl font-semibold tracking-tight text-brand-dark md:text-3xl"
        >
          For Think Teach Academy Families
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-brand-dark/80 md:text-lg">
          Already enrolled at Think Teach Academy? Contact our client services team to claim your
          complimentary access to the premium course.
        </p>
        <div className="mt-6">
          <Button asChild size="lg" variant="outline">
            <a href={TTA_CONTACT_URL} target="_blank" rel="noopener noreferrer">
              Contact Client Services
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
