import { TTA_WEBSITE_URL } from '@/lib/tta-shop';

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
          <em className="font-normal text-brand-indigo">You can start now.</em>
        </h2>
        <p className="mt-3 leading-[1.7] text-brand-dark/70">
          The current Beyond Grades courses are open to explore. If your family needs account help
          or programme support, our client services team can point you in the right direction.
        </p>
        <a
          href={TTA_CLIENT_SERVICES_WA}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-[7px] bg-brand-indigo px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Contact Client Services
        </a>
        <a
          href={TTA_WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block text-[13px] font-semibold text-brand-dark/60 transition-colors hover:text-brand-indigo"
        >
          Visit Think Teach Academy →
        </a>
      </div>
    </section>
  );
}
