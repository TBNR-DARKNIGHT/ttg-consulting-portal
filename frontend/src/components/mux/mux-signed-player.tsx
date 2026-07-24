import MuxPlayer from '@mux/mux-player-react';
import { muxEnvKey } from '@/lib/mux';

export interface MuxSignedPlayerProps {
  playbackId: string;
  playbackToken: string;
  title: string;
  onError?: () => void;
}

export function MuxSignedPlayer({
  playbackId,
  playbackToken,
  title,
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
      playsInline
      onError={onError}
    />
  );
}
