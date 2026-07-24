const programmes = [
  {
    entity: 'Think Teach Academy',
    name: 'DSA Programme',
    icon: '\uD83C\uDFAF',
    description:
      'Expert guidance for Direct School Admission pathways, interview preparation, and portfolio development.',
  },
  {
    entity: 'MapleBear',
    name: 'Student Care & Young Explorers',
    icon: '\uD83C\uDF3F',
    description:
      'Public speaking recordings, enrichment resources, and programme transparency for parents.',
  },
  {
    entity: 'Macro Academy',
    name: 'Base Camp',
    icon: '\u26F0\uFE0F',
    description:
      'Structured pathway development resources and insights for secondary school readiness.',
  },
  {
    entity: 'Macro Academy',
    name: 'University Consulting',
    icon: '\uD83C\uDF93',
    description:
      'Application strategy, personal statements, portfolio building, and interview preparation.',
  },
] as const;

export function ProgrammesSection() {
  return (
    <section id="programmes" className="mx-auto max-w-[1200px] px-6 py-16">
      <p className="text-xs uppercase tracking-[0.2em] font-medium text-brand-indigo mb-3">
        Our programmes
      </p>
      <h2 className="font-serif text-3xl md:text-[32px] font-bold text-brand-dark mb-10">
        Consulting Across Every Stage
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {programmes.map((prog) => (
          <article
            key={prog.name}
            className="group rounded-xl border border-brand-grey bg-white px-6 py-7 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          >
            <span className="text-[28px] block mb-3" role="img" aria-label={prog.name}>
              {prog.icon}
            </span>
            <p className="text-[11px] uppercase tracking-[0.15em] font-medium text-brand-indigo mb-1">
              {prog.entity}
            </p>
            <h3 className="text-lg font-semibold text-brand-dark mb-2">{prog.name}</h3>
            <p className="text-sm text-brand-dark/70 leading-relaxed">{prog.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
