import { createFileRoute, Link } from '@tanstack/react-router';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { PortalFreeResourcesSection } from '@/components/portal/portal-free-resources-section';
import { PortalPremiumCourseSection } from '@/components/portal/portal-premium-course-section';
import {
  PortalBeginTodaySection,
  PortalCommunitySection,
  PortalHowItWorksSection,
  PortalTtaMembersSection,
} from '@/components/portal/portal-tail-sections';
import { publicStorageUrl } from '@/lib/public-assets';

const PORTAL_HEADER_IMAGE = publicStorageUrl('portal/header.jpg');

export const Route = createFileRoute('/portal')({
  component: PortalPage,
});

function PortalPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-brand-dark">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_50%,rgba(91,91,214,0.18),transparent_70%)]" />
          <div className="relative mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8a8f0]">
              The Beyond Grades Portal
            </p>
            <h1 className="max-w-[700px] font-serif text-4xl font-bold leading-[1.12] tracking-[-0.02em] text-white md:text-[56px]">
              Everything You Need to Navigate DSA,
              <br />
              <em className="font-normal text-[#a8a8f0]">In One Place.</em>
            </h1>
            <p className="mt-5 max-w-[520px] font-light leading-[1.7] text-white/65">
              Open to explore immediately. Start with the seminar resources or go straight into the
              full DSA interview course.
            </p>

            <div className="mt-12 max-w-[560px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">
              <p className="border-b border-white/10 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">
                DSA Seminar Preview
              </p>
              {PORTAL_HEADER_IMAGE ? (
                <img
                  src={PORTAL_HEADER_IMAGE}
                  alt="Beyond Grades DSA seminar preview"
                  className="block h-auto w-full"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className="h-[200px] bg-brand-indigo/15" />
              )}
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Link
                to="/dashboard"
                className="rounded-[7px] bg-brand-indigo px-7 py-3.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Acess Free Resources
              </Link>
            </div>
          </div>
        </section>
        <PortalFreeResourcesSection />
        <PortalPremiumCourseSection />
        <PortalCommunitySection />
        <PortalHowItWorksSection />
        <PortalBeginTodaySection />
        <PortalTtaMembersSection />
      </main>
      <Footer />
    </div>
  );
}
