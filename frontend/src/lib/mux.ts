export function muxThumbnailUrl(
  playbackId: string,
  options?: { width?: number; time?: number },
): string {
  const width = options?.width ?? 640;
  const time = options?.time ?? 1;
  return `https://image.mux.com/${encodeURIComponent(playbackId)}/thumbnail.jpg?width=${width}&time=${time}`;
}

export function muxSignedThumbnailUrl(playbackId: string, token: string): string {
  return `https://image.mux.com/${encodeURIComponent(playbackId)}/thumbnail.jpg?token=${encodeURIComponent(token)}`;
}

export function muxEnvKey(): string | undefined {
  return import.meta.env.VITE_MUX_ENV_KEY?.trim() || undefined;
}
