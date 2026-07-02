export function TtaFamilyNoteSection() {
  return (
    <section className="w-full bg-brand-cream">
      <div className="mx-auto max-w-[1200px] px-6 py-14 md:py-18">
        <div className="rounded-2xl border border-brand-grey bg-white px-6 py-7 md:px-8 md:py-9">
          <h2 className="text-brand-dark text-2xl md:text-3xl font-bold tracking-[-0.01em]">
            A Note For Think Teach Academy Families
          </h2>

          <div className="mt-4 space-y-4 text-brand-dark/80 leading-relaxed">
            <p>
              If your child is currently enrolled at Think Teach Academy, you already have full
              access to our premium courses - at no additional cost.
            </p>
            <p>
              Beyond Grades is part of the Think Teach Group, the same team behind Think Teach
              Academy, MACRO Academy and the education approach featured in The Straits Times,
              Channel NewsAsia, and Bloomberg. As a TTA family, your membership extends here
              automatically.
            </p>
            <p>
              To claim your complimentary access, simply reach out to our client services team and
              we will get you set up.
            </p>
          </div>

          <div className="mt-6 flex flex-col items-start gap-3">
            <a
              href="https://wa.me/6597692396"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center rounded-md bg-brand-dark px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Contact Client Services
            </a>
            <a
              href="https://www.thinkteachacademy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-indigo underline underline-offset-4 hover:opacity-80"
            >
              Not a TTA family yet? Learn more about Think Teach Academy
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
