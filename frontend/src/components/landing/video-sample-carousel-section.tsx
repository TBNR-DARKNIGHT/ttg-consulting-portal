import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

type VideoTeaser = {
  id: string;
  benefit: string;
  quote: string;
};

const teasers: VideoTeaser[] = [
  {
    id: 'teaser-1',
    benefit: 'Clearer answers, confident interviews',
    quote:
      '“The interview framework and practice prompts made our answers much clearer — we walked in confident and prepared.”',
  },
  {
    id: 'teaser-2',
    benefit: 'School-aligned prep and practice feedback',
    quote:
      '“The modules broke down what schools really look for. The mock questions and feedback loop were a game changer.”',
  },
  {
    id: 'teaser-3',
    benefit: 'Structured plan and faster iteration',
    quote:
      '“We finally had a step-by-step plan. The community answers helped us avoid common mistakes and iterate fast.”',
  },
];

export function VideoSampleCarouselSection() {
  const [activeIdx, setActiveIdx] = useState(1);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  /** Portrait FAQ clips: narrow cards so height stays manageable in the carousel. */
  const cardWidthClass =
    'w-[min(88vw,300px)] sm:w-[min(52vw,280px)] md:w-[min(38vw,300px)] lg:w-[280px]';

  const scrollToIndex = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;

    const clamped = Math.max(0, Math.min(teasers.length - 1, idx));
    const card = el.querySelector<HTMLElement>(`[data-carousel-idx="${clamped}"]`);
    if (!card) return;

    setActiveIdx(clamped);
    card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const onPrev = () => scrollToIndex(activeIdx - 1);
  const onNext = () => scrollToIndex(activeIdx + 1);

  // Center the middle card on initial render (and keep stable).
  useEffect(() => {
    const t = window.setTimeout(() => scrollToIndex(1), 0);
    return () => window.clearTimeout(t);
  }, []);

  const headingId = useMemo(() => 'frequently-asked-questions', []);

  return (
    <section aria-labelledby={headingId} className="w-full bg-brand-grey/30">
      <div className="mx-auto max-w-[1200px] px-6 py-18 md:py-22">
        <div className="flex items-center justify-between gap-4 mb-8 md:mb-10">
          <div className="flex-1" />
          <h2
            id={headingId}
            className="flex-1 text-center text-brand-dark text-3xl md:text-[40px] font-bold tracking-[-0.02em]"
          >
            Frequently Asked Questions
          </h2>
          <div className="flex-1" />
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 hidden items-center justify-between md:flex">
            <div className="pointer-events-auto">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onPrev}
                disabled={activeIdx === 0}
                className="h-11 w-11 rounded-full border-brand-grey bg-white/80 hover:bg-white shadow-sm"
                aria-label="Previous FAQ video"
              >
                <ChevronLeft className="h-5 w-5 text-brand-dark" />
              </Button>
            </div>
            <div className="pointer-events-auto">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onNext}
                disabled={activeIdx === teasers.length - 1}
                className="h-11 w-11 rounded-full border-brand-grey bg-white/80 hover:bg-white shadow-sm"
                aria-label="Next FAQ video"
              >
                <ChevronRight className="h-5 w-5 text-brand-dark" />
              </Button>
            </div>
          </div>

          <div
            ref={scrollerRef}
            className="flex gap-5 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory px-4 sm:px-[8%] md:px-[12%] pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {teasers.map((t, idx) => {
              const isActive = idx === activeIdx;
              return (
                <article
                  key={t.id}
                  data-carousel-idx={idx}
                  className={[
                    'snap-center shrink-0',
                    cardWidthClass,
                    'transition-transform duration-300',
                    isActive ? 'md:scale-[1.03]' : 'md:scale-[0.96] opacity-95',
                  ].join(' ')}
                >
                  <div className="rounded-2xl overflow-hidden border border-brand-grey bg-white shadow-[0_18px_50px_-40px_rgba(26,26,46,0.25)]">
                    {/* Portrait FAQ video placeholder (9:16) */}
                    <div className="relative aspect-[9/16] w-full bg-linear-to-br from-brand-indigo via-brand-indigo/85 to-brand-sage/55">
                      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_45%),radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.25),transparent_45%)]" />

                      <div className="absolute inset-0 grid place-items-center">
                        <div className="h-14 w-14 rounded-full bg-white/95 shadow-sm grid place-items-center">
                          <Play className="h-6 w-6 text-brand-indigo fill-brand-indigo translate-x-px" />
                        </div>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-4 pt-16 bg-linear-to-t from-black/65 via-black/15 to-transparent">
                        <div className="text-white font-semibold text-base leading-snug sm:text-lg">
                          {t.benefit}
                        </div>
                      </div>
                    </div>

                    {/* Quote */}
                    <div className="px-6 py-5">
                      <p className="text-brand-dark/85 leading-relaxed line-clamp-3">{t.quote}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
