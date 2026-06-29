const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');

function buildApiUrl(path: string): string {
  if (!API_BASE) {
    throw new Error('VITE_API_BASE_URL is not configured');
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

export function hasApiBaseUrl(): boolean {
  return Boolean(API_BASE?.trim());
}

export async function apiFetchPublic<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = buildApiUrl(path);

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = (await res.json().catch(() => ({}))) as {
      message?: string;
      detail?: string | unknown[];
      error?: { message?: string };
    };
    const detail =
      typeof error.detail === 'string'
        ? error.detail
        : Array.isArray(error.detail)
          ? error.detail.map(String).join(', ')
          : undefined;
    throw new Error(error.error?.message || error.message || detail || `HTTP ${res.status}`);
  }

  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.data as T;
}

export async function apiFetch<T>(
  path: string,
  getToken: () => Promise<string | null>,
  options: RequestInit = {},
): Promise<T> {
  if (!API_BASE) {
    throw new Error('VITE_API_BASE_URL is not configured');
  }

  const token = await getToken();
  const res = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const error = (await res.json().catch(() => ({}))) as {
      message?: string;
      detail?: string | unknown[];
      error?: { message?: string };
    };
    const detail =
      typeof error.detail === 'string'
        ? error.detail
        : Array.isArray(error.detail)
          ? error.detail.map(String).join(', ')
          : undefined;
    throw new Error(error.error?.message || error.message || detail || `HTTP ${res.status}`);
  }

  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.data as T;
}

export async function apiFetchBlob(
  path: string,
  getToken: () => Promise<string | null>,
  options: RequestInit = {},
): Promise<Blob> {
  if (!API_BASE) {
    throw new Error('VITE_API_BASE_URL is not configured');
  }

  const token = await getToken();
  const res = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    try {
      const json = JSON.parse(text) as { message?: string; error?: { message?: string } };
      throw new Error(json?.error?.message || json?.message || `HTTP ${res.status}`);
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }

  return await res.blob();
}

export interface StorageUrlResponse {
  bucket: string;
  path: string;
  is_paid: boolean;
  url: string;
  expires_in: number | null;
}

/** Same shape as Supabase `getPublicUrl` — avoids a round-trip when `VITE_SUPABASE_URL` is set. */
function supabasePublicObjectUrl(bucket: string, objectPath: string): string | null {
  const raw = import.meta.env.VITE_SUPABASE_URL;
  if (!raw?.trim()) return null;
  const base = raw.replace(/\/+$/, '');
  const b = bucket.replace(/^\/+/, '').replace(/\/+$/, '');
  const path = objectPath.replace(/^\/+/, '');
  if (!b || !path) return null;
  return `${base}/storage/v1/object/public/${b}/${path}`;
}

export function getPublicStorageUrl(
  params: { bucket: string; path: string },
  getToken: () => Promise<string | null>,
): Promise<StorageUrlResponse> {
  const direct = supabasePublicObjectUrl(params.bucket, params.path);
  if (direct) {
    return Promise.resolve({
      bucket: params.bucket,
      path: params.path,
      is_paid: false,
      url: direct,
      expires_in: null,
    });
  }

  const encodedBucket = encodeURIComponent(params.bucket);
  const encodedPath = encodeURIComponent(params.path);
  return apiFetch<StorageUrlResponse>(`/storage/public-url?bucket=${encodedBucket}&path=${encodedPath}`, getToken);
}

export interface MuxPlaybackTokenResponse {
  token: string;
  expiresAt: number;
}

export function getMuxPlaybackToken(
  params: { resourceId: string; expiresIn?: number },
  getToken: () => Promise<string | null>,
): Promise<MuxPlaybackTokenResponse> {
  const q = new URLSearchParams({ resource_id: params.resourceId });
  if (params.expiresIn != null) {
    q.set('expires_in', String(params.expiresIn));
  }
  return apiFetch<MuxPlaybackTokenResponse>(`/playback/mux-token?${q.toString()}`, getToken);
}

export interface PortalPreview {
  id: string;
  title: string;
  muxPlaybackId: string;
  duration: string;
}

export function getPortalCoursePreviews(): Promise<PortalPreview[]> {
  return apiFetchPublic<PortalPreview[]>('/portal/course-previews');
}
