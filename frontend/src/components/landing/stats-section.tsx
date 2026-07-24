const stats = [
  { value: '500+', label: 'Families served' },
  { value: '4', label: 'Programmes' },
  { value: '92%', label: 'Parent satisfaction' },
  { value: '8+', label: 'Years of experience' },
] as const;

export function StatsSection() {
  return (
    <section id="about" className="w-full bg-brand-indigo">
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="rounded-2xl overflow-hidden border-2 border-white/80 bg-brand-indigo">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[2px] bg-white">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center bg-brand-indigo py-8 px-4"
              >
                <span className="font-serif text-[28px] font-bold text-white">{stat.value}</span>
                <span className="text-sm text-white/80 mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
