import { Link } from '@tanstack/react-router';

export function YoungExplorersTeaserSection() {
  return (
    <section className="w-full border-b border-brand-dark/15 bg-brand-cream">
      <div className="mx-auto max-w-[960px] px-5 py-16 md:px-8 md:py-20">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">
          Building Confident Communicators From the Start
        </p>
        <h2 className="text-3xl font-bold leading-[1.15] tracking-[-0.02em] text-brand-dark md:text-[40px]">
          Confidence begins
          <br />
          <em className="font-normal text-brand-indigo">earlier than you think.</em>
        </h2>

        <div className="mt-12 grid items-center gap-10 rounded-xl border border-brand-dark/15 bg-white px-8 py-10 md:grid-cols-2 md:px-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-indigo">
              In partnership with MapleBear Student Care
            </p>
            <h3 className="mt-3 text-2xl font-bold text-brand-dark">Young Explorers Programme</h3>
            <p className="mt-3 text-[15px] leading-[1.7] text-brand-dark/70">
              A year-long public speaking and personal expression programme for Primary 1 to 6
              students, delivered by the Beyond Grades team in Singapore and Shanghai.
            </p>
            <Link
              to="/young-explorers"
              className="mt-5 inline-flex text-[13px] font-semibold text-brand-indigo hover:opacity-75"
            >
              Learn More About Young Explorers <span aria-hidden className="ml-1.5">→</span>
            </Link>
          </div>
          <div className="flex flex-wrap gap-8">
            {[
              ['12', 'Engaging modules'],
              ['P1–P6', 'All primary levels'],
              ['2', 'Countries'],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-serif text-2xl font-bold text-brand-dark">{value}</p>
                <p className="mt-1 text-xs text-brand-dark/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
