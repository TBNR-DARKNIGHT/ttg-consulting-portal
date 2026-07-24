const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');

type ApiErrorBody = {
  message?: string;
  detail?: string | unknown[];
  error?: { message?: string };
};

function buildApiUrl(path: string): string {
  if (!API_BASE) {
    throw new Error('VITE_API_BASE_URL is not configured');
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

function errorMessageFromJson(error: ApiErrorBody): string | undefined {
  const detail =
    typeof error.detail === 'string'
      ? error.detail
      : Array.isArray(error.detail)
        ? error.detail.map(String).join(', ')
        : undefined;
  return error.error?.message || error.message || detail;
}

async function errorMessageFromResponse(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  if (!text) {
    return `HTTP ${res.status}`;
  }

  try {
    return errorMessageFromJson(JSON.parse(text) as ApiErrorBody) || text;
  } catch {
    return text;
  }
}

async function parseApiResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(await errorMessageFromResponse(res));
  }

  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.data as T;
}

export function hasApiBaseUrl(): boolean {
  return Boolean(API_BASE?.trim());
}

export function getApiUrl(path: string): string {
  return buildApiUrl(path);
}

export async function apiFetchPublic<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return parseApiResponse<T>(res);
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

  return parseApiResponse<T>(res);
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
    throw new Error(await errorMessageFromResponse(res));
  }

  return await res.blob();
}
