import { YoutubeShortsVideoCard } from '@/components/landing/youtube-shorts-video-card';

export function PromoVideoCardSection() {
  return (
    <section className="w-full border-b border-brand-dark/15 bg-brand-cream">
      <div className="mx-auto max-w-[960px] px-5 py-14 md:px-8 md:py-16">
        <YoutubeShortsVideoCard
          videoId="o75xaFFw0vU"
          title="BeyondGrades intro video"
          headerText="Hear their aspirations. See their potential"
        />
      </div>
    </section>
  );
}
