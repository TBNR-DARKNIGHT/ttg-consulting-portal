import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { publicStorageUrl } from '@/lib/public-assets';

const EXECUTIVE_CONSULTING_IMAGE = publicStorageUrl('landing/executive_counsulting.jpg');
const PERSONALIZED_NEXT_STEPS_IMAGE = publicStorageUrl('landing/personalized_next_steps.jpg');

export function ConsultUsSection() {
  return (
    <section className="bg-white pt-8 pb-16 md:pt-10 md:pb-24" aria-label="Consultation details">
      <div className="mx-auto max-w-[900px] px-6">
        <div className="mx-auto max-w-3xl">
          {EXECUTIVE_CONSULTING_IMAGE ? (
            <div className="mx-auto mb-6 max-w-[520px] overflow-hidden rounded-xl border border-brand-grey">
              <img
                src={EXECUTIVE_CONSULTING_IMAGE}
                alt="Executive consulting session"
                className="w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : null}

          <h1 className="font-serif text-3xl font-bold tracking-tight text-brand-dark md:text-4xl">
            Clarity on Your Child&apos;s DSA Journey. In a Single Conversation.
          </h1>
          <div className="mt-5 space-y-4 text-base leading-relaxed text-brand-dark/80">
            <p>
            Every child’s profile is different. The right domain, the right schools, the right preparation focus. 
            And none of that can be answered by a generic checklist. 
            Our Initial Consultation gives you an honest, personalised assessment of where your child stands and what a realistic path forward looks like.
            </p>
          </div>
          <div className="mt-5">
            <Button asChild>
              <a href="https://wa.me/6597692396" target="_blank" rel="noopener noreferrer">
                Book Your Initial Consultation
              </a>
            </Button>
          </div>

          <div className="mt-8 grid gap-4 rounded-2xl border border-brand-grey bg-brand-grey/20 p-6">
            <h2 className="text-xl font-semibold text-brand-dark">What to Expect</h2>
            <p className="text-brand-dark/75">
              A focused 1-on-1 session with a member of our team. We cover five areas:
            </p>
            <ul className="grid gap-3 text-sm md:text-base text-brand-dark/80">
              <li>
                <span className="font-semibold text-brand-dark">Holistic Profile Understanding:</span>{' '}
                We look beyond grades to understand your child&apos;s genuine strengths, interests,
                and experiences, and identify the domains where they can present themselves
                authentically.
              </li>
              <li>
                <span className="font-semibold text-brand-dark">Identifying the Right Domain:</span>{' '}
                We help you determine which areas genuinely fit your child&apos;s profile and what
                specific schools look for, so you invest your time and effort in a direction that
                makes sense for them.
              </li>
              <li><span className="font-semibold text-brand-dark">Portfolio Evaluation:</span> We review what your child has already built, identify what carries real weight with selection panels, and share honest feedback on where the gaps are.</li>
              <li>
                <span className="font-semibold text-brand-dark">Interview Readiness Assessment:</span>{' '}
                We give your child an honest picture of where they stand relative to what schools
                are looking for, and what they need to work on before the application window.
              </li>
              <li>
                <span className="font-semibold text-brand-dark">Personalised Next Steps:</span>{' '}
                Every session ends with a clear, realistic plan your family can act on immediately.
              </li>
            </ul>
          </div>

          {PERSONALIZED_NEXT_STEPS_IMAGE ? (
            <div className="mx-auto mt-8 mb-8 max-w-[520px] overflow-hidden rounded-xl border border-brand-grey">
              <img
                src={PERSONALIZED_NEXT_STEPS_IMAGE}
                alt="Personalized next steps"
                className="w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : null}

          <div className="mt-8 rounded-2xl border border-brand-grey bg-white p-6">
            <h3 className="text-xl font-semibold text-brand-dark">Our Approach</h3>
            <p className="mt-3 text-brand-dark/75 leading-relaxed">
              DSA selection is designed to identify students who know themselves well - their
              interests, their strengths, and their reasons for pursuing a particular pathway. Our
              role is not to manufacture a profile, but to help your child develop the
              self-awareness and clarity to present who they genuinely are with confidence. The
              students who do well in DSA interviews are rarely the most polished. They are the
              most prepared to be themselves.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-brand-grey bg-white p-6">
            <p className="mt-3 text-brand-dark/75 leading-relaxed">
              Prefer group-based interview preparation? Our DSA Interview Intensive returns each
              April and May.
            </p>
            <Link
              to="/group-programme"
              className="mt-1 inline-block text-brand-indigo underline underline-offset-4"
            >
              Join the 2027 Waitlist
            </Link>
            <p className="mt-4 text-brand-dark/75 leading-relaxed">
              Prefer to start at your own pace? The Beyond Grades Portal is free to join and gives
              you immediate access to our foundational frameworks.
            </p>
            <Link to="/portal" className="mt-1 inline-block text-brand-indigo underline underline-offset-4">
              Explore the Portal
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
