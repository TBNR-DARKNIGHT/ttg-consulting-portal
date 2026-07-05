import { createFileRoute } from '@tanstack/react-router';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { PromoVideoCardSection } from '@/components/landing/promo-video-card-section';
import { StartOptionsSection } from '@/components/landing/start-options-section';
import { BuiltBySection } from '@/components/landing/built-by-section';
import { WhySection } from '@/components/landing/why-section';
import { YoungExplorersTeaserSection } from '@/components/landing/young-explorers-teaser-section';
import { FinalFeaturesCtaSection } from '@/components/landing/final-features-cta-section';
import { TtaFamilyNoteSection } from '@/components/landing/tta-family-note-section';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <main>
        <HeroSection />
        <PromoVideoCardSection />
        <StartOptionsSection />
        <WhySection />
        <BuiltBySection />
        <TtaFamilyNoteSection />
        <YoungExplorersTeaserSection />
        <FinalFeaturesCtaSection />
      </main>
      <Footer />
    </div>
  );
}
