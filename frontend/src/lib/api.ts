const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");

function buildApiUrl(path: string): string {
  if (!API_BASE) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

export function hasApiBaseUrl(): boolean {
  return Boolean(API_BASE?.trim());
}

export async function apiFetchPublic<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = buildApiUrl(path);

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
      typeof error.detail === "string"
        ? error.detail
        : Array.isArray(error.detail)
          ? error.detail.map(String).join(", ")
          : undefined;
    throw new Error(
      error.error?.message || error.message || detail || `HTTP ${res.status}`,
    );
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
    throw new Error("VITE_API_BASE_URL is not configured");
  }

  const token = await getToken();
  const res = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
      typeof error.detail === "string"
        ? error.detail
        : Array.isArray(error.detail)
          ? error.detail.map(String).join(", ")
          : undefined;
    throw new Error(
      error.error?.message || error.message || detail || `HTTP ${res.status}`,
    );
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
    throw new Error("VITE_API_BASE_URL is not configured");
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
    const text = await res.text().catch(() => "");
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

export interface StorageUrlResponse {
  bucket: string;
  path: string;
  is_paid: boolean;
  url: string;
  expires_in: number | null;
}

/** Same shape as Supabase `getPublicUrl` — avoids a round-trip when `VITE_SUPABASE_URL` is set. */
/** Resolve a public PDF through the backend catalog allowlist. */
export function getPublicStorageUrl(
  params: { resourceId: string },
  getToken: () => Promise<string | null>,
): Promise<StorageUrlResponse> {
  return apiFetch<StorageUrlResponse>(
    `/storage/public-url?resource_id=${encodeURIComponent(params.resourceId)}`,
    getToken,
  );
}

export function getPaidStorageUrl(
  params: { resourceId: string; expiresIn?: number },
  getToken: () => Promise<string | null>,
): Promise<StorageUrlResponse> {
  const query = new URLSearchParams({
    resource_id: params.resourceId,
    expires_in: String(params.expiresIn ?? 3600),
  });
  return apiFetch<StorageUrlResponse>(`/storage/paid-url?${query}`, getToken);
}

export function getPdfThumbnailUrl(
  resourceId: string,
  getToken: () => Promise<string | null>,
): Promise<StorageUrlResponse> {
  return apiFetch<StorageUrlResponse>(
    `/storage/thumbnail-url?resource_id=${encodeURIComponent(resourceId)}`,
    getToken,
  );
}

export interface MuxPlaybackTokenResponse {
  token: string;
  expiresAt: number;
}

export interface EntitlementsResponse {
  courses: string[];
}

export interface RedemptionResponse {
  courseId: string;
  status: "granted";
}

export interface CurrentUserResponse {
  id: string;
  clerkUserId: string;
  email: string | null;
  role: "ADMIN" | "CONSULTANT" | "CLIENT";
}

export interface AdminAccessCode {
  id: string;
  courseId: string;
  orderId: string | null;
  redeemedByUserId: string | null;
  redeemedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  createdByUserId: string | null;
  revokedAt: string | null;
  revokedByUserId: string | null;
  revocationReason: string | null;
  replacementForCodeId: string | null;
}

export interface IssuedAccessCode {
  id: string;
  code: string;
}

export interface TtaCodeBatch {
  quantity: number;
  sheetTab: string;
}

export function getCurrentUser(
  getToken: () => Promise<string | null>,
): Promise<CurrentUserResponse> {
  return apiFetch<CurrentUserResponse>("/me", getToken);
}

export function getAdminAccessCodes(
  getToken: () => Promise<string | null>,
): Promise<AdminAccessCode[]> {
  return apiFetch<AdminAccessCode[]>("/admin/access-codes", getToken);
}

export function createAdminAccessCode(
  input: { courseId: string; orderId?: string; expiresAt?: string },
  getToken: () => Promise<string | null>,
): Promise<IssuedAccessCode> {
  return apiFetch<IssuedAccessCode>("/admin/access-codes", getToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createTtaCodeBatch(
  quantity: number,
  getToken: () => Promise<string | null>,
): Promise<TtaCodeBatch> {
  return apiFetch<TtaCodeBatch>("/admin/access-codes/tta-batch", getToken, {
    method: "POST",
    body: JSON.stringify({ quantity }),
  });
}

export function revokeAdminAccessCode(
  id: string,
  reason: string,
  getToken: () => Promise<string | null>,
): Promise<null> {
  return apiFetch<null>(
    `/admin/access-codes/${encodeURIComponent(id)}/revoke`,
    getToken,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}

export function revokeAllActiveAdminAccessCodes(
  reason: string,
  getToken: () => Promise<string | null>,
): Promise<{ revokedCount: number }> {
  return apiFetch<{ revokedCount: number }>(
    "/admin/access-codes/revoke-all-active",
    getToken,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}

export function deleteRevokedAdminAccessCodes(
  reason: string,
  getToken: () => Promise<string | null>,
): Promise<{ deletedCount: number }> {
  return apiFetch<{ deletedCount: number }>(
    "/admin/access-codes/delete-revoked",
    getToken,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}

export function resetTtaOrderNumbering(
  reason: string,
  getToken: () => Promise<string | null>,
): Promise<{ nextOrderId: string }> {
  return apiFetch<{ nextOrderId: string }>(
    "/admin/access-codes/reset-tta-numbering",
    getToken,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}

export function reissueAdminAccessCode(
  id: string,
  reason: string,
  getToken: () => Promise<string | null>,
): Promise<IssuedAccessCode> {
  return apiFetch<IssuedAccessCode>(
    `/admin/access-codes/${encodeURIComponent(id)}/reissue`,
    getToken,
    { method: "POST", body: JSON.stringify({ reason }) },
  );
}

export interface AdminResourceUpload {
  resourceId: string;
  type: "pdf" | "video";
  status: string;
  uploadUrl?: string;
  uploadId?: string;
}

interface AdminDocumentUploadTarget {
  type: "pdf";
  status: string;
  uploadUrl: string;
  uploadId: string;
}

export interface AdminResourceMetadata {
  title: string;
  description: string;
  courseId: string;
  moduleId?: string;
  moduleTitle?: string;
  topic: string;
}

export interface AdminResourceUploadOptions {
  courses: string[];
  topicsByCourse: Record<string, string[]>;
  modulesByCourse: Record<string, Array<{ id: string; title: string }>>;
}

export function getAdminResourceUploadOptions(
  getToken: () => Promise<string | null>,
): Promise<AdminResourceUploadOptions> {
  return apiFetch<AdminResourceUploadOptions>(
    "/admin/resources/options",
    getToken,
  );
}

export function updateAdminResource(
  resourceId: string,
  input: { title: string; topic: string; description: string },
  getToken: () => Promise<string | null>,
): Promise<null> {
  return apiFetch<null>(
    `/admin/resources/${encodeURIComponent(resourceId)}`,
    getToken,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function deleteAdminResource(
  resourceId: string,
  getToken: () => Promise<string | null>,
): Promise<null> {
  return apiFetch<null>(
    `/admin/resources/${encodeURIComponent(resourceId)}`,
    getToken,
    {
      method: "DELETE",
    },
  );
}

export async function replaceAdminDocument(
  resourceId: string,
  file: File,
  getToken: () => Promise<string | null>,
  onProgress: (percent: number) => void,
): Promise<null> {
  const target = await apiFetch<AdminDocumentUploadTarget>(
    `/admin/resources/${encodeURIComponent(resourceId)}/document-replacement`,
    getToken,
    {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/pdf",
        fileSize: file.size,
      }),
    },
  );
  await putSupabaseFileWithProgress(target.uploadUrl, file, onProgress);
  return apiFetch<null>(
    `/admin/resources/${encodeURIComponent(resourceId)}/document-replacement/complete`,
    getToken,
    { method: "POST" },
  );
}

export async function uploadAdminDocument(
  file: File,
  metadata: AdminResourceMetadata,
  getToken: () => Promise<string | null>,
  onProgress: (percent: number) => void,
): Promise<AdminResourceUpload> {
  const target = await apiFetch<AdminDocumentUploadTarget>(
    "/admin/resources/documents",
    getToken,
    {
      method: "POST",
      body: JSON.stringify({
        ...metadata,
        filename: file.name,
        contentType: file.type || "application/pdf",
        fileSize: file.size,
      }),
    },
  );
  await putSupabaseFileWithProgress(target.uploadUrl, file, onProgress);
  return apiFetch<AdminResourceUpload>(
    "/admin/resources/documents/complete",
    getToken,
    {
      method: "POST",
      body: JSON.stringify({ ...metadata, uploadId: target.uploadId }),
    },
  );
}

function putSupabaseFileWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const form = new FormData();
    form.set("cacheControl", "3600");
    form.set("file", file);
    request.open("PUT", url);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error(`PDF upload failed (${request.status})`));
    };
    request.onerror = () =>
      reject(new Error("The connection to document storage was interrupted"));
    request.send(form);
  });
}

export function createAdminVideoUpload(
  file: File,
  metadata: AdminResourceMetadata,
  getToken: () => Promise<string | null>,
): Promise<AdminResourceUpload> {
  return apiFetch<AdminResourceUpload>("/admin/resources/videos", getToken, {
    method: "POST",
    body: JSON.stringify({
      ...metadata,
      contentType: file.type || "video/mp4",
    }),
  });
}

export function createAdminLinkUpload(
  url: string,
  resourceType: "pdf" | "video",
  metadata: AdminResourceMetadata,
  getToken: () => Promise<string | null>,
): Promise<AdminResourceUpload> {
  return apiFetch<AdminResourceUpload>("/admin/resources/links", getToken, {
    method: "POST",
    body: JSON.stringify({ ...metadata, url, resourceType }),
  });
}

export function putFileWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", file.type || "video/mp4");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error(`Mux upload failed (${request.status})`));
    };
    request.onerror = () =>
      reject(new Error("The connection to Mux was interrupted"));
    request.send(file);
  });
}

export function completeAdminVideoUpload(
  resourceId: string,
  uploadId: string,
  getToken: () => Promise<string | null>,
): Promise<AdminResourceUpload> {
  const query = new URLSearchParams({ upload_id: uploadId });
  return apiFetch<AdminResourceUpload>(
    `/admin/resources/videos/${encodeURIComponent(resourceId)}/complete?${query}`,
    getToken,
    { method: "POST" },
  );
}

export function getEntitlements(
  getToken: () => Promise<string | null>,
): Promise<EntitlementsResponse> {
  return apiFetch<EntitlementsResponse>("/me/entitlements", getToken);
}

export function redeemAccessCode(
  code: string,
  getToken: () => Promise<string | null>,
): Promise<RedemptionResponse> {
  return apiFetch<RedemptionResponse>("/entitlements/redeem", getToken, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function getMuxPlaybackToken(
  params: { resourceId: string; expiresIn?: number },
  getToken: () => Promise<string | null>,
): Promise<MuxPlaybackTokenResponse> {
  const q = new URLSearchParams({ resource_id: params.resourceId });
  if (params.expiresIn != null) {
    q.set("expires_in", String(params.expiresIn));
  }
  return apiFetch<MuxPlaybackTokenResponse>(
    `/playback/mux-token?${q.toString()}`,
    getToken,
  );
}

export function getMuxThumbnailToken(
  resourceId: string,
  getToken: () => Promise<string | null>,
): Promise<MuxPlaybackTokenResponse> {
  return apiFetch<MuxPlaybackTokenResponse>(
    `/playback/mux-thumbnail-token?resource_id=${encodeURIComponent(resourceId)}`,
    getToken,
  );
}

export interface PortalPreview {
  id: string;
  title: string;
  muxPlaybackId: string;
  duration: string;
}

export function getPortalCoursePreviews(): Promise<PortalPreview[]> {
  return apiFetchPublic<PortalPreview[]>("/portal/course-previews");
}
