const TTA_CLIENT_SERVICES_WA = 'https://wa.me/6597692396';

export function TtaFamilyNoteSection() {
  return (
    <section className="w-full border-b border-brand-dark/15 bg-[#e8e8fa]">
      <div className="mx-auto max-w-[720px] px-5 py-16 text-center md:px-8 md:py-20">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-indigo">
          For Think Teach Academy Families
        </p>
        <h2 className="text-3xl font-bold leading-[1.2] tracking-[-0.02em] text-brand-dark md:text-[40px]">
          Already a TTA family?
          <br />
          <em className="font-normal text-brand-indigo">Your access is waiting.</em>
        </h2>
        <p className="mt-3 leading-[1.7] text-brand-dark/70">
          If your child is currently enrolled at Think Teach Academy, you already have full access
          to our premium courses at no additional cost. Beyond Grades is part of the Think Teach
          Group. To claim your complimentary access, reach out to our client services team.
        </p>
        <a
          href={TTA_CLIENT_SERVICES_WA}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-[7px] bg-brand-indigo px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Contact Client Services
        </a>
      </div>
    </section>
  );
}
