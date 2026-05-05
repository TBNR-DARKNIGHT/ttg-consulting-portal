import { createFileRoute, Navigate } from '@tanstack/react-router';
import { ConsultUsSection } from '@/components/consult/consult-us-section';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { FEATURES } from '@/lib/features';

export const Route = createFileRoute('/consult')({
  component: ConsultPage,
});

function ConsultPage() {
  if (!FEATURES.consult) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <ConsultUsSection />
      </main>
      <Footer />
    </div>
  );
}
