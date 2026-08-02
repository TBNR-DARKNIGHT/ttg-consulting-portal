import MuxPlayer from '@mux/mux-player-react';
import type { ComponentProps } from 'react';
import { muxEnvKey } from '@/lib/mux';

type MuxPlayerProps = ComponentProps<typeof MuxPlayer>;

export interface MuxSignedPlayerProps {
  playbackId: string;
  playbackToken: string;
  title: string;
  startTime?: number;
  onTimeUpdate?: MuxPlayerProps['onTimeUpdate'];
  onPause?: MuxPlayerProps['onPause'];
  onEnded?: MuxPlayerProps['onEnded'];
  onError?: () => void;
}

export function MuxSignedPlayer({
  playbackId,
  playbackToken,
  title,
  startTime,
  onTimeUpdate,
  onPause,
  onEnded,
  onError,
}: MuxSignedPlayerProps) {
  const envKey = muxEnvKey();

  return (
    <MuxPlayer
      className="aspect-video w-full"
      playbackId={playbackId}
      tokens={{ playback: playbackToken }}
      metadataVideoTitle={title}
      {...(envKey ? { envKey } : {})}
      {...(startTime ? { startTime } : {})}
      playsInline
      onTimeUpdate={onTimeUpdate}
      onPause={onPause}
      onEnded={onEnded}
      onError={onError}
    />
  );
}
