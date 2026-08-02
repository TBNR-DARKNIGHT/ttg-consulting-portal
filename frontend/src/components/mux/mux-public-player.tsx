import MuxPlayer from '@mux/mux-player-react';
import type { ComponentProps } from 'react';
import { muxEnvKey } from '@/lib/mux';

type MuxPlayerProps = ComponentProps<typeof MuxPlayer>;

export interface MuxPublicPlayerProps {
  playbackId: string;
  title: string;
  className?: string;
  initialExpanded?: boolean;
  startTime?: number;
  onTimeUpdate?: MuxPlayerProps['onTimeUpdate'];
  onPause?: MuxPlayerProps['onPause'];
  onEnded?: MuxPlayerProps['onEnded'];
}

export function MuxPublicPlayer({
  playbackId,
  title,
  className,
  initialExpanded = false,
  startTime,
  onTimeUpdate,
  onPause,
  onEnded,
}: MuxPublicPlayerProps) {
  const envKey = muxEnvKey();

  return (
    <MuxPlayer
      className={className ?? 'aspect-video w-full'}
      playbackId={playbackId}
      metadataVideoTitle={title}
      {...(envKey ? { envKey } : {})}
      {...(startTime ? { startTime } : {})}
      playsInline
      autoPlay={initialExpanded}
      onTimeUpdate={onTimeUpdate}
      onPause={onPause}
      onEnded={onEnded}
    />
  );
}
