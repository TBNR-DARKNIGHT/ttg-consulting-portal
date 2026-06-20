import { createFileRoute, Link } from '@tanstack/react-router';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { PortalFreeResourcesSection } from '@/components/portal/portal-free-resources-section';
import { PortalPremiumCourseSection } from '@/components/portal/portal-premium-course-section';
import {
  PortalBeginTodaySection,
  PortalCommunitySection,
  PortalTtaMembersSection,
} from '@/components/portal/portal-tail-sections';
import { Button } from '@/components/ui/button';
import { publicStorageUrl } from '@/lib/public-assets';

const PORTAL_HEADER_IMAGE = publicStorageUrl('portal/header.jpg');

export const Route = createFileRoute('/portal')({
  component: PortalPage,
});

function PortalPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-[1000px] px-6 pt-4 pb-16 md:py-24">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-brand-dark md:text-5xl">
          Everything You Need to Navigate DSA, In One Place.
        </h1>

        {PORTAL_HEADER_IMAGE ? (
          <div className="mx-auto mt-6 max-w-[520px] overflow-hidden rounded-xl border border-brand-grey">
            <img
              src={PORTAL_HEADER_IMAGE}
              alt=""
              className="w-full object-cover"
              loading="eager"
              decoding="async"
            />
          </div>
        ) : null}

        <p className="mx-auto mt-6 max-w-[520px] text-center text-lg leading-relaxed text-brand-dark/80 md:text-xl">
          Free to join. Immediately useful. And when you are ready to go deeper, we will be here.
        </p>

        <div className="mx-auto mt-6 flex max-w-[520px] flex-col items-center">
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

        <PortalFreeResourcesSection />
        <PortalPremiumCourseSection />
        <PortalCommunitySection />
        <PortalBeginTodaySection />
        <PortalTtaMembersSection />
      </main>
      <Footer />
    </div>
  );
}
