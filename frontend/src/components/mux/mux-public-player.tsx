import MuxPlayer from '@mux/mux-player-react';
import { muxEnvKey } from '@/lib/mux';

export interface MuxPublicPlayerProps {
  playbackId: string;
  title: string;
  className?: string;
  initialExpanded?: boolean;
}

export function MuxPublicPlayer({
  playbackId,
  title,
  className,
  initialExpanded = false,
}: MuxPublicPlayerProps) {
  const envKey = muxEnvKey();

  return (
    <MuxPlayer
      className={className ?? 'aspect-video w-full'}
      playbackId={playbackId}
      metadataVideoTitle={title}
      {...(envKey ? { envKey } : {})}
      playsInline
      autoPlay={initialExpanded}
    />
  );
}
