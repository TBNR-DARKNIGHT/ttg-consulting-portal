import { YoutubeShortsVideoCard } from '@/components/landing/youtube-shorts-video-card';

export function PromoVideoCardSection() {
  return (
    <section className="w-full bg-brand-cream">
      <div className="mx-auto max-w-[1200px] px-6 pb-16 md:pb-20">
        <YoutubeShortsVideoCard
          videoId="o75xaFFw0vU"
          title="BeyondGrades intro video"
          headerText="Hear their aspirations. See their potential"
        />
      </div>
    </section>
  );
}
