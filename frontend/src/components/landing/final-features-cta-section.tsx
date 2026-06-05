import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export function FinalFeaturesCtaSection() {
  return (
    <section className="w-full bg-brand-indigo">
      <div className="mx-auto max-w-[1200px] px-6 py-18 md:py-22 text-center">
        <h2 className="text-white text-3xl md:text-[44px] font-bold tracking-[-0.02em] leading-[1.08]">
          Ready to Begin?
        </h2>
        <p className="mt-5 text-white/90 text-base md:text-lg leading-relaxed max-w-[760px] mx-auto">
          Join families who use the Beyond Grades framework to approach DSA with strategy rather
          than anxiety.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 bg-white text-brand-dark hover:bg-white/90">
            <Link to="/portal">Explore the Portal - Free to Join</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 border-white text-white hover:bg-white/10"
          >
            <Link to="/consult">Book a Consulting Call</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

