import { createFileRoute, Link } from '@tanstack/react-router';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/portal')({
  component: PortalPage,
});

function PortalPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-[1000px] px-6 py-16 md:py-24">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-brand-dark md:text-5xl">
          Everything You Need to Navigate DSA, In One Place.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-brand-dark/80 md:text-lg">
          The Beyond Grades Portal is your starting point. Join free, access our foundational frameworks immediately, and unlock premium courses when you are ready. 
          No pressure, no deadlines — just the tools, strategies, and insider knowledge your child needs to build a standout profile.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link to="/auth/sign-up">Create Your Free Account</Link>
          </Button>
          <p className="mt-3 text-sm text-brand-dark/70">
            Already a member?{' '}
            <Link to="/auth/login" className="text-brand-indigo underline underline-offset-4">
              Log in
            </Link>
          </p>
        </div>

        <section className="mt-10 rounded-2xl border border-brand-grey bg-brand-grey/20 p-6">
          <h2 className="text-2xl font-semibold text-brand-dark">Your DSA Command Centre</h2>
          <h3 className="mt-6 text-lg font-semibold text-brand-dark">Free on Signup</h3>
          <p className="mt-2 text-brand-dark/75 leading-relaxed">
            The moment you create an account, you gain immediate access to three resources drawn
            directly from our work with students across Singapore.
          </p>
          <p className="mt-3 text-brand-dark/75 leading-relaxed">
            The first is a series of bite-sized video clips covering the history of DSA, the most
            common misconceptions that trip families up, how to choose the right domain for your
            child&apos;s profile, and the interview questions that come up most consistently across
            schools.
          </p>
          <p className="mt-3 text-brand-dark/75 leading-relaxed">
            The second is our Opportunities Directory - a curated guide to competitions,
            programmes, and experiences across primary and secondary levels, organised by domain
            and stage of learning. It is the resource we wish every family had at the start of the
            DSA journey, before the window for building a meaningful profile quietly closes.
          </p>
          <p className="mt-3 text-brand-dark/75 leading-relaxed">
            The third is our 8 Golden Rules for Acing DSA Interviews - a guide built from real
            experience on both sides of the interview process. It covers everything from how to
            make your first three seconds count, to why the best interviews never feel like
            interviews at all. Practical, honest, and written for students who want to walk into
            any room with genuine confidence.
          </p>
          <p className="mt-3 text-brand-dark/75 leading-relaxed">
            These are not previews. They are complete, immediately usable resources that will
            change how your family approaches the DSA journey from day one.
          </p>

          <h3 className="mt-6 text-lg font-semibold text-brand-dark">
            Premium Course - Ace Your DSA Interview
          </h3>
          <p className="mt-2 text-brand-dark/75 leading-relaxed">
            For families who want to go further, this is the most structured and complete DSA
            interview preparation resource we offer.
          </p>
          <p className="mt-3 text-brand-dark/75 leading-relaxed">
            Built across four modules, it takes your child from research to interview close. They
            will learn how to study a school with genuine depth rather than surface-level facts,
            how to construct a compelling answer to the first question every interviewer asks - tell
            me about yourself - how to build a personal Story Bank that works across any question
            they face, and how to leave a lasting final impression when most candidates simply say
            thank you and walk out.
          </p>
          <p className="mt-3 text-brand-dark/75 leading-relaxed">
            Every module pairs short on-camera coaching with a companion worksheet your child
            completes as they go. By the end of the course, they will have done the real work of
            preparation - not just watched it being explained.
          </p>
          <p className="mt-3 text-brand-dark/75 leading-relaxed">
            Because we know parents are as invested in this process as their children, the course
            also comes with a dedicated Parent Overview Guide - written specifically so you
            understand what is being taught, how to support your child through it, and where to
            step back.
          </p>
          <p className="mt-3 text-brand-dark/75 leading-relaxed">
            This is not a course about performing well in an interview. It is a course about
            showing up as your genuine best self - prepared, specific, and ready for a real
            conversation.
          </p>
          <p className="mt-3 text-sm italic text-brand-dark/70 leading-relaxed">
            [Each course listing shows a preview of the first module. Full access unlocked on
            purchase.]
          </p>
          <h3 className="mt-6 text-lg font-semibold text-brand-dark">
            Community and Live Q&A (Coming Soon)
          </h3>
          <p className="mt-2 text-brand-dark/75 leading-relaxed">
            Portal members gain access to our community space - a dedicated environment for
            questions, shared experiences, and real-time insights from families at every stage of
            the DSA journey. Our team hosts regular live Q and A sessions where you can put your
            specific questions directly to the Beyond Grades founders.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-brand-grey bg-white p-6">
          <h2 className="text-2xl font-semibold text-brand-dark">
            Start Free. Go Deeper When You Are Ready.
          </h2>
          <ol className="mt-4 grid gap-3 text-brand-dark/80 list-decimal pl-5 leading-relaxed">
            <li>
              Create your free account and gain immediate access to our DSA seminar clips, the
              Opportunities Directory, and the 8 Golden Rules for Acing DSA Interviews.
            </li>
            <li>
              Work through the free resources at your own pace and get a clear picture of where
              your child stands and what they need to build next.
            </li>
            <li>
              Preview the Ace Your DSA Interview Course and unlock it when you are ready to move
              from understanding DSA to genuinely preparing for it.
            </li>
            <li>
              Join our community and attend live Q and A sessions to put your specific questions
              directly to the Beyond Grades team.
            </li>
          </ol>
        </section>

        <section className="mt-8 rounded-2xl border border-brand-grey bg-white p-6">
          <h2 className="text-2xl font-semibold text-brand-dark">Begin Today.</h2>
          <p className="mt-3 text-brand-dark/75 leading-relaxed">
            Joining is free. The frameworks are immediately useful. And when you are ready to go
            deeper, we will be here.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/auth/sign-up">Create Your Free Account</Link>
            </Button>
          </div>
          <p className="mt-5 text-brand-dark/75 leading-relaxed">
            Looking for something more structured? Our Group DSA Programme and Executive Consulting
            bring the Beyond Grades team directly to your child - in a cohort setting or one-on-one.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <Link to="/group-programme" className="text-brand-indigo underline underline-offset-4">
              View the Group Programme
            </Link>
            <Link to="/consult" className="text-brand-indigo underline underline-offset-4">
              Book a Consulting Call
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
