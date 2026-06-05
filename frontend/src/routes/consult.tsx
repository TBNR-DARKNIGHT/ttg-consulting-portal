import { createFileRoute } from '@tanstack/react-router';
import { ConsultUsSection } from '@/components/consult/consult-us-section';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';

export const Route = createFileRoute('/consult')({
  component: ConsultPage,
});

function ConsultPage() {
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
