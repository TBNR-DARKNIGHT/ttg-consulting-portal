const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');

function buildApiUrl(path: string): string {
  if (!API_BASE) {
    throw new Error('VITE_API_BASE_URL is not configured');
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

function errorMessageFromJson(error: {
  message?: string;
  detail?: string | unknown[];
  error?: { message?: string };
}): string | undefined {
  const detail =
    typeof error.detail === 'string'
      ? error.detail
      : Array.isArray(error.detail)
        ? error.detail.map(String).join(', ')
        : undefined;
  return error.error?.message || error.message || detail;
}

export function hasApiBaseUrl(): boolean {
  return Boolean(API_BASE?.trim());
}

export function getApiUrl(path: string): string {
  return buildApiUrl(path);
}

export async function apiFetchPublic<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
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
    throw new Error(errorMessageFromJson(error) || `HTTP ${res.status}`);
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
    throw new Error(errorMessageFromJson(error) || `HTTP ${res.status}`);
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
    let message = text || `HTTP ${res.status}`;
    try {
      const json = JSON.parse(text) as {
        message?: string;
        detail?: string;
        error?: { message?: string };
      };
      message = json.error?.message || json.message || json.detail || message;
    } catch {
      // Keep the response text when the error body is not JSON.
    }
    throw new Error(message);
  }

  return await res.blob();
}
